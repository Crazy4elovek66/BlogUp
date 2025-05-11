from flask import Flask, request, jsonify, render_template
from database import db, User
import psycopg2
import os

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

# Подключение к PostgreSQL на Railway
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    return conn

@app.route('/init')
def init_user():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Проверяем существование пользователя
    cur.execute('SELECT views, level FROM users WHERE user_id = %s', (user_id,))
    user = cur.fetchone()
    
    if not user:
        # Создаем нового пользователя
        cur.execute('INSERT INTO users (user_id) VALUES (%s) RETURNING views, level', (user_id,))
        user = cur.fetchone()
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'views': user[0],
        'level': user[1]
    })

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
    
    return jsonify({
        'views': updated[0],
        'level': updated[1]
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
