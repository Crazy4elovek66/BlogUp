from flask import request, jsonify, render_template
from .models import User
from .extensions import db

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/init_user', methods=['POST'])
    def init_user():
        data = request.json
        user_id = data.get('user_id')
        
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            user = User(user_id=user_id)
            db.session.add(user)
            db.session.commit()
        
        return jsonify({'views': user.views})
    
    @app.route('/add_view', methods=['POST'])
    def add_view():
        data = request.json
        user_id = data.get('user_id')
        
        user = User.query.filter_by(user_id=user_id).first()
        if user:
            user.views += 1
            db.session.commit()
            return jsonify({'success': True, 'views': user.views})
        return jsonify({'success': False})