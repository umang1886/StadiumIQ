# StadiumIQ — Product Requirements Document (PRD)
**Version:** 1.0  
**Prepared For:** PromptWars Submission  
**Tech Stack:** React · Flask (Python) · Supabase · Google Cloud Run  

---

## 1. Executive Summary

**StadiumIQ** is a real-time venue intelligence platform that transforms the large-scale sporting event experience for attendees. It addresses crowd congestion, long wait times, and poor coordination using AI-powered heat maps, predictive queue analytics, and a unique **"CrowdSync" social coordination layer** — allowing groups to synchronize movement, share discoveries, and navigate a 50,000-seat stadium as if they had a personal concierge.

---

## 2. Problem Statement

At large-scale sporting venues, attendees face:
- **Crowd bottlenecks** at entry gates, concession stands, and restrooms
- **Long wait times** with no visibility into alternatives
- **Poor group coordination** — losing friends, missing events
- **Zero real-time information** about what's happening inside the venue
- **Missed moments** — being in a queue when a goal is scored

---

## 3. Goals & Success Metrics

| Goal | KPI | Target |
|------|-----|--------|
| Reduce average wait time | Avg. queue wait | < 4 minutes |
| Improve navigation | Time to reach destination | 30% faster |
| Increase fan satisfaction | Post-event NPS | > 75 |
| Group coordination | Group re-unification time | < 2 minutes |
| Concession revenue | Vendor upsell rate | +20% |

---

## 4. User Personas

### 4.1 The Casual Fan (Primary)
- Age 25–45, attends 3–5 events/year
- Wants to enjoy the event without stress
- Needs: Easy navigation, short queues, group tracking

### 4.2 The Group Organizer
- Manages 4–10 friends/family at the event
- Needs: Group chat, live location sharing, meeting points

### 4.3 The Premium Attendee
- VIP/premium ticket holder
- Needs: Exclusive lounge access, fast-track alerts, curated service

### 4.4 Venue Operations Staff
- Monitors crowd density, dispatches help
- Needs: Admin dashboard, crowd alerts, real-time incident reports

---

## 5. Core Features

### 5.1 Live Venue Map (Interactive)
- SVG/canvas-based zoomable stadium map
- Color-coded zones: Green (clear) → Yellow (moderate) → Red (crowded)
- Real-time crowd density overlay updated every 30 seconds
- Points of interest: Gates, restrooms, concessions, first aid, exits
- My Location pin with indoor positioning (BLE beacon / QR anchor fallback)

### 5.2 Smart Queue Predictor
- AI model estimates wait times per concession stand / gate / restroom
- Suggests nearest low-wait alternative (e.g., "Gate 7B has 2-min wait vs Gate 4 at 11 min")
- Historical data-backed predictions per event type and time slot
- Push notification when a queue drops below user's threshold

### 5.3 CrowdSync — Unique Feature ⭐
> **The differentiator that wins the competition.**

CrowdSync is a **real-time group movement coordination system** that lets attendee groups:
- Create a "Sync Group" with a shareable 6-digit code
- See each member's live zone (not GPS — privacy-safe zone-level)
- Set a "Rally Point" on the map that all members are navigated toward
- Get alerted when a group member is in distress or separated
- See estimated time for the whole group to converge at a meeting point
- "Group Pulse" — one tap to broadcast "I'm heading to concessions, anyone coming?"

This feature uses **Supabase Realtime** channels for sub-second updates without GPS privacy concerns.

### 5.4 Event Timeline & Live Alerts
- Match/event schedule with countdowns
- Push alerts: "Halftime in 3 mins — head to concessions NOW to beat the rush"
- Goal/score notifications for attendees stuck in queues
- Integration with venue event feed (webhook or manual admin input)

### 5.5 Concession Pre-Order & Seat Delivery
- Browse food/drink menu by vendor stand
- Order ahead and pick up at designated express window
- Optional: Seat delivery (venue-permitting) with live order tracking
- Loyalty points per order

### 5.6 Intelligent Navigation
- Turn-by-turn walking directions within the venue
- Accessibility-aware routes (elevator, ramp)
- "Beat the crowd" exit routing post-event
- Estimated walk time to any POI

### 5.7 Admin Dashboard
- Real-time crowd heatmap across all zones
- Queue wait time management (manual override + AI auto-update)
- Incident reporting and resource dispatch
- Concession inventory management
- Event timeline management

---

## 6. Feature Priority Matrix

| Feature | Priority | Complexity | Sprint |
|---------|----------|-----------|--------|
| Live Venue Map | P0 | High | 1 |
| Smart Queue Predictor | P0 | High | 1 |
| CrowdSync Groups | P0 | High | 1–2 |
| Event Alerts | P1 | Medium | 2 |
| Navigation (turn-by-turn) | P1 | Medium | 2 |
| Concession Pre-Order | P1 | High | 2–3 |
| Admin Dashboard | P1 | Medium | 2 |
| Loyalty & Rewards | P2 | Low | 3 |

---

## 7. Technical Architecture

### 7.1 System Overview

```
[React SPA]
     │
     ├── REST API ──────────► [Flask Backend on Cloud Run]
     │                               │
     └── WebSocket/Realtime ──► [Supabase Realtime]
                                     │
                              [Supabase PostgreSQL]
                              [Supabase Auth]
                              [Supabase Storage]
```

### 7.2 Frontend (React)
- **Framework:** React 18 + Vite
- **State:** Zustand (lightweight global state)
- **Routing:** React Router v6
- **UI Components:** Custom design system (no generic component libraries)
- **Maps:** React Konva or SVG-based custom map renderer
- **Realtime:** Supabase JS client (realtime subscriptions)
- **Charts:** Recharts for admin dashboard
- **Deployment:** Cloud Run (Docker + nginx)

### 7.3 Backend (Flask)
- **Framework:** Flask 3.x + Flask-CORS
- **Auth middleware:** Supabase JWT verification
- **AI/ML:** scikit-learn for queue prediction model
- **API Design:** RESTful JSON API
- **Async tasks:** threading / Celery (for background updates)
- **Containerization:** Docker (python:3.11-slim)

### 7.4 Database (Supabase)
Key tables:
```sql
venues, zones, points_of_interest, queue_data,
crowd_density_snapshots, sync_groups, sync_group_members,
events, orders, order_items, menu_items, users, notifications
```
- Row Level Security (RLS) enabled on all user-facing tables
- Realtime enabled on: `queue_data`, `crowd_density_snapshots`, `sync_group_members`

### 7.5 Deployment (Google Cloud Run)
- Two Cloud Run services: `stadiumiq-frontend` and `stadiumiq-backend`
- Shared VPC / Cloud Armor for security
- Cloud Build CI/CD triggered on main branch push
- Secrets via Google Secret Manager (Supabase keys, etc.)
- Domain mapped via Cloud Run custom domain

---

## 8. Data Models (Key)

### Queue Data
```json
{
  "id": "uuid",
  "zone_id": "uuid",
  "poi_id": "uuid",
  "estimated_wait_minutes": 7,
  "queue_length": 23,
  "updated_at": "2025-04-18T14:30:00Z",
  "source": "sensor | manual | predicted"
}
```

### Sync Group
```json
{
  "id": "uuid",
  "code": "ABCD12",
  "event_id": "uuid",
  "rally_point_poi_id": "uuid",
  "created_by": "user_id",
  "created_at": "timestamp"
}
```

### Sync Group Member
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "user_id": "uuid",
  "display_name": "Raj",
  "current_zone_id": "uuid",
  "status": "active | distress | away",
  "last_seen": "timestamp"
}
```

---

## 9. API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Venue & Map
- `GET /api/venues/:id/map` — Full venue map data
- `GET /api/venues/:id/zones` — Zone list with current density
- `GET /api/venues/:id/pois` — All points of interest

### Queue & Crowd
- `GET /api/queues?venue_id=&poi_id=` — Current queue estimates
- `POST /api/queues/update` — Admin: Update queue data
- `GET /api/crowd/heatmap?venue_id=` — Zone density grid

### CrowdSync
- `POST /api/sync/create` — Create group → returns 6-digit code
- `POST /api/sync/join` — Join group by code
- `PATCH /api/sync/location` — Update user's zone
- `GET /api/sync/group/:code` — Get all member locations
- `POST /api/sync/rally` — Set rally point

### Events & Alerts
- `GET /api/events/:id/timeline` — Event schedule
- `POST /api/alerts/send` — Admin: Send alert to all attendees

### Orders
- `GET /api/menu?venue_id=&stand_id=` — Menu items
- `POST /api/orders` — Place order
- `GET /api/orders/:id` — Order status

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API Response Time (p95) | < 300ms |
| Realtime Update Latency | < 500ms |
| Concurrent Users | 10,000+ |
| Uptime | 99.9% |
| Mobile Responsiveness | iOS Safari + Android Chrome |
| Accessibility | WCAG 2.1 AA |

---

## 11. Security Considerations
- Supabase RLS: Users only see their own orders, their sync group data
- JWT expiry: 1 hour with refresh token
- No GPS stored — only zone-level location (privacy-first)
- Rate limiting on all public endpoints
- CORS restricted to frontend domain

---

## 12. Out of Scope (v1)
- Native iOS/Android apps
- BLE beacon hardware integration (fallback: QR zone check-in)
- Payment gateway for orders (mock checkout for prototype)
- Third-party ticketing system integration

---

## 13. Milestones

| Sprint | Duration | Deliverables |
|--------|----------|-------------|
| Sprint 1 | Week 1 | Auth, DB schema, venue map, queue API |
| Sprint 2 | Week 2 | CrowdSync, event alerts, navigation |
| Sprint 3 | Week 3 | Orders, admin dashboard, polish |
| Sprint 4 | Week 4 | Docker, Cloud Run deploy, testing |
