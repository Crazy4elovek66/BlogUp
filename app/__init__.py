import os
from flask import Flask
from .extensions import db

def create_app():
    app = Flask(__name__)
    
    # Настройка БД
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Инициализация расширений
    db.init_app(app)
    
    # Регистрация маршрутов
    from .routes import init_routes
    init_routes(app)
    
    # Создание таблиц
    with app.app_context():
        db.create_all()
    
    return app