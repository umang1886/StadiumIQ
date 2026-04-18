from collections import defaultdict
import heapq


class NavEngine:
    """Dijkstra-based in-venue navigation on zone graph."""

    def __init__(self):
        self.graph = defaultdict(list)

    def build_graph(self, zones: list, density_data: dict):
        """Build adjacency graph from zones. Adjacent zones get edges
        with weight = distance + congestion penalty."""
        zone_map = {z['id']: z for z in zones}
        for z in zones:
            coords = z.get('map_coordinates', {})
            zx = coords.get('x', 0) + coords.get('width', 0) / 2
            zy = coords.get('y', 0) + coords.get('height', 0) / 2

            for other in zones:
                if other['id'] == z['id']:
                    continue
                oc = other.get('map_coordinates', {})
                ox = oc.get('x', 0) + oc.get('width', 0) / 2
                oy = oc.get('y', 0) + oc.get('height', 0) / 2

                dist = ((zx - ox) ** 2 + (zy - oy) ** 2) ** 0.5
                if dist < 350:
                    congestion = self._congestion_penalty(
                        density_data.get(other['id'], {}).get('density_level', 'low')
                    )
                    self.graph[z['id']].append((other['id'], dist + congestion))

    def _congestion_penalty(self, level: str) -> float:
        penalties = {'low': 0, 'medium': 50, 'high': 150, 'critical': 300}
        return penalties.get(level, 0)

    def find_route(self, start_zone: str, end_zone: str) -> dict:
        dist = {start_zone: 0}
        prev = {}
        pq = [(0, start_zone)]

        while pq:
            d, node = heapq.heappop(pq)
            if d > dist.get(node, float('inf')):
                continue
            if node == end_zone:
                break
            for neighbor, weight in self.graph.get(node, []):
                new_dist = d + weight
                if new_dist < dist.get(neighbor, float('inf')):
                    dist[neighbor] = new_dist
                    prev[neighbor] = node
                    heapq.heappush(pq, (new_dist, neighbor))

        if end_zone not in dist:
            return {"route": [], "estimated_minutes": 0, "found": False}

        path = []
        current = end_zone
        while current in prev:
            path.append(current)
            current = prev[current]
        path.append(start_zone)
        path.reverse()

        est_minutes = max(1, round(dist[end_zone] / 120))

        return {
            "route": path,
            "estimated_minutes": est_minutes,
            "found": True
        }

    def suggest_exit(self, current_zone: str, exit_pois: list, zones: list, density_data: dict) -> list:
        self.build_graph(zones, density_data)

        poi_zone_map = {}
        for poi in exit_pois:
            if poi.get('zone_id'):
                poi_zone_map[poi['id']] = poi['zone_id']

        results = []
        for poi in exit_pois:
            zone_id = poi_zone_map.get(poi['id'])
            if not zone_id:
                continue
            route = self.find_route(current_zone, zone_id)
            density = density_data.get(zone_id, {}).get('density_level', 'low')
            results.append({
                'poi': poi,
                'route': route,
                'exit_density': density,
                'score': route['estimated_minutes'] + self._congestion_penalty(density) / 100
            })

        return sorted(results, key=lambda x: x['score'])[:3]
