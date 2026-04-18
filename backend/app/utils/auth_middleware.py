from functools import wraps
from flask import request, jsonify, g
from .supabase_client import get_supabase


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing token'}), 401
        token = auth_header.split(' ')[1]
        try:
            sb = get_supabase()
            response = sb.auth.get_user(token)
            if not response or not response.user:
                return jsonify({'error': 'Invalid token'}), 401
            g.user_id = response.user.id
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """Extracts user_id if token is present, but doesn't require it."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        g.user_id = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                sb = get_supabase()
                response = sb.auth.get_user(token)
                if response and response.user:
                    g.user_id = response.user.id
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated
