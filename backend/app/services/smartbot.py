INTENT_MAP = {
    "food": {
        "keywords": ["food", "eat", "hungry", "snack", "drink", "order",
                     "menu", "restaurant", "stall", "canteen", "chai",
                     "samosa", "burger", "pizza", "water", "biryani",
                     "fries", "popcorn", "nachos", "lassi", "vada pav"],
        "response_fn": "get_food_response"
    },
    "queue": {
        "keywords": ["queue", "wait", "line", "long", "crowded", "busy",
                     "rush", "time", "how long", "waiting", "crowd"],
        "response_fn": "get_queue_response"
    },
    "restroom": {
        "keywords": ["restroom", "toilet", "washroom", "bathroom", "loo",
                     "wc", "wash"],
        "response_fn": "get_restroom_response"
    },
    "gate": {
        "keywords": ["gate", "entry", "entrance", "enter", "ticket",
                     "exit", "out", "leave", "door"],
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
                     "goal", "over", "innings", "halftime", "when start",
                     "wicket", "six", "four", "run"],
        "response_fn": "get_match_response"
    },
    "navigate": {
        "keywords": ["where", "how to reach", "direction", "find", "locate",
                     "nearest", "closest", "go to", "path", "route", "navigate"],
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
    def __init__(self, venue_data=None, queue_data=None, event_data=None):
        self.venue = venue_data or {}
        self.queues = queue_data or []
        self.event = event_data or {}

    def get_response(self, user_message: str) -> dict:
        msg = user_message.lower().strip()

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
        stalls = self.venue.get('stalls', [])
        if stalls:
            open_stalls = [s for s in stalls if s.get('is_open', True)]
            if open_stalls:
                low_queue = min(open_stalls, key=lambda x: x.get('queue_wait', 0))
                return {
                    "type": "food",
                    "message": f"🍔 Nearest food stall with shortest wait: **{low_queue['name']}** "
                               f"— only ~{low_queue.get('queue_wait', 0)} min wait! "
                               f"You can also pre-order from the Order tab to skip the queue entirely.",
                    "action": {"label": "Order Food Now", "route": "/order"},
                    "suggestions": ["What's on the menu? 📋", "Queue at food stalls? ⏱️"]
                }
        return {
            "type": "food",
            "message": "🍔 You can browse all food stalls and pre-order from the **Order** tab. "
                       "Use Express Pickup to skip the queue, or choose Seat Delivery!",
            "action": {"label": "Order Food Now", "route": "/order"},
            "suggestions": ["What's on the menu? 📋", "Show food stalls on map 🗺️"]
        }

    def get_queue_response(self, msg):
        if self.queues:
            sorted_q = sorted(self.queues, key=lambda x: x.get('wait', 0))
            best = sorted_q[0]
            worst = sorted_q[-1]
            return {
                "type": "queue",
                "message": f"📊 **{best['name']}** has the shortest wait ({best['wait']} min). "
                           f"Avoid **{worst['name']}** right now ({worst['wait']} min wait). "
                           f"Use Express Pickup to skip queues!",
                "action": {"label": "View Queue Map", "route": "/map"},
                "suggestions": ["Suggest alternative gate 🚪", "Order food online 🍔"]
            }
        return {
            "type": "queue",
            "message": "📊 Check the live Queue Map for real-time wait times at all gates, "
                       "food stalls, and restrooms. Green = Go Now, Red = Avoid!",
            "action": {"label": "View Queue Map", "route": "/map"},
            "suggestions": ["Show me the map 🗺️", "Which gate has least wait? 🚪"]
        }

    def get_restroom_response(self, msg):
        return {
            "type": "restroom",
            "message": "🚻 Nearest restrooms are marked on the map. "
                       "Tap 'Restrooms' filter to see all locations with live wait times. "
                       "North Concourse restrooms usually have the shortest waits!",
            "action": {"label": "Show on Map", "route": "/map?filter=restroom"},
            "suggestions": ["Which restroom has least queue? ⏱️", "Accessible restrooms? ♿"]
        }

    def get_gate_response(self, msg):
        if 'exit' in msg or 'leave' in msg or 'out' in msg:
            return {
                "type": "exit",
                "message": "🚪 For the fastest exit, check the **Smart Exit** page. "
                           "It shows live crowd density at each exit and recommends the least "
                           "crowded route based on your seat block!",
                "action": {"label": "Plan Exit", "route": "/exit"},
                "suggestions": ["Best exit for my block? 🏃", "When does the match end? ⏰"]
            }
        return {
            "type": "gate",
            "message": "🚪 All entry gates are shown on the map with live wait times. "
                       "Gate B (North) and Gate F (West) currently have the shortest queues. "
                       "Tap any gate on the map for navigation!",
            "action": {"label": "Show Gates", "route": "/map?filter=gate"},
            "suggestions": ["Navigate to Gate B 🧭", "Gate wait times? ⏱️"]
        }

    def get_parking_response(self, msg):
        return {
            "type": "parking",
            "message": "🚗 Parking areas are located at the North and East sides of the stadium. "
                       "Follow signs for Lot A (closest to Gate A) or Lot C (VIP). "
                       "Expect heavy traffic 30 min before and after the match.",
            "action": {"label": "Show on Map", "route": "/map"},
            "suggestions": ["Navigate to parking 🧭", "Best exit route? 🚪"]
        }

    def get_firstaid_response(self, msg):
        return {
            "type": "firstaid",
            "message": "🏥 **First Aid stations** are located at North Concourse and South Concourse. "
                       "Look for the red cross markers on the map. For emergencies, "
                       "approach the nearest staff member or tap SOS in CrowdSync!",
            "action": {"label": "Show First Aid", "route": "/map?filter=firstaid"},
            "suggestions": ["Where's the nearest one? 📍", "Emergency contact? 📞"]
        }

    def get_match_response(self, msg):
        if self.event:
            score = self.event.get('current_score', {})
            home = self.event.get('home_team', 'Home')
            away = self.event.get('away_team', 'Away')
            return {
                "type": "match",
                "message": f"🏏 **{home}** vs **{away}**\n"
                           f"Score: {home} {score.get('home', '-')}/{score.get('home_wickets', '-')} "
                           f"| {away} {score.get('away', '-')}/{score.get('away_wickets', '-')}\n"
                           f"Overs: {score.get('overs', '-')}",
                "action": {"label": "View Timeline", "route": "/alerts"},
                "suggestions": ["When is halftime? ⏰", "Event schedule 📅"]
            }
        return {
            "type": "match",
            "message": "🏏 Check the **Alerts** page for live score updates and event timeline. "
                       "You'll get push notifications for every major moment!",
            "action": {"label": "View Timeline", "route": "/alerts"},
            "suggestions": ["Event schedule 📅", "Set score alerts 🔔"]
        }

    def get_navigation_response(self, msg):
        return {
            "type": "navigate",
            "message": "🧭 Tap any point of interest on the map and hit **Navigate** "
                       "to get step-by-step directions. The route avoids crowded zones "
                       "and includes accessibility-friendly options!",
            "action": {"label": "Open Map", "route": "/map"},
            "suggestions": ["Navigate to my seat 💺", "Find nearest food 🍔"]
        }

    def get_seat_response(self, msg):
        return {
            "type": "seat",
            "message": "💺 Enter your seat details (Block/Row/Seat) on the Map page to see "
                       "your location. You can also set it during food ordering for Seat Delivery! "
                       "Tap 'Navigate to my seat' for walking directions.",
            "action": {"label": "Open Map", "route": "/map"},
            "suggestions": ["Navigate to my seat 🧭", "Order food to seat 🍔"]
        }

    def get_wifi_response(self, msg):
        return {
            "type": "wifi",
            "message": "📶 Stadium WiFi: **StadiumIQ_Free**\n"
                       "Password: Available on your ticket or at any help desk.\n"
                       "For best speeds, connect between innings when fewer users are online.",
            "action": None,
            "suggestions": ["Internet speed slow? 🐌", "Other help? 🤝"]
        }

    def _fallback_response(self, msg):
        return {
            "type": "fallback",
            "message": "🤖 I didn't quite get that! I can help you with:\n"
                       "• 🍔 Food & ordering\n• 📊 Queue status\n• 🚻 Restrooms\n"
                       "• 🚪 Gates & entry\n• 🏏 Match score\n• 🏥 First aid\n"
                       "• 🧭 Navigation\n• 💺 Seat info\n• 📶 WiFi\n\n"
                       "Try asking something like 'Where can I eat?' or 'What's the queue like?'",
            "action": None,
            "suggestions": ["Where can I eat? 🍔", "Nearest restroom? 🚻",
                          "Match score? 🏏", "Fastest exit? 🚪", "First aid? 🏥"]
        }
