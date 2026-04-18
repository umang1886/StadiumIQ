from supabase import create_client
from flask import current_app

_client = None


def get_supabase():
    global _client
    if _client is None:
        _client = create_client(
            current_app.config['SUPABASE_URL'],
            current_app.config['SUPABASE_SERVICE_KEY']
        )
    return _client
