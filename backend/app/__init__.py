from flask import Flask
from flask_cors import CORS
from .config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=[app.config['FRONTEND_URL']])

    from .routes.auth import auth_bp
    from .routes.venues import venues_bp
    from .routes.queues import queues_bp
    from .routes.crowdsync import crowdsync_bp
    from .routes.events import events_bp
    from .routes.orders import orders_bp
    from .routes.chatbot import chatbot_bp
    from .routes.admin import admin_bp
    from .routes.gamification import gamification_bp
    from .routes.navigation import navigation_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(venues_bp, url_prefix='/api/venues')
    app.register_blueprint(queues_bp, url_prefix='/api/queues')
    app.register_blueprint(crowdsync_bp, url_prefix='/api/sync')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
    app.register_blueprint(navigation_bp, url_prefix='/api/navigation')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'stadiumiq-backend'}

    @app.route('/')
    def index():
        from flask import render_template_string
        frontend_url = app.config.get('FRONTEND_URL', '#')
        return render_template_string('''
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1>StadiumIQ API Server</h1>
                <p>The backend is running successfully!</p>
                <p>This service only handles API requests. To view the application UI, please visit the frontend URL.</p>
                <a href="{{ frontend_url }}" style="color: #0ea5e9;">Go to Frontend</a>
            </div>
        ''', frontend_url=frontend_url)

    return app
