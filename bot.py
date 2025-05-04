import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import psycopg2
from psycopg2 import sql
from contextlib import closing

# Настройка логгирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация базы данных
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"), sslmode="require")

def init_db():
    with closing(get_db_connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id BIGINT PRIMARY KEY,
                    coins INTEGER DEFAULT 0,
                    click_power INTEGER DEFAULT 1,
                    last_click TIMESTAMP DEFAULT NOW()
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS upgrades (
                    user_id BIGINT REFERENCES users(user_id),
                    upgrade_type VARCHAR(50) NOT NULL,
                    level INTEGER DEFAULT 1,
                    PRIMARY KEY (user_id, upgrade_type)
                )
            """)
        conn.commit()

def get_user(user_id):
    with closing(get_db_connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.coins, u.click_power, 
                (SELECT COUNT(*) FROM upgrades WHERE user_id = %s) as upgrades_count
                FROM users u WHERE u.user_id = %s
            """, (user_id, user_id))
            return cursor.fetchone()

def update_user(user_id, coins=None, click_power=None):
    with closing(get_db_connection()) as conn:
        with conn.cursor() as cursor:
            if coins is not None and click_power is not None:
                cursor.execute("""
                    INSERT INTO users (user_id, coins, click_power)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id) DO UPDATE
                    SET coins = EXCLUDED.coins, click_power = EXCLUDED.click_power
                """, (user_id, coins, click_power))
            elif coins is not None:
                cursor.execute("""
                    INSERT INTO users (user_id, coins)
                    VALUES (%s, %s)
                    ON CONFLICT (user_id) DO UPDATE
                    SET coins = EXCLUDED.coins
                """, (user_id, coins))
            conn.commit()

def add_upgrade(user_id, upgrade_type):
    with closing(get_db_connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO upgrades (user_id, upgrade_type)
                VALUES (%s, %s)
                ON CONFLICT (user_id, upgrade_type) DO UPDATE
                SET level = upgrades.level + 1
                RETURNING level
            """, (user_id, upgrade_type))
            conn.commit()
            return cursor.fetchone()[0]

# Команды бота
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_data = get_user(user_id)
    
    if not user_data:
        update_user(user_id, 0, 1)
        user_data = (0, 1, 0)
    
    keyboard = [
        [InlineKeyboardButton("🔨 Кликнуть", callback_data="click")],
        [InlineKeyboardButton("🛒 Улучшения", callback_data="upgrades")]
    ]
    
    await update.message.reply_text(
        f"💰 Монеты: {user_data[0]}\n"
        f"💪 Сила клика: {user_data[1]}\n"
        f"🎚 Улучшений: {user_data[2]}",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user_id = query.from_user.id
    user_data = get_user(user_id)
    
    if query.data == "click":
        new_coins = user_data[0] + user_data[1]
        update_user(user_id, new_coins)
        await query.answer(f"+{user_data[1]} монет!")
        
        keyboard = [
            [InlineKeyboardButton("🔨 Кликнуть", callback_data="click")],
            [InlineKeyboardButton("🛒 Улучшения", callback_data="upgrades")]
        ]
        
        await query.edit_message_text(
            f"💰 Монеты: {new_coins}\n"
            f"💪 Сила клика: {user_data[1]}\n"
            f"🎚 Улучшений: {user_data[2]}",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    
    elif query.data == "upgrades":
        upgrades = [
            ("💪 +1 к силе (10 монет)", "click_power", 10),
            ("⚡ Автокликер (50 монет)", "autoclicker", 50)
        ]
        
        keyboard = []
        for name, upgrade_type, cost in upgrades:
            if user_data[0] >= cost:
                keyboard.append([InlineKeyboardButton(
                    f"{name} (Купить)", 
                    callback_data=f"buy_{upgrade_type}_{cost}")])
        
        keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="back")])
        
        await query.edit_message_text(
            "🛒 Магазин улучшений:",
            reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif query.data.startswith("buy_"):
        _, upgrade_type, cost = query.data.split("_")
        cost = int(cost)
        
        if user_data[0] >= cost:
            new_coins = user_data[0] - cost
            update_user(user_id, new_coins)
            
            if upgrade_type == "click_power":
                new_power = user_data[1] + 1
                update_user(user_id, None, new_power)
            else:
                add_upgrade(user_id, upgrade_type)
            
            await query.answer("Улучшение куплено!")
            await start(update, context)
        else:
            await query.answer("Недостаточно монет!")
    
    elif query.data == "back":
        await start(update, context)

# Запуск бота
def main():
    init_db()
    
    app = Application.builder() \
        .token(os.getenv("TELEGRAM_TOKEN")) \
        .post_init(lambda _: logger.info("Бот запущен")) \
        .build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_click))
    
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
