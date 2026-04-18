from flask import Blueprint, request, jsonify, g
from ..utils.supabase_client import get_supabase
from ..utils.auth_middleware import require_auth
from ..services.gamification import GamificationService

gamification_bp = Blueprint('gamification', __name__)


@gamification_bp.route('/score', methods=['GET'])
@require_auth
def get_score():
    sb = get_supabase()
    event_id = request.args.get('event_id')
    svc = GamificationService(sb)
    score = svc.get_score(g.user_id, event_id)
    return jsonify(score)


@gamification_bp.route('/award', methods=['POST'])
@require_auth
def award_points():
    data = request.json
    sb = get_supabase()
    svc = GamificationService(sb)
    result = svc.award_points(g.user_id, data.get('event_id'), data['action'])
    return jsonify(result)


@gamification_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    sb = get_supabase()
    event_id = request.args.get('event_id')
    svc = GamificationService(sb)
    board = svc.get_leaderboard(event_id)
    return jsonify({'leaderboard': board})
