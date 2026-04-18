import random
import string
from flask import Blueprint, request, jsonify, g
from ..utils.auth_middleware import require_auth
from ..utils.supabase_client import get_supabase

crowdsync_bp = Blueprint('crowdsync', __name__)


def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@crowdsync_bp.route('/create', methods=['POST'])
@require_auth
def create_group():
    data = request.json
    code = generate_code()
    sb = get_supabase()

    group = sb.table('sync_groups').insert({
        'code': code,
        'venue_id': data['venue_id'],
        'event_id': data.get('event_id'),
        'created_by': g.user_id
    }).execute()

    sb.table('sync_group_members').insert({
        'group_id': group.data[0]['id'],
        'user_id': g.user_id,
        'display_name': data.get('display_name', 'Host')
    }).execute()

    return jsonify({'code': code, 'group': group.data[0]}), 201


@crowdsync_bp.route('/join', methods=['POST'])
@require_auth
def join_group():
    data = request.json
    sb = get_supabase()

    group = sb.table('sync_groups').select('*').eq('code', data['code'].upper()).execute()
    if not group.data:
        return jsonify({'error': 'Group not found'}), 404

    existing = sb.table('sync_group_members').select('*') \
        .eq('group_id', group.data[0]['id']).eq('user_id', g.user_id).execute()
    if existing.data:
        return jsonify({'group': group.data[0], 'member': existing.data[0]})

    member = sb.table('sync_group_members').insert({
        'group_id': group.data[0]['id'],
        'user_id': g.user_id,
        'display_name': data.get('display_name', 'Member')
    }).execute()

    return jsonify({'group': group.data[0], 'member': member.data[0]}), 201


@crowdsync_bp.route('/group/<code>', methods=['GET'])
@require_auth
def get_group(code):
    sb = get_supabase()
    group = sb.table('sync_groups').select('*').eq('code', code.upper()).execute()
    if not group.data:
        return jsonify({'error': 'Group not found'}), 404

    members = sb.table('sync_group_members').select('*, zones(name, zone_code)') \
        .eq('group_id', group.data[0]['id']).execute()

    return jsonify({
        'group': group.data[0],
        'members': members.data
    })


@crowdsync_bp.route('/location', methods=['PATCH'])
@require_auth
def update_location():
    data = request.json
    sb = get_supabase()

    sb.table('sync_group_members').update({
        'current_zone_id': data['zone_id'],
        'last_seen': 'now()'
    }).eq('user_id', g.user_id).eq('group_id', data['group_id']).execute()

    return jsonify({'status': 'updated'})


@crowdsync_bp.route('/rally', methods=['POST'])
@require_auth
def set_rally_point():
    data = request.json
    sb = get_supabase()

    sb.table('sync_groups').update({
        'rally_point_poi_id': data['poi_id']
    }).eq('id', data['group_id']).execute()

    return jsonify({'status': 'rally point set'})


@crowdsync_bp.route('/pulse', methods=['POST'])
@require_auth
def send_pulse():
    data = request.json
    sb = get_supabase()

    sb.table('sync_group_members').update({
        'pulse_message': data['message'],
        'last_seen': 'now()'
    }).eq('user_id', g.user_id).eq('group_id', data['group_id']).execute()

    return jsonify({'status': 'pulse sent'})


@crowdsync_bp.route('/sos', methods=['POST'])
@require_auth
def send_sos():
    data = request.json
    sb = get_supabase()

    sb.table('sync_group_members').update({
        'status': 'distress',
        'last_seen': 'now()'
    }).eq('user_id', g.user_id).eq('group_id', data['group_id']).execute()

    return jsonify({'status': 'SOS sent'})
