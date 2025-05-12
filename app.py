import os
from flask import Flask, render_template, send_from_directory
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import logging
from dotenv import load_dotenv

# Инициализация Flask приложения
app = Flask(__name__, template_folder='templates', static_folder='static')

# Загрузка переменных окружения
load_dotenv()
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Хранение состояния игры (в реальном проекте используйте базу данных)
user_data = {}

# Маршруты Flask
@app.route('/')
def index():
    return render_template('index.html', app_name="BlogUp")

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# Telegram Bot Handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start"""
    user_id = update.effective_user.id
    if user_id not in user_data:
        user_data[user_id] = {
            'clicks': 0,
            'level': 1,
            'upgrades': {},
            'last_click_time': None
        }
    
    keyboard = [
        [InlineKeyboardButton("Кликнуть!", callback_data='click')],
        [InlineKeyboardButton("Улучшения", callback_data='upgrades'),
         InlineKeyboardButton("Статистика", callback_data='stats')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"Добро пожаловать в BlogUp!\n\n"
        f"🔹 Клики: {user_data[user_id]['clicks']}\n"
        f"🔹 Уровень: {user_data[user_id]['level']}",
        reply_markup=reply_markup
    )

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик нажатий кнопок"""
    query = update.callback_query
    user_id = query.from_user.id
    
    try:
        if query.data == 'click':
            # Логика клика
            user_data[user_id]['clicks'] += 1
            clicks = user_data[user_id]['clicks']
            
            # Проверка уровня (каждые 10 кликов - новый уровень)
            new_level = clicks // 10 + 1
            if new_level > user_data[user_id]['level']:
                user_data[user_id]['level'] = new_level
                await query.answer(f"🎉 Новый уровень: {new_level}!")
            
            # Обновляем сообщение
            await query.edit_message_text(
                text=f"BlogUp - Уровень {user_data[user_id]['level']}\n\n"
                     f"🔹 Клики: {user_data[user_id]['clicks']}\n"
                     f"🔹 Улучшений: {len(user_data[user_id].get('upgrades', {}))}",
                reply_markup=query.message.reply_markup
            )
        
        elif query.data == 'upgrades':
            # Меню улучшений
            keyboard = [
                [InlineKeyboardButton("+1 клик/сек (100 кликов)", callback_data='buy_auto_click')],
                [InlineKeyboardButton("x2 множитель (500 кликов)", callback_data='buy_multiplier')],
                [InlineKeyboardButton("Назад", callback_data='main_menu')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(
                text="🛠 Улучшения:\n\n"
                     "1. Автокликер: +1 клик/сек\n"
                     "2. Множитель: x2 к каждому клику",
                reply_markup=reply_markup
            )
        
        elif query.data == 'stats':
            # Статистика игрока
            stats_text = (
                f"📊 Ваша статистика:\n\n"
                f"🔹 Всего кликов: {user_data[user_id]['clicks']}\n"
                f"🔹 Уровень: {user_data[user_id]['level']}\n"
                f"🔹 Улучшений: {len(user_data[user_id].get('upgrades', {}))}\n"
                f"🔹 ID игрока: {user_id}"
            )
            await query.edit_message_text(
                text=stats_text,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("Назад", callback_data='main_menu')]
                ])
            )
        
        elif query.data == 'main_menu':
            # Возврат в главное меню
            keyboard = [
                [InlineKeyboardButton("Кликнуть!", callback_data='click')],
                [InlineKeyboardButton("Улучшения", callback_data='upgrades'),
                 InlineKeyboardButton("Статистика", callback_data='stats')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(
                text=f"BlogUp - Уровень {user_data[user_id]['level']}\n\n"
                     f"🔹 Клики: {user_data[user_id]['clicks']}\n"
                     f"🔹 Улучшений: {len(user_data[user_id].get('upgrades', {}))}",
                reply_markup=reply_markup
            )
        
        elif query.data.startswith('buy_'):
            # Логика покупки улучшений
            if query.data == 'buy_auto_click' and user_data[user_id]['clicks'] >= 100:
                user_data[user_id]['clicks'] -= 100
                user_data[user_id].setdefault('upgrades', {})['auto_click'] = True
                await query.answer("✅ Автокликер куплен! +1 клик/сек")
            elif query.data == 'buy_multiplier' and user_data[user_id]['clicks'] >= 500:
                user_data[user_id]['clicks'] -= 500
                user_data[user_id].setdefault('upgrades', {})['multiplier'] = True
                await query.answer("✅ Множитель куплен! x2 к кликам")
            else:
                await query.answer("❌ Недостаточно кликов!")
            
            await query.edit_message_reply_markup(reply_markup=query.message.reply_markup)
    
    except Exception as e:
        logger.error(f"Error in button_click: {e}")
        await query.answer("⚠️ Произошла ошибка, попробуйте позже")

def setup_handlers(application):
    """Настройка обработчиков команд"""
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_click))

def main():
    """Запуск приложения"""
    # Создаем Telegram Application
    application = Application.builder().token(TOKEN).build()
    
    # Настраиваем обработчики
    setup_handlers(application)
    
    # Запускаем Flask в отдельном потоке
    from threading import Thread
    Thread(target=app.run, kwargs={'host': '0.0.0.0', 'port': 5000}).start()
    
    # Запускаем Telegram бота
    application.run_polling()

if __name__ == "__main__":
    main()