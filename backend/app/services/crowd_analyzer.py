class CrowdAnalyzer:
    DENSITY_THRESHOLDS = {
        'low': 0.3,
        'medium': 0.7,
        'high': 0.9,
        'critical': 1.0
    }

    def calculate_density(self, occupancy_count: int, capacity: int) -> dict:
        if capacity <= 0:
            return {"level": "low", "percentage": 0}

        pct = occupancy_count / capacity
        if pct < 0.3:
            level = "low"
        elif pct < 0.7:
            level = "medium"
        elif pct < 0.9:
            level = "high"
        else:
            level = "critical"

        return {
            "level": level,
            "percentage": round(pct * 100, 1),
            "occupancy": occupancy_count,
            "capacity": capacity
        }

    def get_venue_summary(self, zones_with_density: list) -> dict:
        total_occ = sum(z.get('occupancy', 0) for z in zones_with_density)
        total_cap = sum(z.get('capacity', 0) for z in zones_with_density if z.get('capacity', 0) > 0)
        critical_zones = [z for z in zones_with_density if z.get('density_level') == 'critical']

        return {
            "total_occupancy": total_occ,
            "total_capacity": total_cap,
            "overall_percentage": round((total_occ / total_cap * 100) if total_cap > 0 else 0, 1),
            "critical_zone_count": len(critical_zones),
            "critical_zones": [z.get('name') for z in critical_zones]
        }
