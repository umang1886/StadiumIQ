# StadiumIQ — Technical Architecture & Implementation Guide
**For:** Antigravity AI / Developer Reference  
**Stack:** React · Flask · Supabase · Google Cloud Run  

---

## 1. Repository Structure

```
stadiumiq/
├── frontend/                    # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/             # VenueMap, ZoneOverlay, POIMarker
│   │   │   ├── queue/           # QueueCard, WaitBadge, AlternativeSuggest
│   │   │   ├── crowdsync/       # SyncGroupPanel, MemberPin, RallyPointPicker
│   │   │   ├── events/          # EventTimeline, AlertBanner
│   │   │   ├── orders/          # MenuBrowser, CartSidebar, OrderStatus
│   │   │   ├── admin/           # HeatmapPanel, QueueControl, IncidentLog
│   │   │   └── ui/              # Button, Badge, Modal, Toast (custom DS)
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── VenueDashboard.jsx
│   │   │   ├── CrowdSync.jsx
│   │   │   ├── Order.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── store/               # Zustand stores
│   │   │   ├── useVenueStore.js
│   │   │   ├── useSyncStore.js
│   │   │   └── useOrderStore.js
│   │   ├── hooks/
│   │   │   ├── useRealtime.js   # Supabase realtime subscriptions
│   │   │   ├── useQueue.js
│   │   │   └── useCrowdSync.js
│   │   ├── lib/
│   │   │   ├── supabase.js      # Supabase client init
│   │   │   └── api.js           # Axios instance → Flask backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Flask API
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py
│   │   ├── models/              # SQLAlchemy-style dicts (using Supabase SDK)
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── venues.py
│   │   │   ├── queues.py
│   │   │   ├── crowdsync.py
│   │   │   ├── events.py
│   │   │   └── orders.py
│   │   ├── services/
│   │   │   ├── queue_predictor.py   # ML model for wait time
│   │   │   ├── crowd_analyzer.py    # Density calculations
│   │   │   └── notification.py      # Alert broadcasting
│   │   └── utils/
│   │       ├── auth_middleware.py   # JWT verification
│   │       └── validators.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed/
│       └── demo_venue.sql
│
├── cloud-run/
│   ├── frontend-service.yaml
│   ├── backend-service.yaml
│   └── cloudbuild.yaml
│
└── README.md
```

---

## 2. Database Schema (Supabase PostgreSQL)

```sql
-- ============================================
-- VENUES & MAP STRUCTURE
-- ============================================

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  capacity INTEGER,
  map_config JSONB,         -- SVG viewBox, zone coordinates, POI positions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  name TEXT NOT NULL,       -- "North Stand Upper", "Concourse B"
  zone_code TEXT,           -- "NSU", "CB"
  map_coordinates JSONB,    -- {x, y, width, height} for SVG rendering
  zone_type TEXT,           -- "seating" | "concourse" | "entrance" | "facility"
  capacity INTEGER
);

CREATE TABLE points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  zone_id UUID REFERENCES zones(id),
  name TEXT NOT NULL,
  poi_type TEXT,            -- "gate" | "restroom" | "concession" | "firstaid" | "exit"
  map_x FLOAT,
  map_y FLOAT,
  is_accessible BOOLEAN DEFAULT false
);

-- ============================================
-- CROWD & QUEUE INTELLIGENCE
-- ============================================

CREATE TABLE queue_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id UUID REFERENCES points_of_interest(id),
  estimated_wait_minutes INTEGER,
  queue_length INTEGER,
  occupancy_percent FLOAT,
  source TEXT DEFAULT 'manual',   -- "manual" | "sensor" | "ai_predicted"
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Realtime enabled on this table

CREATE TABLE crowd_density_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id),
  density_level TEXT,       -- "low" | "medium" | "high" | "critical"
  occupancy_count INTEGER,
  snapshot_time TIMESTAMPTZ DEFAULT NOW()
);
-- Realtime enabled on this table

-- ============================================
-- CROWDSYNC (Unique Feature)
-- ============================================

CREATE TABLE sync_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(6) UNIQUE NOT NULL,   -- "ABCD12" shareable code
  event_id UUID,
  venue_id UUID REFERENCES venues(id),
  rally_point_poi_id UUID REFERENCES points_of_interest(id),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES sync_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  current_zone_id UUID REFERENCES zones(id),
  status TEXT DEFAULT 'active',   -- "active" | "distress" | "away"
  pulse_message TEXT,             -- "Heading to concessions, anyone coming?"
  last_seen TIMESTAMPTZ DEFAULT NOW()
);
-- Realtime enabled on this table

-- ============================================
-- EVENTS & ALERTS
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  name TEXT NOT NULL,
  event_date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  sport_type TEXT,
  home_team TEXT,
  away_team TEXT,
  current_score JSONB     -- {"home": 2, "away": 1}
);

CREATE TABLE event_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_time TIMESTAMPTZ,
  event_type TEXT         -- "kickoff" | "halftime" | "break" | "ceremony"
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  event_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  alert_type TEXT,        -- "crowd_warning" | "queue_tip" | "score" | "info"
  target_zones TEXT[],    -- null = all venue
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS (Concession Pre-Order)
-- ============================================

CREATE TABLE concession_stands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id UUID REFERENCES points_of_interest(id),
  name TEXT NOT NULL,
  is_open BOOLEAN DEFAULT true,
  express_pickup_enabled BOOLEAN DEFAULT false
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_id UUID REFERENCES concession_stands(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(6,2),
  category TEXT,          -- "food" | "drink" | "snack"
  image_url TEXT,
  is_available BOOLEAN DEFAULT true
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stand_id UUID REFERENCES concession_stands(id),
  event_id UUID REFERENCES events(id),
  status TEXT DEFAULT 'pending',   -- "pending"|"preparing"|"ready"|"collected"
  delivery_type TEXT DEFAULT 'pickup',
  seat_number TEXT,
  total_amount NUMERIC(8,2),
  order_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER DEFAULT 1,
  item_price NUMERIC(6,2)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE sync_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their group" ON sync_group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM sync_group_members WHERE user_id = auth.uid()
    )
  );
```

---

## 3. Backend — Flask Implementation Details

### 3.1 App Factory (`backend/app/__init__.py`)
```python
from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=[app.config['FRONTEND_URL']])

    from .routes.venues import venues_bp
    from .routes.queues import queues_bp
    from .routes.crowdsync import crowdsync_bp
    from .routes.events import events_bp
    from .routes.orders import orders_bp
    from .routes.auth import auth_bp

    app.register_blueprint(venues_bp, url_prefix='/api/venues')
    app.register_blueprint(queues_bp, url_prefix='/api/queues')
    app.register_blueprint(crowdsync_bp, url_prefix='/api/sync')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app
```

### 3.2 Config (`backend/app/config.py`)
```python
import os

class Config:
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
    SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
```

### 3.3 Auth Middleware (`backend/app/utils/auth_middleware.py`)
```python
from functools import wraps
from flask import request, jsonify, g
import jwt

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing token'}), 401
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                current_app.config['SUPABASE_JWT_SECRET'],
                algorithms=['HS256'],
                audience='authenticated'
            )
            g.user_id = payload['sub']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated
```

### 3.4 Queue Predictor Service (`backend/app/services/queue_predictor.py`)
```python
import numpy as np
from datetime import datetime

class QueuePredictor:
    """
    Lightweight rule-based + ML hybrid predictor.
    Inputs: time_of_day, event_phase, zone_density, historical_avg
    Output: estimated_wait_minutes
    """

    def predict_wait(self, poi_id: str, current_queue_length: int,
                     event_phase: str, time_of_day: int) -> int:
        base_rate = 0.8  # avg service rate: 0.8 people/minute/server

        phase_multipliers = {
            'pre_event': 1.8,
            'halftime': 2.5,   # peak rush
            'in_play': 0.6,
            'post_event': 2.0,
            'normal': 1.0
        }
        multiplier = phase_multipliers.get(event_phase, 1.0)
        estimated = (current_queue_length / base_rate) * multiplier
        return max(1, round(estimated))

    def suggest_alternatives(self, poi_id: str, all_queues: list) -> list:
        """Return top 2 alternative POIs of same type with lower wait."""
        same_type = [q for q in all_queues if q['poi_type'] == self._get_poi_type(poi_id)
                     and q['poi_id'] != poi_id]
        return sorted(same_type, key=lambda x: x['estimated_wait_minutes'])[:2]
```

### 3.5 CrowdSync Route (`backend/app/routes/crowdsync.py`)
```python
import random, string
from flask import Blueprint, request, jsonify, g
from ..utils.auth_middleware import require_auth
from supabase import create_client

crowdsync_bp = Blueprint('crowdsync', __name__)

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@crowdsync_bp.route('/create', methods=['POST'])
@require_auth
def create_group():
    data = request.json
    code = generate_code()
    supabase = get_supabase()
    group = supabase.table('sync_groups').insert({
        'code': code,
        'venue_id': data['venue_id'],
        'event_id': data.get('event_id'),
        'created_by': g.user_id
    }).execute()
    # Also add creator as first member
    supabase.table('sync_group_members').insert({
        'group_id': group.data[0]['id'],
        'user_id': g.user_id,
        'display_name': data['display_name']
    }).execute()
    return jsonify({'code': code, 'group': group.data[0]})

@crowdsync_bp.route('/join', methods=['POST'])
@require_auth
def join_group():
    data = request.json
    supabase = get_supabase()
    group = supabase.table('sync_groups').select('*').eq('code', data['code']).execute()
    if not group.data:
        return jsonify({'error': 'Group not found'}), 404
    member = supabase.table('sync_group_members').insert({
        'group_id': group.data[0]['id'],
        'user_id': g.user_id,
        'display_name': data['display_name']
    }).execute()
    return jsonify({'group': group.data[0], 'member': member.data[0]})

@crowdsync_bp.route('/location', methods=['PATCH'])
@require_auth
def update_location():
    data = request.json
    supabase = get_supabase()
    supabase.table('sync_group_members').update({
        'current_zone_id': data['zone_id'],
        'last_seen': 'now()'
    }).eq('user_id', g.user_id).eq('group_id', data['group_id']).execute()
    return jsonify({'status': 'updated'})
```

---

## 4. Frontend — Key Implementation Details

### 4.1 Supabase Client (`frontend/src/lib/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4.2 Realtime Hook (`frontend/src/hooks/useRealtime.js`)
```javascript
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useQueueRealtime(venueId, onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel(`queue-updates-${venueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_data'
      }, payload => onUpdate(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [venueId])
}

export function useSyncGroupRealtime(groupId, onMemberUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel(`sync-group-${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_group_members',
        filter: `group_id=eq.${groupId}`
      }, payload => onMemberUpdate(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [groupId])
}
```

### 4.3 CrowdSync Store (`frontend/src/store/useSyncStore.js`)
```javascript
import { create } from 'zustand'

export const useSyncStore = create((set) => ({
  currentGroup: null,
  members: [],
  rallyPoint: null,
  setGroup: (group) => set({ currentGroup: group }),
  setMembers: (members) => set({ members }),
  updateMember: (updatedMember) => set((state) => ({
    members: state.members.map(m =>
      m.user_id === updatedMember.user_id ? { ...m, ...updatedMember } : m
    )
  })),
  setRallyPoint: (poi) => set({ rallyPoint: poi }),
  sendPulse: async (message, groupId) => {
    // PATCH /api/sync/pulse
  }
}))
```

### 4.4 Venue Map SVG Renderer
```jsx
// VenueMap.jsx — renders zones as colored SVG polygons
const DENSITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed'
}

function VenueMap({ zones, pois, memberLocations, selectedPoi, onPoiClick }) {
  return (
    <svg viewBox="0 0 1200 800" className="venue-map">
      {zones.map(zone => (
        <rect
          key={zone.id}
          x={zone.map_coordinates.x}
          y={zone.map_coordinates.y}
          width={zone.map_coordinates.width}
          height={zone.map_coordinates.height}
          fill={DENSITY_COLORS[zone.density_level]}
          fillOpacity={0.3}
          stroke="#ffffff"
          strokeWidth={1}
        />
      ))}
      {pois.map(poi => (
        <POIMarker key={poi.id} poi={poi} onClick={() => onPoiClick(poi)} />
      ))}
      {memberLocations.map(member => (
        <MemberPin key={member.user_id} member={member} zones={zones} />
      ))}
    </svg>
  )
}
```

---

## 5. Environment Variables

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_BASE_URL=https://backend-service-xxxx.run.app
```

### Backend (`backend/.env`)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://frontend-service-xxxx.run.app
FLASK_DEBUG=false
PORT=8080
```

---

## 6. Docker Configuration

### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Frontend nginx.conf
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://backend-service-xxxx.run.app;
    }
}
```

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "run:app"]
```

### Backend requirements.txt
```
flask==3.0.0
flask-cors==4.0.0
gunicorn==21.2.0
supabase==2.3.0
PyJWT==2.8.0
numpy==1.26.2
scikit-learn==1.4.0
python-dotenv==1.0.0
```

---

## 7. Google Cloud Run Deployment

### 7.1 Cloud Build (`cloud-run/cloudbuild.yaml`)
```yaml
steps:
  # Build & push backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/stadiumiq-backend', './backend']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/stadiumiq-backend']

  # Deploy backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - stadiumiq-backend
      - --image=gcr.io/$PROJECT_ID/stadiumiq-backend
      - --region=us-central1
      - --platform=managed
      - --allow-unauthenticated
      - --set-secrets=SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest,SUPABASE_JWT_SECRET=supabase-jwt-secret:latest

  # Build & push frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/stadiumiq-frontend', './frontend']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/stadiumiq-frontend']

  # Deploy frontend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - stadiumiq-frontend
      - --image=gcr.io/$PROJECT_ID/stadiumiq-frontend
      - --region=us-central1
      - --platform=managed
      - --allow-unauthenticated
      - --set-env-vars=VITE_API_BASE_URL=https://stadiumiq-backend-xxxx.run.app
```

### 7.2 Manual Deploy Commands
```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Add secrets
echo -n "https://xxxx.supabase.co" | gcloud secrets create supabase-url --data-file=-
echo -n "service_key_here" | gcloud secrets create supabase-service-key --data-file=-

# Build and deploy backend
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/stadiumiq-backend
gcloud run deploy stadiumiq-backend \
  --image gcr.io/YOUR_PROJECT_ID/stadiumiq-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets SUPABASE_URL=supabase-url:latest \
  --port 8080

# Build and deploy frontend (after updating API URL in .env)
cd ../frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/stadiumiq-frontend
gcloud run deploy stadiumiq-frontend \
  --image gcr.io/YOUR_PROJECT_ID/stadiumiq-frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## 8. Supabase Setup Checklist

```bash
# 1. Create project at supabase.com
# 2. Run migrations/001_initial_schema.sql in SQL Editor
# 3. Run supabase/seed/demo_venue.sql to populate demo data
# 4. Enable Realtime on tables:
#    - queue_data
#    - crowd_density_snapshots
#    - sync_group_members
# 5. Enable Row Level Security (policies in schema file)
# 6. Copy project URL and anon key to frontend .env
# 7. Copy project URL and service role key to backend .env
# 8. Copy JWT secret from Settings > API to backend .env
```

---

## 9. Demo Data Seed (`supabase/seed/demo_venue.sql`)

```sql
-- Demo venue: "Narendra Modi Stadium"
INSERT INTO venues (id, name, city, capacity) VALUES
('11111111-0000-0000-0000-000000000001', 'Narendra Modi Stadium', 'Ahmedabad', 132000);

-- Zones
INSERT INTO zones (id, venue_id, name, zone_code, zone_type, map_coordinates, capacity) VALUES
('22222222-0001-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'North Stand', 'NS', 'seating', '{"x":100,"y":50,"width":400,"height":150}', 22000),
('22222222-0002-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'South Stand', 'SS', 'seating', '{"x":100,"y":600,"width":400,"height":150}', 22000),
('22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'East Concourse', 'EC', 'concourse', '{"x":700,"y":200,"width":200,"height":400}', 5000),
('22222222-0004-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'West Concourse', 'WC', 'concourse', '{"x":100,"y":200,"width":200,"height":400}', 5000);

-- Points of Interest
INSERT INTO points_of_interest (venue_id, zone_id, name, poi_type, map_x, map_y) VALUES
('11111111-0000-0000-0000-000000000001', '22222222-0003-0000-0000-000000000001', 'Gate A', 'gate', 750, 200),
('11111111-0000-0000-0000-000000000001', '22222222-0003-0000-0000-000000000001', 'Food Court East', 'concession', 780, 300),
('11111111-0000-0000-0000-000000000001', '22222222-0003-0000-0000-000000000001', 'Restroom Block E1', 'restroom', 760, 400),
('11111111-0000-0000-0000-000000000001', '22222222-0004-0000-0000-000000000001', 'Gate B', 'gate', 150, 200),
('11111111-0000-0000-0000-000000000001', '22222222-0004-0000-0000-000000000001', 'Snack Bar West', 'concession', 180, 350),
('11111111-0000-0000-0000-000000000001', '22222222-0001-0000-0000-000000000001', 'First Aid North', 'firstaid', 300, 80);
```

---

## 10. Realtime Architecture Decision

**Why Supabase Realtime (not Socket.io)?**
- Supabase Realtime natively streams database changes — no custom WebSocket server needed
- CrowdSync member updates are triggered by PATCH to `sync_group_members` → frontend receives via Supabase channel
- Queue data updates from admin dashboard → all attendees see change within ~300ms
- No additional infrastructure — scales with Supabase tier

**Data flow for CrowdSync:**
```
User taps zone [check-in]
    → PATCH /api/sync/location (Flask)
        → Supabase UPDATE sync_group_members
            → Supabase Realtime broadcasts to channel "sync-group-{id}"
                → All group members' React hooks receive update
                    → Zustand store updates
                        → Map re-renders with new member pin position
```

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Location privacy | Zone-level (not GPS) | GDPR/privacy-safe, no permission needed, sufficient accuracy |
| Realtime engine | Supabase Realtime | Eliminates separate WebSocket server, built-in auth integration |
| Map rendering | Custom SVG | Full control, no map API costs, works offline |
| Auth | Supabase Auth | Built-in JWT, email/magic link, zero extra config |
| ML model | scikit-learn rule-based hybrid | Deterministic + interpretable for demo; replace with full ML in production |
| Frontend state | Zustand | Lighter than Redux, works well with Supabase subscriptions |
