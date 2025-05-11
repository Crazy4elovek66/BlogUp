from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import logging
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Хранение состояния игры (в реальном проекте используйте базу данных)
user_data = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_data[user_id] = {'clicks': 0, 'level': 1}
    
    keyboard = [
        [InlineKeyboardButton("Кликнуть!", callback_data='click')],
        [InlineKeyboardButton("Улучшения", callback_data='upgrades')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"Добро пожаловать в игру! Ваши клики: 0\nУровень: 1",
        reply_markup=reply_markup
    )

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    user_id = query.from_user.id
    
    if query.data == 'click':
        # Увеличиваем счётчик кликов
        user_data[user_id]['clicks'] += 1
        
        # Проверяем уровень (например, каждые 10 кликов - новый уровень)
        if user_data[user_id]['clicks'] % 10 == 0:
            user_data[user_id]['level'] += 1
        
        # Обновляем сообщение
        await query.edit_message_text(
            text=f"Ваши клики: {user_data[user_id]['clicks']}\nУровень: {user_data[user_id]['level']}",
            reply_markup=query.message.reply_markup
        )
    elif query.data == 'upgrades':
        # Логика для улучшений
        keyboard = [
            [InlineKeyboardButton("Улучшение 1", callback_data='upgrade_1')],
            [InlineKeyboardButton("Назад", callback_data='back')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text="Выберите улучшение:",
            reply_markup=reply_markup
        )
    elif query.data == 'back':
        # Возврат к основному экрану
        keyboard = [
            [InlineKeyboardButton("Кликнуть!", callback_data='click')],
            [InlineKeyboardButton("Улучшения", callback_data='upgrades')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text=f"Ваши клики: {user_data[user_id]['clicks']}\nУровень: {user_data[user_id]['level']}",
            reply_markup=reply_markup
        )

def main() -> None:
    application = Application.builder().token(TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_click))
    
    application.run_polling()

if __name__ == "__main__":
    main()