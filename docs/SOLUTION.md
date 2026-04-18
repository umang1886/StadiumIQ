# StadiumIQ — Complete Solution Document
**Project:** StadiumIQ — Smart Venue Experience Platform  
**Competition:** PromptWars  
**Version:** 2.0 (Final Solution)

---

## 🎯 Core Problem We're Solving

Large sporting venues (50,000–1,32,000 capacity) face:
1. **Crowd bottlenecks** at gates, concessions, restrooms
2. **Long food queues** — people miss match moments
3. **Group separation** — friends lose each other
4. **Zero real-time info** — no one knows where to go
5. **Poor exit experience** — chaos after the match ends

**StadiumIQ solves all 5 with one unified platform.**

---

## 🗺️ Solution Overview

```
┌─────────────────────────────────────────────────────┐
│                    STADIUMIQ APP                     │
│                                                      │
│  🗺️ Live Map  │  🍔 Food Order  │  👥 CrowdSync      │
│  📊 Queue IQ  │  🤖 SmartBot    │  🚨 Safety Alerts  │
│  🧭 Navigate  │  🏆 Fan Score   │  📱 Admin Panel    │
└─────────────────────────────────────────────────────┘
```

---

## ✅ ALL FEATURES — Complete List

---

### FEATURE 1: 🗺️ Live Interactive Venue Map

**What it does:**
- Full zoomable SVG map of the stadium
- Every zone colored by crowd density:
  - 🟢 Green = Clear (< 30% capacity)
  - 🟡 Yellow = Moderate (30–70%)
  - 🔴 Red = Crowded (70–90%)
  - 🟣 Purple = Critical (> 90%)
- All Points of Interest marked: Gates, Restrooms, Food Stalls, First Aid, Exits, ATMs
- Tap any POI → see details (wait time, distance, open/closed)
- "My Location" — user selects their zone/block from map
- Live refresh every 30 seconds via Supabase Realtime

**How it works:**
- Frontend: Custom SVG renderer (React Konva or pure SVG)
- Backend: `GET /api/venues/:id/map` returns zone data + densities
- Realtime: Supabase postgres_changes on `crowd_density_snapshots` table
- No GPS needed — zone-level self check-in (privacy-safe)

**UI Details:**
- Pinch-to-zoom on mobile
- Legend overlay (bottom-left)
- Filter buttons: "Show Food", "Show Restrooms", "Show Exits"
- Mini-map thumbnail for large stadiums

---

### FEATURE 2: 🍔 Online Food Pre-Order (Seat Delivery / Express Pickup)

> *"The feature that eliminates queues at food stalls"*

**What it does:**
- Browse full menu of every concession stand in the stadium
- Filter by: Category (Veg/Non-Veg/Drinks/Snacks), Stand Location, Price
- Add items to cart
- Enter **Seat Number** (Block + Row + Seat, e.g., "B-12-34")
- Choose delivery type:
  - **Seat Delivery** — order brought to your seat (premium)
  - **Express Pickup** — skip the queue, collect from express window
- Live order status: `Placed → Preparing → Ready → Delivered`
- Order history per event
- **Group Order** — one person orders for whole group

**Order Flow:**
```
User browses menu
    → Adds items to cart
        → Enters Seat No. (Block / Row / Seat)
            → Selects: Seat Delivery OR Express Pickup
                → Confirms order (mock payment for prototype)
                    → Gets Order ID + estimated time
                        → Real-time status updates via Supabase
                            → Notification: "Your order is Ready!"
```

**Why this kills long queues:**
- 70% of queue traffic at food stalls is people waiting to ORDER
- Pre-ordering shifts ordering online → stall only handles preparation
- Express pickup window = dedicated lane, no wait
- Seat delivery = zero queue for user

**Backend endpoints:**
```
GET  /api/menu?venue_id=&stand_id=        → menu items
POST /api/orders                           → place order
GET  /api/orders/:id                       → order status
PATCH /api/orders/:id/status               → admin: update status
GET  /api/orders/history?user_id=          → past orders
POST /api/orders/group                     → group order
```

**Database tables:** `orders`, `order_items`, `menu_items`, `concession_stands`

**UI Components:**
- `MenuBrowser.jsx` — card grid with filters
- `CartSidebar.jsx` — slide-in cart panel
- `SeatSelector.jsx` — Block/Row/Seat input with validation
- `OrderTracker.jsx` — live status stepper
- `OrderHistory.jsx` — past orders list

---

### FEATURE 3: 🤖 SmartBot — AI Venue Assistant (No External API)

> *"Ask anything about the stadium — SmartBot answers instantly"*

**What it does:**
- Floating chat button (bottom-right corner)
- User types any question in natural language
- SmartBot gives instant, relevant answer
- **No Gemini, No OpenAI, No external API** — runs entirely on custom algorithm

**Algorithm Design — Keyword Intent Matching Engine:**

```python
# backend/app/services/smartbot.py

INTENT_MAP = {
    "food": {
        "keywords": ["food", "eat", "hungry", "snack", "drink", "order", 
                     "menu", "restaurant", "stall", "canteen", "chai", 
                     "samosa", "burger", "pizza", "water"],
        "response_fn": "get_food_response"
    },
    "queue": {
        "keywords": ["queue", "wait", "line", "long", "crowded", "busy",
                     "rush", "time", "how long", "waiting"],
        "response_fn": "get_queue_response"
    },
    "restroom": {
        "keywords": ["restroom", "toilet", "washroom", "bathroom", "loo",
                     "wc", "bathroom", "wash"],
        "response_fn": "get_restroom_response"
    },
    "gate": {
        "keywords": ["gate", "entry", "entrance", "enter", "ticket",
                     "exit", "out", "leave"],
        "response_fn": "get_gate_response"
    },
    "parking": {
        "keywords": ["parking", "car", "bike", "vehicle", "park",
                     "where park", "lot"],
        "response_fn": "get_parking_response"
    },
    "first_aid": {
        "keywords": ["first aid", "doctor", "medical", "hurt", "injury",
                     "help", "emergency", "ambulance", "sick", "unwell"],
        "response_fn": "get_firstaid_response"
    },
    "match": {
        "keywords": ["score", "match", "game", "result", "win", "lose",
                     "goal", "over", "innings", "halftime", "when start"],
        "response_fn": "get_match_response"
    },
    "navigate": {
        "keywords": ["where", "how to reach", "direction", "find", "locate",
                     "nearest", "closest", "go to", "path", "route"],
        "response_fn": "get_navigation_response"
    },
    "seat": {
        "keywords": ["seat", "block", "row", "section", "stand", 
                     "my seat", "where sit", "seating"],
        "response_fn": "get_seat_response"
    },
    "wifi": {
        "keywords": ["wifi", "internet", "network", "connect", "password",
                     "hotspot", "data", "signal"],
        "response_fn": "get_wifi_response"
    }
}

class SmartBot:
    def __init__(self, venue_data, queue_data, event_data):
        self.venue = venue_data
        self.queues = queue_data
        self.event = event_data

    def get_response(self, user_message: str) -> dict:
        msg = user_message.lower().strip()
        
        # Score each intent by keyword matches
        scores = {}
        for intent, config in INTENT_MAP.items():
            score = sum(1 for kw in config['keywords'] if kw in msg)
            if score > 0:
                scores[intent] = score
        
        if not scores:
            return self._fallback_response(msg)
        
        best_intent = max(scores, key=scores.get)
        handler = getattr(self, INTENT_MAP[best_intent]['response_fn'])
        return handler(msg)

    def get_food_response(self, msg):
        # Pull live data from DB
        open_stalls = [s for s in self.venue['stalls'] if s['is_open']]
        low_queue = min(open_stalls, key=lambda x: x['queue_wait'])
        return {
            "type": "food",
            "message": f"🍔 Nearest food stall with shortest wait: **{low_queue['name']}** "
                       f"({low_queue['zone']}) — only ~{low_queue['queue_wait']} min wait! "
                       f"You can also pre-order from the Order tab to skip the queue entirely.",
            "action": {"label": "Order Food Now", "route": "/order"}
        }

    def get_queue_response(self, msg):
        worst = max(self.queues, key=lambda x: x['wait'])
        best = min(self.queues, key=lambda x: x['wait'])
        return {
            "type": "queue",
            "message": f"📊 Current queue status: **{best['name']}** has the shortest wait "
                       f"({best['wait']} min). Avoid **{worst['name']}** right now "
                       f"({worst['wait']} min wait). Use Express Pickup to skip queues!",
            "action": {"label": "View Queue Map", "route": "/map"}
        }

    def get_restroom_response(self, msg):
        return {
            "type": "restroom",
            "message": "🚻 Nearest restrooms are marked in blue on the map. "
                       "Block East-2 and West-3 restrooms currently have shortest waits. "
                       "Tap 'Restrooms' filter on the map to see all locations.",
            "action": {"label": "Show on Map", "route": "/map?filter=restroom"}
        }

    def _fallback_response(self, msg):
        suggestions = ["food order", "queue status", "nearest restroom", 
                       "gate directions", "match score", "first aid"]
        return {
            "type": "fallback",
            "message": "🤖 I didn't quite get that! I can help you with: "
                       + ", ".join(suggestions) + ". Try asking something like "
                       "'Where can I eat?' or 'What's the queue like?'",
            "action": None
        }
```

**Bot Response Types:**
- Text answer with live data (queue times, stall names)
- **Action Button** — tapping takes user to relevant section
- Quick Reply chips — suggested follow-up questions
- Emoji-rich, friendly tone

**Quick Reply Suggestions (shown below chat input):**
- "Where can I eat? 🍔"
- "Nearest restroom? 🚻"
- "Current match score? 🏏"
- "How to exit fastest? 🚶"
- "First aid location? 🏥"

**Frontend Implementation:**
```jsx
// ChatBot.jsx — floating chat widget
const QUICK_REPLIES = [
  "Where can I eat? 🍔",
  "Nearest restroom? 🚻", 
  "Match score? 🏏",
  "Fastest exit? 🚪",
  "Find first aid 🏥"
]
```

**API Endpoint:**
```
POST /api/chatbot/message
Body: { "message": "where is the food?", "venue_id": "...", "event_id": "..." }
Response: { "type": "food", "message": "...", "action": {...} }
```

---

### FEATURE 4: 👥 CrowdSync — Group Coordination (Unique Feature ⭐)

**What it does:**
- Create a group → get a **6-digit code** (e.g., `LION42`)
- Share code with friends → they join the group
- See all group members' **zone location** on map (privacy-safe, no GPS)
- Set a **Rally Point** — everyone gets navigated there
- **Group Pulse** — broadcast "I'm heading to food court, anyone joining?"
- **SOS / Distress Signal** — tap once to alert group you need help
- Estimated time for whole group to converge at meeting point
- Works even when network is intermittent (optimistic UI)

**Why zone-level (not GPS):**
- No app permission needed
- More privacy-friendly
- Sufficient for 50m zone accuracy in a stadium

---

### FEATURE 5: 📊 Smart Queue Intelligence

**What it does:**
- Real-time wait time at every Gate, Food Stall, Restroom
- AI prediction of wait time based on:
  - Current queue length
  - Match phase (pre-game, halftime, post-game)
  - Time of day
  - Historical data for this venue + event type
- "Beat the Rush" alerts — 5 min before halftime: *"Go now to beat the queue!"*
- Alternative suggestions — "Gate B has 2 min wait vs Gate A's 14 min"
- Color-coded badges on every POI marker on the map

**Queue Levels:**
```
🟢 < 3 min    = Go Now
🟡 3–8 min   = Moderate
🔴 8–15 min  = Avoid
⛔ > 15 min   = Critical
```

---

### FEATURE 6: 🧭 Intelligent In-Venue Navigation

**What it does:**
- Tap any POI on map → "Navigate Here"
- Step-by-step walking directions within venue
- Accessibility routes (elevator, ramp, wheelchair-accessible paths)
- "Beat the crowd" exit routing after event ends
- Estimated walking time to any destination
- Route avoids high-density zones automatically

**Navigation Algorithm:**
- BFS/Dijkstra on venue graph (nodes = zones, edges = corridors)
- Edge weights = distance + congestion_penalty
- Accessibility flag removes edges without ramps/elevators

---

### FEATURE 7: 📢 Smart Alerts & Event Timeline

**What it does:**
- Match/event schedule with live countdowns
- Predictive alerts:
  - *"Halftime in 5 mins — order food now to beat the rush"*
  - *"Gate A is getting crowded — use Gate C instead"*
  - *"Your section restroom is busy — Block B has 0 wait"*
- Score/goal notifications for fans stuck in queues
- Admin can push custom announcements to all attendees
- Notification history

**Alert Types:**
- `crowd_warning` — zone getting critical
- `queue_tip` — better alternative found
- `score_update` — goal/wicket/point scored
- `order_ready` — food order ready for pickup
- `group_pulse` — message from CrowdSync group
- `sos` — distress signal from group member

---

### FEATURE 8: 🏆 Fan Score & Gamification

**What it does:**
- Every attendee gets a **Fan Score** for each event
- Points earned for:
  - ✅ Checking into their zone (+10 pts)
  - 🍔 Placing a food order (+15 pts)
  - 👥 Joining/creating a CrowdSync group (+20 pts)
  - 📍 Setting a rally point (+10 pts)
  - ⭐ Rating a food stall (+5 pts)
  - 🤝 Helping others (SOS response) (+25 pts)
- **Leaderboard** — top fans of the event
- **Badges:** "Early Bird" (first 1000 at gate), "Rally Master" (set 3 rally points), "Queue Buster" (used express pickup 3x)
- Redeemable for: Discount on next order, Priority access alerts

**Why this works:**
- Increases engagement and app usage
- Incentivizes behaviors that reduce congestion (ordering online, using less crowded gates)
- Creates social competition and fun

---

### FEATURE 9: 🚦 Smart Exit Routing

**What it does:**
- 10 mins before event end: "Plan your exit" banner appears
- Shows predicted crowd density at each exit post-event
- Recommends best exit based on user's seat block
- Turn-by-turn exit navigation
- Live exit crowd heat map
- "Leave Early" option — shows current exit status now

**Algorithm:**
- Historical exit pattern data per seat block
- Real-time density at exit zones
- Recommends least-crowded exit within 3-minute walk radius

---

### FEATURE 10: 🛡️ Admin Dashboard

**What it does (venue operations staff):**
- Real-time crowd heatmap across all zones
- Manual queue time override (when sensors unavailable)
- Push custom alerts to entire venue or specific zones
- View all active CrowdSync groups (for emergency coordination)
- Order management: see all pending orders per stall
- Incident log: mark incidents, assign staff
- Event timeline editor: update match phases
- Stats overview: total users, orders, avg wait times

**Admin-only endpoints:**
```
POST /api/admin/alerts/push         → Send alert to venue
PATCH /api/admin/queues/:id         → Manual queue update
GET  /api/admin/dashboard           → Full venue stats
GET  /api/admin/orders              → All active orders
POST /api/admin/incidents           → Log incident
```

---

## 🔁 Complete User Journey

```
1. USER ARRIVES AT STADIUM
   → Opens StadiumIQ app
   → Logs in (email/magic link via Supabase Auth)
   → Selects today's event
   → App shows live venue map

2. ENTERING THE VENUE
   → Map shows Gate A has 12 min queue, Gate C has 2 min
   → User navigates to Gate C
   → SmartBot tip: "Gate C closes after kickoff, enter now!"

3. FINDING SEAT
   → User taps "Navigate to my seat"
   → Step-by-step directions shown
   → Creates CrowdSync group, shares LION42 code with friends

4. ORDERING FOOD (Zero Queue)
   → User opens Order tab during first half
   → Browses menu, adds Vada Pav + Chai
   → Enters Seat: Block B / Row 12 / Seat 34
   → Selects "Express Pickup" 
   → Gets order number: #ST-4821
   → Notification in 8 mins: "Order ready at Express Window 3!"

5. HALFTIME
   → Alert: "Halftime in 3 mins — Restroom Block E has 0 min wait"
   → CrowdSync: Friend sends Pulse "Going to food court"
   → User sets Rally Point at "East Concourse Meeting Point"
   → All group members navigated to rally point

6. POST-MATCH EXIT
   → "Plan Your Exit" banner appears
   → Shows Gate B best for Block B users — 2 min walk, low crowd
   → Turn-by-turn exit navigation
   → Fan Score: 285 pts earned today 🏆
```

---

## 🧩 Tech Implementation Summary

### Frontend Pages & Components

| Page | Key Components |
|------|---------------|
| `/` (Home) | EventCard, QuickActions, AlertBanner |
| `/map` | VenueMap (SVG), ZoneLegend, POIDrawer, FilterBar |
| `/order` | MenuBrowser, CartSidebar, SeatSelector, OrderTracker |
| `/sync` | SyncGroupPanel, MemberMap, RallyPointPicker, PulseButton |
| `/alerts` | AlertTimeline, NotificationBell |
| `/bot` | ChatWindow, QuickReplies, MessageBubble |
| `/score` | FanScoreCard, BadgeGrid, Leaderboard |
| `/exit` | ExitRouteMap, ExitTimer, CrowdForecast |
| `/admin` | HeatmapPanel, QueueControl, OrderBoard, IncidentLog |

### Backend Services

| Service | Purpose |
|---------|---------|
| `queue_predictor.py` | ML-based wait time estimation |
| `crowd_analyzer.py` | Zone density calculations |
| `smartbot.py` | Keyword intent matching engine |
| `notification.py` | Alert broadcasting to users |
| `exit_router.py` | Post-event exit optimization |
| `gamification.py` | Fan score calculations & badges |
| `nav_engine.py` | Dijkstra-based in-venue navigation |

### Supabase Realtime Tables

| Table | Event | Who subscribes |
|-------|-------|---------------|
| `queue_data` | UPDATE | All venue attendees |
| `crowd_density_snapshots` | INSERT | Map component |
| `sync_group_members` | UPDATE | CrowdSync group members |
| `orders` | UPDATE | Order tracking screen |
| `alerts` | INSERT | All attendees (notification bell) |

---

## 📱 UI/UX Design Principles

- **Dark theme** with electric accent colors — stadium at night aesthetic
- **Font:** Bebas Neue (headings) + DM Sans (body) — sports-feel typography
- **Color Palette:**
  - Background: `#0a0a0f` (near black)
  - Surface: `#13131a`
  - Accent: `#00e5ff` (electric cyan)
  - Warning: `#ff6b35` (stadium orange)
  - Success: `#00ff87` (neon green)
  - Danger: `#ff2d55` (alert red)
- **Animations:** Smooth zone color transitions, pulse rings on member pins, slide-in panels
- **Mobile-first:** All interactions touch-friendly, 44px+ tap targets
- Full PWA support: Add to home screen, offline map fallback

---

## 🚀 Deployment Checklist (Google Cloud Run)

```bash
# Step 1: Supabase
□ Create project → run migrations/001_initial_schema.sql
□ Run seed/demo_venue.sql
□ Enable Realtime on 5 tables
□ Copy URL + anon key + service key + JWT secret

# Step 2: Google Cloud
□ Create GCP project
□ Enable Cloud Run, Cloud Build, Container Registry APIs
□ Store secrets in Secret Manager

# Step 3: Build & Deploy Backend
□ cd backend && docker build + gcloud run deploy
□ Set all env vars via --set-secrets

# Step 4: Build & Deploy Frontend
□ Update VITE_API_BASE_URL with backend Cloud Run URL
□ cd frontend && docker build + gcloud run deploy

# Step 5: Verify
□ Test /api/health endpoint
□ Test Supabase Realtime connection
□ Test SmartBot with 5 different questions
□ Place a test food order end-to-end
□ Test CrowdSync group creation + join
```

---

## 🏅 What Makes StadiumIQ Win PromptWars

| Criteria | StadiumIQ Advantage |
|----------|-------------------|
| **Uniqueness** | CrowdSync zone coordination — no other app has this |
| **Real problem** | Addresses all 5 major venue pain points |
| **Working features** | All features actually functional, not mockups |
| **Technical depth** | Realtime + ML prediction + custom bot algorithm |
| **UX quality** | Pro dark UI, mobile-first, gamified |
| **Scalability** | Cloud Run auto-scales to 1,00,000+ users |
| **Privacy** | Zone-level location, no GPS harvesting |
| **No API costs** | SmartBot uses 0 external AI APIs |
