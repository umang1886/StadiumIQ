from flask import Blueprint, request, jsonify, g
from ..utils.supabase_client import get_supabase
from ..utils.auth_middleware import require_auth

events_bp = Blueprint('events', __name__)


@events_bp.route('/<event_id>/timeline', methods=['GET'])
def get_timeline(event_id):
    sb = get_supabase()
    event = sb.table('events').select('*').eq('id', event_id).single().execute()
    timeline = sb.table('event_timeline').select('*') \
        .eq('event_id', event_id).order('scheduled_time').execute()

    return jsonify({
        'event': event.data,
        'timeline': timeline.data
    })


@events_bp.route('/active', methods=['GET'])
def get_active_events():
    sb = get_supabase()
    venue_id = request.args.get('venue_id')

    query = sb.table('events').select('*')
    if venue_id:
        query = query.eq('venue_id', venue_id)

    result = query.order('event_date', desc=True).limit(5).execute()
    return jsonify({'events': result.data})


@events_bp.route('/alerts', methods=['GET'])
def get_alerts():
    sb = get_supabase()
    venue_id = request.args.get('venue_id')
    event_id = request.args.get('event_id')

    query = sb.table('alerts').select('*')
    if venue_id:
        query = query.eq('venue_id', venue_id)
    if event_id:
        query = query.eq('event_id', event_id)

    result = query.order('sent_at', desc=True).limit(20).execute()
    return jsonify({'alerts': result.data})


@events_bp.route('/alerts/send', methods=['POST'])
@require_auth
def send_alert():
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
