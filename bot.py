from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import psycopg2
from urllib.parse import parse_qs
import hashlib
import hmac

app = Flask(__name__)
CORS(app)

# Конфигурация
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DB_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DB_URL)

def init_db():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                views BIGINT NOT NULL DEFAULT 0,
                click_power INT NOT NULL DEFAULT 1
            )
        """)
        conn.commit()
    except Exception as e:
        print(f"DB init error: {e}")
    finally:
        if conn: conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/click', methods=['POST'])
def handle_click():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"success": False, "error": "User ID required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO users (user_id, views, click_power)
            VALUES (%s, 1, 1)
            ON CONFLICT (user_id) 
            DO UPDATE SET views = users.views + users.click_power
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
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

@app.route('/stats', methods=['POST'])
def get_stats():
    try:
        data = request.json
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
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
