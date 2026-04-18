from flask import Blueprint, request, jsonify, g
from ..utils.supabase_client import get_supabase
from ..utils.auth_middleware import require_auth
from ..services.queue_predictor import QueuePredictor

queues_bp = Blueprint('queues', __name__)
predictor = QueuePredictor()


@queues_bp.route('', methods=['GET'])
def get_queues():
    sb = get_supabase()
    venue_id = request.args.get('venue_id')
    poi_id = request.args.get('poi_id')

    query = sb.table('queue_data').select('*, points_of_interest(name, poi_type, zone_id)')

    if poi_id:
        query = query.eq('poi_id', poi_id)

    result = query.order('updated_at', desc=True).execute()

    if venue_id and not poi_id:
        pois = sb.table('points_of_interest').select('id').eq('venue_id', venue_id).execute()
        poi_ids = {p['id'] for p in pois.data}
        result.data = [q for q in result.data if q['poi_id'] in poi_ids]

    return jsonify({'queues': result.data})


@queues_bp.route('/update', methods=['POST'])
@require_auth
def update_queue():
    data = request.json
    sb = get_supabase()

    update_data = {
        'estimated_wait_minutes': data.get('estimated_wait_minutes'),
        'queue_length': data.get('queue_length'),
        'occupancy_percent': data.get('occupancy_percent'),
        'source': data.get('source', 'manual'),
        'updated_at': 'now()'
    }

    result = sb.table('queue_data').update(update_data) \
        .eq('poi_id', data['poi_id']).execute()

    if not result.data:
        update_data['poi_id'] = data['poi_id']
        result = sb.table('queue_data').insert(update_data).execute()

    return jsonify({'queue': result.data[0] if result.data else {}})


@queues_bp.route('/predict', methods=['GET'])
def predict_queue():
    poi_id = request.args.get('poi_id')
    event_phase = request.args.get('event_phase', 'normal')
    queue_length = int(request.args.get('queue_length', 10))
    from datetime import datetime
    time_of_day = datetime.now().hour

    estimated = predictor.predict_wait(poi_id, queue_length, event_phase, time_of_day)
    return jsonify({'poi_id': poi_id, 'predicted_wait_minutes': estimated})


@queues_bp.route('/heatmap', methods=['GET'])
def get_heatmap():
    venue_id = request.args.get('venue_id')
    sb = get_supabase()

    zones = sb.table('zones').select('*').eq('venue_id', venue_id).execute()
    result = []
    for zone in zones.data:
        snap = sb.table('crowd_density_snapshots').select('*') \
            .eq('zone_id', zone['id']).order('snapshot_time', desc=True).limit(1).execute()
        result.append({
            'zone': zone,
            'density': snap.data[0] if snap.data else None
        })

    return jsonify({'heatmap': result})
