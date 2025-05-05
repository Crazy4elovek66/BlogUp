import os
import logging
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from multiprocessing import Process
from waitress import serve
from flask import Flask, jsonify, request
from flask_cors import CORS

# Конфигурация
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Инициализация Flask
flask_app = Flask(__name__)
CORS(flask_app)

# Пул соединений PostgreSQL
connection_pool = None

def init_db():
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=os.getenv("DATABASE_URL"),
            sslmode="require"
        )
        logger.info("PostgreSQL connection pool initialized")
    except Exception as e:
        logger.error(f"DB init error: {e}")
        raise

@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = connection_pool.getconn()
        yield conn
    except Exception as e:
        logger.error(f"DB connection error: {e}")
        raise
    finally:
        if conn:
            connection_pool.putconn(conn)

# Telegram Bot Handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user_id = update.effective_user.id
        web_app_url = f"{os.getenv('WEB_APP_URL')}?user_id={user_id}"
        
        await update.message.reply_text(
            "Welcome to the game!",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton(
                    "Open Game",
                    web_app=WebAppInfo(url=web_app_url)
                )
            ]])
        )
    except Exception as e:
        logger.error(f"Start error: {e}")

# Flask API
@flask_app.route('/api/user', methods=['GET'])
def api_get_user():
    try:
        user_id = request.args.get('id')
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT coins, click_power FROM users WHERE user_id = %s", (user_id,))
                result = cursor.fetchone()
                return jsonify({
                    'coins': result[0] if result else 0,
                    'click_power': result[1] if result else 1
                })
    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

def run_flask():
    port = int(os.getenv("PORT", 5000))
    serve(flask_app, host='0.0.0.0', port=port)

def run_bot():
    app = Application.builder().token(os.getenv("TELEGRAM_TOKEN")).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling(
        drop_pending_updates=True,
        close_loop=False,
        stop_signals=None
    )

if __name__ == "__main__":
    init_db()
    
    # Запуск в отдельных процессах
    flask_process = Process(target=run_flask)
    bot_process = Process(target=run_bot)
    
    flask_process.start()
    bot_process.start()
    
    flask_process.join()
    bot_process.join()
