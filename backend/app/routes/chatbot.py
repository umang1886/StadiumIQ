from flask import Blueprint, request, jsonify
from ..utils.supabase_client import get_supabase
from ..services.smartbot import SmartBot

chatbot_bp = Blueprint('chatbot', __name__)


@chatbot_bp.route('/message', methods=['POST'])
def chat_message():
    data = request.json
    msg = data.get('message', '')
    venue_id = data.get('venue_id', '11111111-0000-0000-0000-000000000001')
    event_id = data.get('event_id')

    sb = get_supabase()

    # Gather live venue data for SmartBot context
    venue_data = {'stalls': []}
    queue_data = []
    event_data = {}

    try:
        stands = sb.table('concession_stands').select('*, points_of_interest(zone_id, name)').execute()
        for stand in stands.data:
            q = sb.table('queue_data').select('estimated_wait_minutes') \
                .eq('poi_id', stand.get('poi_id')).order('updated_at', desc=True).limit(1).execute()
            venue_data['stalls'].append({
                'name': stand['name'],
                'is_open': stand['is_open'],
                'zone': stand.get('points_of_interest', {}).get('name', ''),
                'queue_wait': q.data[0]['estimated_wait_minutes'] if q.data else 0
            })

        queues = sb.table('queue_data').select('*, points_of_interest(name, poi_type)').execute()
        for q in queues.data:
            queue_data.append({
                'name': q.get('points_of_interest', {}).get('name', 'Unknown'),
                'wait': q.get('estimated_wait_minutes', 0),
                'poi_type': q.get('points_of_interest', {}).get('poi_type', '')
            })

        if event_id:
            ev = sb.table('events').select('*').eq('id', event_id).single().execute()
            event_data = ev.data if ev.data else {}
    except Exception:
        pass

    bot = SmartBot(venue_data, queue_data, event_data)
    response = bot.get_response(msg)

    return jsonify(response)
