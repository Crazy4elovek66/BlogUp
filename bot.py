import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psycopg2
from urllib.parse import parse_qs
import hashlib
import hmac
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Конфигурация
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DB_URL = os.getenv('DATABASE_URL')  # Railway автоматически предоставляет это

def get_db_connection():
    return psycopg2.connect(DB_URL)

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                username VARCHAR(100),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                views BIGINT NOT NULL DEFAULT 0,
                click_power INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_user_id ON users(user_id);
        """)
        conn.commit()
    except Exception as e:
        print(f"Database initialization error: {e}")
    finally:
        cur.close()
        conn.close()

init_db()

def verify_webapp_data(init_data):
    try:
        parsed_data = parse_qs(init_data)
        hash_str = parsed_data.get('hash', [''])[0]
        data_check_str = '\n'.join([
            f"{k}={v[0]}" for k, v in sorted(parsed_data.items()) if k != 'hash'
        ])
        
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=TELEGRAM_BOT_TOKEN.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        computed_hash = hmac.new(
            key=secret_key,
            msg=data_check_str.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return computed_hash == hash_str
    except Exception as e:
        print(f"Verification error: {e}")
        return False

@app.route('/')
def index():
    init_data = request.args.get('initData', '')
    if not verify_webapp_data(init_data):
        return "Invalid Telegram WebApp initialization", 403
    return render_template('index.html')

@app.route('/click', methods=['POST'])
def handle_click():
    try:
        data = request.json
        init_data = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not verify_webapp_data(init_data):
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"success": False, "error": "User ID required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Получаем или создаем пользователя
        cur.execute("""
            INSERT INTO users (user_id, views, click_power)
            VALUES (%s, 1, 1)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                views = users.views + users.click_power,
                updated_at = CURRENT_TIMESTAMP
            RETURNING views, click_power
        """, (user_id,))
        
        result = cur.fetchone()
        conn.commit()
        
        return jsonify({
            "success": True,
            "views": result[0],
            "click_power": result[1]
        })
        
    except Exception as e:
        print(f"Error in /click: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

@app.route('/stats', methods=['POST'])
def get_stats():
    try:
        data = request.json
        init_data = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not verify_webapp_data(init_data):
            return jsonify({"success": False, "error": "Unauthorized"}), 401

        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"success": False, "error": "User ID required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT views, click_power FROM users WHERE user_id = %s
        """, (user_id,))
        
        result = cur.fetchone()
        if result:
            return jsonify({
                "success": True,
                "views": result[0],
                "click_power": result[1]
            })
        else:
            return jsonify({
                "success": True,
                "views": 0,
                "click_power": 1
            })
            
    except Exception as e:
        print(f"Error in /stats: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

@app.after_request
def add_headers(response):
    response.headers['Content-Security-Policy'] = "default-src 'self' https://telegram.org; script-src 'self' https://telegram.org 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
