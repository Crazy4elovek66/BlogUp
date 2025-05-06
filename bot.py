from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Функция для подключения к БД
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    return conn

# Создаем таблицу при первом запуске
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id BIGINT PRIMARY KEY,
            views BIGINT NOT NULL DEFAULT 0,
            click_power INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/click', methods=['POST'])
def handle_click():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "error": "User ID not provided"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Проверяем существование пользователя
        cur.execute(
            "SELECT views, click_power FROM users WHERE user_id = %s",
            (user_id,)
        )
        user = cur.fetchone()
        
        if user:
            # Обновляем существующего пользователя
            views = user[0] + user[1]  # views + click_power
            cur.execute(
                "UPDATE users SET views = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING views, click_power",
                (views, user_id)
        else:
            # Создаем нового пользователя
            views = 1
            cur.execute(
                "INSERT INTO users (user_id, views, click_power) VALUES (%s, %s, 1) RETURNING views, click_power",
                (user_id, views))
        
        updated_data = cur.fetchone()
        conn.commit()
        
        return jsonify({
            "success": True,
            "views": updated_data[0],
            "click_power": updated_data[1]
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/get_stats', methods=['POST'])
def get_stats():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({
            "success": True,
            "views": 0,
            "click_power": 1
        })
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT views, click_power FROM users WHERE user_id = %s",
            (user_id,)
        )
        user = cur.fetchone()
        
        if user:
            return jsonify({
                "success": True,
                "views": user[0],
                "click_power": user[1]
            })
        else:
            return jsonify({
                "success": True,
                "views": 0,
                "click_power": 1
            })
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
