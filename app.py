from flask import Flask, request, jsonify
import psycopg2
import os

app = Flask(__name__)

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
    user_id = request.json.get('user_id')
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Увеличиваем просмотры и проверяем уровень
    cur.execute('''
        UPDATE users 
        SET views = views + 1,
            level = CASE 
                WHEN views >= 100 THEN 3
                WHEN views >= 50 THEN 2
                ELSE 1
            END
        WHERE user_id = %s
        RETURNING views, level
    ''', (user_id,))
    
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'views': updated[0],
        'level': updated[1]
    })

if __name__ == '__main__':
    app.run()
