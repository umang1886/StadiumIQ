from flask import Blueprint, request, jsonify
from supabase import create_client
import os

auth_bp = Blueprint('auth', __name__)


def _get_auth_client():
    return create_client(
        os.environ.get('SUPABASE_URL', ''),
        os.environ.get('SUPABASE_SERVICE_KEY', '')
    )


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        sb = _get_auth_client()
        result = sb.auth.sign_up({
            'email': email,
            'password': password,
            'options': {
                'data': {'display_name': display_name}
            }
        })
        return jsonify({
            'user': {
                'id': result.user.id,
                'email': result.user.email,
                'display_name': display_name
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        sb = _get_auth_client()
        result = sb.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        return jsonify({
            'access_token': result.session.access_token,
            'refresh_token': result.session.refresh_token,
            'user': {
                'id': result.user.id,
                'email': result.user.email,
                'display_name': result.user.user_metadata.get('display_name', '')
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 401
