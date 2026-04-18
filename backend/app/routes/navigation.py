from flask import Blueprint, request, jsonify
from ..utils.supabase_client import get_supabase
from ..services.nav_engine import NavEngine

navigation_bp = Blueprint('navigation', __name__)


@navigation_bp.route('/route', methods=['GET'])
def get_route():
    start_zone = request.args.get('from')
    end_zone = request.args.get('to')
    venue_id = request.args.get('venue_id', '11111111-0000-0000-0000-000000000001')

    if not start_zone or not end_zone:
        return jsonify({'error': 'from and to zone IDs are required'}), 400

    sb = get_supabase()
    zones = sb.table('zones').select('*').eq('venue_id', venue_id).execute()

    density_data = {}
    for zone in zones.data:
        snap = sb.table('crowd_density_snapshots').select('*') \
            .eq('zone_id', zone['id']).order('snapshot_time', desc=True).limit(1).execute()
        if snap.data:
            density_data[zone['id']] = snap.data[0]

    engine = NavEngine()
    engine.build_graph(zones.data, density_data)
    route = engine.find_route(start_zone, end_zone)

    zone_map = {z['id']: z for z in zones.data}
    route['route_details'] = [zone_map.get(zid, {}) for zid in route.get('route', [])]

    return jsonify(route)


@navigation_bp.route('/exit', methods=['GET'])
def get_exit_route():
    current_zone = request.args.get('zone_id')
    venue_id = request.args.get('venue_id', '11111111-0000-0000-0000-000000000001')

    if not current_zone:
        return jsonify({'error': 'zone_id is required'}), 400

    sb = get_supabase()
    zones = sb.table('zones').select('*').eq('venue_id', venue_id).execute()
    exit_pois = sb.table('points_of_interest').select('*') \
        .eq('venue_id', venue_id).eq('poi_type', 'exit').execute()

    density_data = {}
    for zone in zones.data:
        snap = sb.table('crowd_density_snapshots').select('*') \
            .eq('zone_id', zone['id']).order('snapshot_time', desc=True).limit(1).execute()
        if snap.data:
            density_data[zone['id']] = snap.data[0]

    engine = NavEngine()
    suggestions = engine.suggest_exit(current_zone, exit_pois.data, zones.data, density_data)

    return jsonify({'exits': suggestions})
