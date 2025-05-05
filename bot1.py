import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
import psycopg2
from psycopg2 import pool
import json
from contextlib import contextmanager

# Настройка логгирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Пул соединений PostgreSQL
connection_pool = None

# Инициализация базы данных
def init_db():
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=os.getenv("DATABASE_URL"),
            sslmode="require"
        )
        logger.info("Инициализирован пул соединений с PostgreSQL")
        
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        user_id BIGINT PRIMARY KEY,
                        coins INTEGER DEFAULT 0,
                        click_power INTEGER DEFAULT 1,
                        upgrades JSONB DEFAULT '{}'
                    )
                """)
                conn.commit()
    except Exception as e:
        logger.error(f"Ошибка инициализации БД: {e}")
        raise

@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = connection_pool.getconn()
        yield conn
    except Exception as e:
        logger.error(f"Ошибка подключения к БД: {e}")
        raise
    finally:
        if conn:
            connection_pool.putconn(conn)

def get_user_data(user_id):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT coins, click_power, upgrades 
                    FROM users WHERE user_id = %s
                """, (user_id,))
                result = cursor.fetchone()
                if result:
                    return {
                        'coins': result[0],
                        'click_power': result[1],
                        'upgrades': result[2] if result[2] else {}
                    }
                return None
    except Exception as e:
        logger.error(f"Ошибка получения данных пользователя {user_id}: {e}")
        return None

def update_user_data(user_id, coins=None, click_power=None, upgrades=None):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                if all(v is not None for v in [coins, click_power, upgrades]):
                    cursor.execute("""
                        INSERT INTO users (user_id, coins, click_power, upgrades)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (user_id) DO UPDATE
                        SET coins = EXCLUDED.coins, 
                            click_power = EXCLUDED.click_power,
                            upgrades = EXCLUDED.upgrades
                    """, (user_id, coins, click_power, json.dumps(upgrades)))
                elif coins is not None and click_power is not None:
                    cursor.execute("""
                        INSERT INTO users (user_id, coins, click_power)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (user_id) DO UPDATE
                        SET coins = EXCLUDED.coins, 
                            click_power = EXCLUDED.click_power
                    """, (user_id, coins, click_power))
                elif coins is not None:
                    cursor.execute("""
                        INSERT INTO users (user_id, coins)
                        VALUES (%s, %s)
                        ON CONFLICT (user_id) DO UPDATE
                        SET coins = EXCLUDED.coins
                    """, (user_id, coins))
                conn.commit()
    except Exception as e:
        logger.error(f"Ошибка обновления данных пользователя {user_id}: {e}")

# Команда для запуска Web App
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user_id = update.effective_user.id
        user_data = get_user_data(user_id)
        if not user_data:
            # Создаем нового пользователя
            update_user_data(user_id, 0, 1, {})
            user_data = {'coins': 0, 'click_power': 1, 'upgrades': {}}
        
        # Кнопка для открытия Web App
        keyboard = [
            [InlineKeyboardButton(
                "🎮 Открыть игру", 
                web_app=WebAppInfo(url=f"https://ваш-сайт.vercel.app?user_id={user_id}"))
            ]
        ]
        
        await update.message.reply_text(
            "Добро пожаловать в Hamster Kombat!",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    except Exception as e:
        logger.error(f"Ошибка в команде /start: {e}")
        await update.message.reply_text("⚠️ Произошла ошибка. Попробуйте позже.")
        
def debug_db():
    """Функция для проверки данных в БД"""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users")
            print("Данные в БД:")
            for row in cursor.fetchall():
                print(row)

# Обработка данных из Web App
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user_id = update.effective_user.id
        data = json.loads(update.message.web_app_data.data)
        
        # Сохраняем данные от фронтенда
        update_user_data(
            user_id,
            coins=data.get('coins'),
            click_power=data.get('click_power'),
            upgrades=data.get('upgrades', {})
        )
        
        await update.message.reply_text("✅ Прогресс сохранён!")
    except Exception as e:
        logger.error(f"Ошибка обработки данных Web App: {e}")
        await update.message.reply_text("⚠️ Ошибка сохранения прогресса")

# API для фронтенда (получение данных пользователя)
async def get_user_data_api(user_id: int):
    try:
        data = get_user_data(user_id)
        if data:
            return {
                'status': 'success',
                'data': {
                    'coins': data['coins'],
                    'click_power': data['click_power'],
                    'upgrades': data['upgrades']
                }
            }
        return {'status': 'error', 'message': 'User not found'}
    except Exception as e:
        logger.error(f"API Error for user {user_id}: {e}")
        return {'status': 'error', 'message': str(e)}

def main():
    # Проверка переменных окружения
    required_vars = ['TELEGRAM_TOKEN', 'DATABASE_URL', 'WEB_APP_URL']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Отсутствуют переменные: {', '.join(missing_vars)}")
        raise ValueError("Не заданы обязательные переменные окружения")
    
    init_db()
    
    app = Application.builder().token(os.getenv("TELEGRAM_TOKEN")).build()
    
    # Обработчики команд
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    
    # Запуск бота
    app.run_polling(
        drop_pending_updates=True,
        close_loop=False,
        stop_signals=None
    )

if __name__ == "__main__":
    main()
