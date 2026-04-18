POINT_VALUES = {
    'zone_checkin': 10,
    'food_order': 15,
    'group_create': 20,
    'group_join': 20,
    'rally_point': 10,
    'stall_rating': 5,
    'sos_response': 25,
    'express_pickup': 10,
}

BADGE_DEFINITIONS = {
    'early_bird': {
        'name': 'Early Bird',
        'description': 'One of the first 1000 at the gate',
        'icon': '🐦'
    },
    'rally_master': {
        'name': 'Rally Master',
        'description': 'Set 3 rally points',
        'icon': '📍'
    },
    'queue_buster': {
        'name': 'Queue Buster',
        'description': 'Used express pickup 3 times',
        'icon': '⚡'
    },
    'social_butterfly': {
        'name': 'Social Butterfly',
        'description': 'Joined 3 CrowdSync groups',
        'icon': '🦋'
    },
    'foodie': {
        'name': 'Foodie',
        'description': 'Placed 5 food orders',
        'icon': '🍔'
    },
    'explorer': {
        'name': 'Explorer',
        'description': 'Checked into 5 different zones',
        'icon': '🧭'
    },
    'helper': {
        'name': 'Helper',
        'description': 'Responded to an SOS signal',
        'icon': '🤝'
    }
}


class GamificationService:
    def __init__(self, supabase):
        self.sb = supabase

    def award_points(self, user_id: str, event_id: str, action: str) -> dict:
        points = POINT_VALUES.get(action, 0)
        if points <= 0:
            return {"awarded": False}

        self.sb.table('fan_scores').insert({
            'user_id': user_id,
            'event_id': event_id,
            'action': action,
            'points': points
        }).execute()

        self._check_badges(user_id, action)

        return {"awarded": True, "points": points, "action": action}

    def get_score(self, user_id: str, event_id: str = None) -> dict:
        query = self.sb.table('fan_scores').select('*').eq('user_id', user_id)
        if event_id:
            query = query.eq('event_id', event_id)
        result = query.execute()

        total = sum(r['points'] for r in result.data)
        breakdown = {}
        for r in result.data:
            breakdown[r['action']] = breakdown.get(r['action'], 0) + r['points']

        badges = self.sb.table('badges').select('*').eq('user_id', user_id).execute()

        return {
            "total_points": total,
            "breakdown": breakdown,
            "badges": badges.data,
            "level": self._get_level(total)
        }

    def get_leaderboard(self, event_id: str, limit: int = 10) -> list:
        result = self.sb.table('fan_scores').select('user_id, points') \
            .eq('event_id', event_id).execute()

        user_totals = {}
        for r in result.data:
            user_totals[r['user_id']] = user_totals.get(r['user_id'], 0) + r['points']

        sorted_users = sorted(user_totals.items(), key=lambda x: x[1], reverse=True)[:limit]

        return [{"user_id": uid, "total_points": pts, "rank": i + 1}
                for i, (uid, pts) in enumerate(sorted_users)]

    def _get_level(self, points: int) -> dict:
        if points >= 200:
            return {"name": "Stadium Legend", "icon": "🏆", "min_points": 200}
        elif points >= 100:
            return {"name": "Fan Hero", "icon": "⭐", "min_points": 100}
        elif points >= 50:
            return {"name": "Rising Star", "icon": "🌟", "min_points": 50}
        else:
            return {"name": "Rookie", "icon": "🎫", "min_points": 0}

    def _check_badges(self, user_id: str, action: str):
        scores = self.sb.table('fan_scores').select('action') \
            .eq('user_id', user_id).execute()

        action_counts = {}
        for s in scores.data:
            action_counts[s['action']] = action_counts.get(s['action'], 0) + 1

        existing = self.sb.table('badges').select('badge_type') \
            .eq('user_id', user_id).execute()
        existing_types = {b['badge_type'] for b in existing.data}

        badges_to_award = []
        if action_counts.get('express_pickup', 0) >= 3 and 'queue_buster' not in existing_types:
            badges_to_award.append('queue_buster')
        if action_counts.get('rally_point', 0) >= 3 and 'rally_master' not in existing_types:
            badges_to_award.append('rally_master')
        if action_counts.get('food_order', 0) >= 5 and 'foodie' not in existing_types:
            badges_to_award.append('foodie')
        if action_counts.get('zone_checkin', 0) >= 5 and 'explorer' not in existing_types:
            badges_to_award.append('explorer')
        if action_counts.get('group_join', 0) + action_counts.get('group_create', 0) >= 3 \
                and 'social_butterfly' not in existing_types:
            badges_to_award.append('social_butterfly')
        if action_counts.get('sos_response', 0) >= 1 and 'helper' not in existing_types:
            badges_to_award.append('helper')

        for badge_type in badges_to_award:
            defn = BADGE_DEFINITIONS.get(badge_type, {})
            self.sb.table('badges').insert({
                'user_id': user_id,
                'badge_type': badge_type,
                'badge_name': defn.get('name', badge_type)
            }).execute()
