from flask_sqlalchemy import SQLAlchemy
from app import app
from extensions import db

# Конфигурация БД из переменных окружения Railway
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), unique=True, nullable=False)
    views = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<User {self.user_id}>'
