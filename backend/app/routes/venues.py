from flask import Blueprint, jsonify, current_app
from ..utils.supabase_client import get_supabase

venues_bp = Blueprint('venues', __name__)


@venues_bp.route('/<venue_id>/map', methods=['GET'])
def get_venue_map(venue_id):
    sb = get_supabase()
    venue = sb.table('venues').select('*').eq('id', venue_id).single().execute()
    zones = sb.table('zones').select('*').eq('venue_id', venue_id).execute()

    density_data = {}
    for zone in zones.data:
        snap = sb.table('crowd_density_snapshots') \
            .select('*') \
            .eq('zone_id', zone['id']) \
            .order('snapshot_time', desc=True) \
            .limit(1) \
            .execute()
        if snap.data:
            density_data[zone['id']] = snap.data[0]

    pois = sb.table('points_of_interest').select('*').eq('venue_id', venue_id).execute()

    queue_lookup = {}
    for poi in pois.data:
        q = sb.table('queue_data').select('*').eq('poi_id', poi['id']) \
            .order('updated_at', desc=True).limit(1).execute()
        if q.data:
            queue_lookup[poi['id']] = q.data[0]

    return jsonify({
        'venue': venue.data,
        'zones': [{
            **zone,
            'density': density_data.get(zone['id'], {})
        } for zone in zones.data],
        'pois': [{
            **poi,
            'queue': queue_lookup.get(poi['id'], {})
        } for poi in pois.data]
    })


@venues_bp.route('/<venue_id>/zones', methods=['GET'])
def get_zones(venue_id):
    sb = get_supabase()
    zones = sb.table('zones').select('*').eq('venue_id', venue_id).execute()
    return jsonify({'zones': zones.data})


@venues_bp.route('/<venue_id>/pois', methods=['GET'])
def get_pois(venue_id):
    sb = get_supabase()
    pois = sb.table('points_of_interest').select('*').eq('venue_id', venue_id).execute()
    return jsonify({'pois': pois.data})
