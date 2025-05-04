import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import sqlite3
import os

# ===== НАСТРОЙКА БАЗЫ ДАННЫХ (SQLite) =====
def init_db():
    conn = sqlite3.connect("hamster.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            coins INTEGER DEFAULT 0,
            click_power INTEGER DEFAULT 1,
            referrals INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

def get_user_data(user_id):
    conn = sqlite3.connect("hamster.db")
    cursor = conn.cursor()
    cursor.execute("SELECT coins, click_power, referrals FROM users WHERE user_id = ?", (user_id,))
    data = cursor.fetchone()
    conn.close()
    if data:
        return {"coins": data[0], "click_power": data[1], "referrals": data[2]}
    else:
        return {"coins": 0, "click_power": 1, "referrals": 0}

def update_user_data(user_id, coins=None, click_power=None, referrals=None):
    user = get_user_data(user_id)
    if coins is not None:
        user["coins"] = coins
    if click_power is not None:
        user["click_power"] = click_power
    if referrals is not None:
        user["referrals"] = referrals
    
    conn = sqlite3.connect("hamster.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO users (user_id, coins, click_power, referrals)
        VALUES (?, ?, ?, ?)
    """, (user_id, user["coins"], user["click_power"], user["referrals"]))
    conn.commit()
    conn.close()

# ===== ОСНОВНЫЕ КОМАНДЫ БОТА =====
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if len(context.args) > 0 and context.args[0].isdigit():
        referrer_id = int(context.args[0])
        if referrer_id != user_id:
            referrer = get_user_data(referrer_id)
            referrer["coins"] += 5
            referrer["referrals"] += 1
            update_user_data(referrer_id, coins=referrer["coins"], referrals=referrer["referrals"])
    
    user = get_user_data(user_id)
    
    keyboard = [
        [InlineKeyboardButton("🔨 Кликнуть", callback_data="click")],
        [InlineKeyboardButton("🛒 Улучшения", callback_data="upgrades"),
         InlineKeyboardButton("👥 Рефералы", callback_data="referrals")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"🐹 Hamster Kombat Clone\n\n"
        f"💰 Монеты: {user['coins']}\n"
        f"💪 Сила клика: {user['click_power']}\n"
        f"👥 Рефералов: {user['referrals']}\n\n"
        f"Пригласи друзей: /invite",
        reply_markup=reply_markup
    )

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user_id = query.from_user.id
    user = get_user_data(user_id)
    
    if query.data == "click":
        user["coins"] += user["click_power"]
        update_user_data(user_id, coins=user["coins"])
        await query.answer(f"+{user['click_power']} монет!")
    
    elif query.data == "upgrades":
        keyboard = [
            [InlineKeyboardButton(f"💪 +1 к клику (10 монет)", callback_data="buy_power_1")],
            [InlineKeyboardButton(f"🚀 x2 доход (50 монет)", callback_data="buy_multiplier")],
            [InlineKeyboardButton("🔙 Назад", callback_data="back")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            "🛒 Магазин улучшений:\n"
            f"Ваш баланс: {user['coins']} монет",
            reply_markup=reply_markup
        )
        return
    
    elif query.data == "referrals":
        ref_link = f"https://t.me/{context.bot.username}?start={user_id}"
        await query.edit_message_text(
            f"👥 Реферальная система\n\n"
            f"Приглашено: {user['referrals']}\n"
            f"Ваша ссылка:\n{ref_link}\n\n"
            f"За каждого друга вы получаете 5 монет!",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Назад", callback_data="back")]])
        )
        return
    
    elif query.data.startswith("buy_"):
        if query.data == "buy_power_1":
            if user["coins"] >= 10:
                user["coins"] -= 10
                user["click_power"] += 1
                update_user_data(user_id, coins=user["coins"], click_power=user["click_power"])
                await query.answer("Улучшение куплено!")
            else:
                await query.answer("Недостаточно монет!")
        elif query.data == "buy_multiplier":
            if user["coins"] >= 50:
                user["coins"] -= 50
                user["click_power"] *= 2
                update_user_data(user_id, coins=user["coins"], click_power=user["click_power"])
                await query.answer("Доход удвоен!")
            else:
                await query.answer("Недостаточно монет!")
        return
    
    elif query.data == "back":
        await start(update, context)
        return
    
    # Обновляем главное меню
    keyboard = [
        [InlineKeyboardButton("🔨 Кликнуть", callback_data="click")],
        [InlineKeyboardButton("🛒 Улучшения", callback_data="upgrades"),
         InlineKeyboardButton("👥 Рефералы", callback_data="referrals")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        f"🐹 Hamster Kombat Clone\n\n"
        f"💰 Монеты: {user['coins']}\n"
        f"💪 Сила клика: {user['click_power']}\n"
        f"👥 Рефералов: {user['referrals']}\n\n"
        f"Пригласи друзей: /invite",
        reply_markup=reply_markup
    )

async def invite(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    ref_link = f"https://t.me/{context.bot.username}?start={user_id}"
    await update.message.reply_text(
        f"🔗 Пригласи друзей и получай бонусы!\n\n"
        f"Твоя реферальная ссылка:\n{ref_link}\n\n"
        f"За каждого друга ты получишь 5 монет!"
    )

# ===== ЗАПУСК БОТА =====
def main():
    # Настройка логов
    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO
    )
    logger = logging.getLogger(__name__)
    
    # Инициализация БД
    init_db()
    
    # Создаем приложение бота
    application = Application.builder().token(os.getenv("TELEGRAM_TOKEN")).build()
    
    # Регистрируем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("invite", invite))
    application.add_handler(CallbackQueryHandler(button_click))
    
    # Запускаем бота
    application.run_polling()

if __name__ == "__main__":
    main()