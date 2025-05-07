from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import DictCursor
import os

app = Flask(__name__)

# Подключение к Postgres
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('PGHOST'),
        database=os.getenv('PGDATABASE'),
        user=os.getenv('PGUSER'),
        password=os.getenv('PGPASSWORD'),
        port=os.getenv('PGPORT')
    )
    return conn

# Маршрут для получения данных пользователя
@app.route('/api/user_data', methods=['GET'])
def get_user_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=DictCursor)
    
    try:
        # Проверяем, есть ли пользователь в базе
        cur.execute(
            "SELECT * FROM user_progress WHERE user_id = %s",
            (user_id,)
        )
        user_data = cur.fetchone()
        
        if not user_data:
            # Создаем новую запись для нового пользователя
            cur.execute(
                "INSERT INTO user_progress (user_id) VALUES (%s) RETURNING *",
                (user_id,)
            )
            user_data = cur.fetchone()
            conn.commit()
        
        return jsonify({
            'views': user_data['views'],
            'subscribers': user_data['subscribers'],
            'click_power': user_data['click_power'],
            'level': user_data['level']
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Маршрут для сохранения данных пользователя
@app.route('/api/save_data', methods=['POST'])
def save_user_data():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """
            INSERT INTO user_progress (user_id, views, subscribers, click_power, level)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                views = EXCLUDED.views,
                subscribers = EXCLUDED.subscribers,
                click_power = EXCLUDED.click_power,
                level = EXCLUDED.level,
                last_updated = NOW()
            """,
            (
                user_id,
                data.get('views', 0),
                data.get('subscribers', 0),
                data.get('click_power', 1),
                data.get('level', 'Новичок')
            )
        )
        conn.commit()
        return jsonify({'status': 'success'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv('PORT', 5000))
