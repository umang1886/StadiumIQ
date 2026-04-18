import os


class Config:
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
    SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET', '')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
