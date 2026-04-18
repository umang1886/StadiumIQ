import numpy as np
from datetime import datetime


class QueuePredictor:
    """
    Lightweight rule-based + data-driven predictor.
    Inputs: time_of_day, event_phase, current_queue_length
    Output: estimated_wait_minutes
    """

    PHASE_MULTIPLIERS = {
        'pre_event': 1.8,
        'halftime': 2.5,
        'in_play': 0.6,
        'post_event': 2.0,
        'normal': 1.0
    }

    BASE_SERVICE_RATE = 0.8  # people per minute per server

    def predict_wait(self, poi_id: str, current_queue_length: int,
                     event_phase: str, time_of_day: int) -> int:
        multiplier = self.PHASE_MULTIPLIERS.get(event_phase, 1.0)
        estimated = (current_queue_length / self.BASE_SERVICE_RATE) * multiplier

        if 12 <= time_of_day <= 14 or 18 <= time_of_day <= 20:
            estimated *= 1.3

        return max(1, round(estimated))

    def suggest_alternatives(self, poi_id: str, all_queues: list, poi_type: str = None) -> list:
        same_type = [q for q in all_queues
                     if q.get('poi_type') == poi_type and q.get('poi_id') != poi_id]
        return sorted(same_type, key=lambda x: x.get('estimated_wait_minutes', 99))[:2]

    def get_queue_level(self, wait_minutes: int) -> dict:
        if wait_minutes < 3:
            return {"level": "low", "label": "Go Now", "color": "#00ff87"}
        elif wait_minutes < 8:
            return {"level": "moderate", "label": "Moderate", "color": "#f59e0b"}
        elif wait_minutes < 15:
            return {"level": "high", "label": "Avoid", "color": "#ef4444"}
        else:
            return {"level": "critical", "label": "Critical", "color": "#7c3aed"}
