import random
from flask import Blueprint, request, jsonify, g
from ..utils.supabase_client import get_supabase
from ..utils.auth_middleware import require_auth

orders_bp = Blueprint('orders', __name__)


def generate_order_number():
    return f"ST-{random.randint(1000, 9999)}"


@orders_bp.route('/menu', methods=['GET'])
def get_menu():
    sb = get_supabase()
    venue_id = request.args.get('venue_id')
    stand_id = request.args.get('stand_id')
    category = request.args.get('category')

    if stand_id:
        query = sb.table('menu_items').select('*, concession_stands(name, is_open, express_pickup_enabled)') \
            .eq('stand_id', stand_id).eq('is_available', True)
    else:
        query = sb.table('menu_items').select('*, concession_stands(name, is_open, express_pickup_enabled, poi_id)') \
            .eq('is_available', True)

    if category:
        query = query.eq('category', category)

    result = query.execute()

    if venue_id and not stand_id:
        pois = sb.table('points_of_interest').select('id').eq('venue_id', venue_id).execute()
        poi_ids = {p['id'] for p in pois.data}
        stands = sb.table('concession_stands').select('id, poi_id').execute()
        valid_stand_ids = {s['id'] for s in stands.data if s.get('poi_id') in poi_ids}
        result.data = [item for item in result.data if item['stand_id'] in valid_stand_ids]

    return jsonify({'menu': result.data})


@orders_bp.route('', methods=['POST'])
@require_auth
def place_order():
    data = request.json
    sb = get_supabase()

    order_number = generate_order_number()
    total = 0.0
    items = data.get('items', [])

    for item in items:
        menu_item = sb.table('menu_items').select('price').eq('id', item['menu_item_id']).single().execute()
        total += float(menu_item.data['price']) * item.get('quantity', 1)

    order = sb.table('orders').insert({
        'user_id': g.user_id,
        'stand_id': data['stand_id'],
        'event_id': data.get('event_id'),
        'delivery_type': data.get('delivery_type', 'pickup'),
        'seat_number': data.get('seat_number'),
        'total_amount': round(total, 2),
        'order_number': order_number,
        'status': 'pending'
    }).execute()

    for item in items:
        menu_item = sb.table('menu_items').select('price').eq('id', item['menu_item_id']).single().execute()
        sb.table('order_items').insert({
            'order_id': order.data[0]['id'],
            'menu_item_id': item['menu_item_id'],
            'quantity': item.get('quantity', 1),
            'item_price': float(menu_item.data['price'])
        }).execute()

    return jsonify({
        'order': order.data[0],
        'order_number': order_number,
        'total_amount': round(total, 2)
    }), 201


@orders_bp.route('/<order_id>', methods=['GET'])
@require_auth
def get_order(order_id):
    sb = get_supabase()
    order = sb.table('orders').select('*').eq('id', order_id).single().execute()
    items = sb.table('order_items').select('*, menu_items(name, price, category, image_url)') \
        .eq('order_id', order_id).execute()

    return jsonify({
        'order': order.data,
        'items': items.data
    })


@orders_bp.route('/<order_id>/status', methods=['PATCH'])
@require_auth
def update_order_status(order_id):
    data = request.json
    sb = get_supabase()

    update_data = {'status': data['status']}
    if data['status'] == 'ready':
        update_data['ready_at'] = 'now()'

    result = sb.table('orders').update(update_data).eq('id', order_id).execute()
    return jsonify({'order': result.data[0] if result.data else {}})


@orders_bp.route('/history', methods=['GET'])
@require_auth
def order_history():
    sb = get_supabase()
    result = sb.table('orders').select('*, concession_stands(name)') \
        .eq('user_id', g.user_id).order('created_at', desc=True).limit(20).execute()
    return jsonify({'orders': result.data})
