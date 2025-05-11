import os
from flask import Flask, request, jsonify, render_template
from extensions import db
from database import User

def create_app():
    app = Flask(__name__)
    
    # Конфигурация БД
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Инициализация расширений
    db.init_app(app)
    
    # Создание таблиц при первом запуске
    with app.app_context():
        db.create_all()
    
    # Маршруты
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
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
