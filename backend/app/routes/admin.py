from flask import Blueprint, request, jsonify, g
from ..utils.supabase_client import get_supabase
from ..utils.auth_middleware import require_auth

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    sb = get_supabase()
    venue_id = request.args.get('venue_id', '11111111-0000-0000-0000-000000000001')

    zones = sb.table('zones').select('*').eq('venue_id', venue_id).execute()
    density_data = []
    for zone in zones.data:
        snap = sb.table('crowd_density_snapshots').select('*') \
            .eq('zone_id', zone['id']).order('snapshot_time', desc=True).limit(1).execute()
        density_data.append({
            **zone,
            'density': snap.data[0] if snap.data else None
        })

    active_orders = sb.table('orders').select('*', count='exact') \
        .in_('status', ['pending', 'preparing']).execute()

    all_queues = sb.table('queue_data').select('*, points_of_interest(name, poi_type)') \
        .order('estimated_wait_minutes', desc=True).execute()

    alerts = sb.table('alerts').select('*').eq('venue_id', venue_id) \
        .order('sent_at', desc=True).limit(10).execute()

    total_occupancy = sum(
        (d.get('density', {}) or {}).get('occupancy_count', 0)
        for d in density_data
    )

    return jsonify({
        'zones': density_data,
        'active_orders_count': active_orders.count if active_orders.count else len(active_orders.data),
        'queues': all_queues.data,
        'recent_alerts': alerts.data,
        'total_occupancy': total_occupancy,
        'stats': {
            'total_zones': len(zones.data),
            'avg_wait': round(sum(q.get('estimated_wait_minutes', 0) for q in all_queues.data) /
                             max(len(all_queues.data), 1), 1)
        }
    })


@admin_bp.route('/orders', methods=['GET'])
def get_all_orders():
    sb = get_supabase()
    status = request.args.get('status')

    query = sb.table('orders').select('*, concession_stands(name)')
    if status:
        query = query.eq('status', status)

    result = query.order('created_at', desc=True).limit(50).execute()
    return jsonify({'orders': result.data})


@admin_bp.route('/queues/<poi_id>', methods=['PATCH'])
def update_queue_admin(poi_id):
    data = request.json
    sb = get_supabase()

    result = sb.table('queue_data').update({
        'estimated_wait_minutes': data.get('estimated_wait_minutes'),
        'queue_length': data.get('queue_length'),
        'occupancy_percent': data.get('occupancy_percent'),
        'source': 'manual',
        'updated_at': 'now()'
    }).eq('poi_id', poi_id).execute()

    return jsonify({'queue': result.data[0] if result.data else {}})


@admin_bp.route('/density/<zone_id>', methods=['PATCH'])
def update_density(zone_id):
    data = request.json
    sb = get_supabase()

    sb.table('crowd_density_snapshots').insert({
        'zone_id': zone_id,
        'density_level': data['density_level'],
        'occupancy_count': data.get('occupancy_count', 0)
    }).execute()

    return jsonify({'status': 'updated'})


@admin_bp.route('/alerts/push', methods=['POST'])
def push_alert():
    data = request.json
    sb = get_supabase()

    alert = sb.table('alerts').insert({
        'venue_id': data['venue_id'],
        'event_id': data.get('event_id'),
        'title': data['title'],
        'body': data['body'],
        'alert_type': data.get('alert_type', 'info'),
        'target_zones': data.get('target_zones')
    }).execute()

    return jsonify({'alert': alert.data[0]}), 201


@admin_bp.route('/events/<event_id>/score', methods=['PATCH'])
def update_score(event_id):
    data = request.json
    sb = get_supabase()

    result = sb.table('events').update({
        'current_score': data['score']
    }).eq('id', event_id).execute()

    return jsonify({'event': result.data[0] if result.data else {}})
