// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();  // Раскрыть на весь экран

let coins = 0;
let clickPower = 1;

document.getElementById('click-btn').addEventListener('click', () => {
    coins += clickPower;
    updateUI();
    // Отправляем данные на сервер
    tg.sendData(JSON.stringify({ type: "click", coins, power: clickPower }));
});

function updateUI() {
    document.getElementById('coins').textContent = `💰 Монеты: ${coins}`;
}

// Получение данных от бота
tg.onEvent('web_app_data', (data) => {
    const parsed = JSON.parse(data);
    coins = parsed.coins || coins;
    clickPower = parsed.power || clickPower;
    updateUI();
});