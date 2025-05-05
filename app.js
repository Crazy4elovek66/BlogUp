// Инициализация
const tg = window.Telegram.WebApp;
tg.expand();
const userId = new URLSearchParams(window.location.search).get('user_id');

// Состояние игры
let gameState = {
    coins: 0,
    clickPower: 1,
    upgrades: {}
};

// Загрузка данных
async function loadGame() {
    try {
        const response = await fetch(`https://your-backend-url.railway.app/api/user?id=${userId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            gameState = {
                coins: data.data.coins,
                clickPower: data.data.click_power,
                upgrades: data.data.upgrades || {}
            };
            updateUI();
        }
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }
}

// Сохранение данных
function saveGame() {
    tg.sendData(JSON.stringify({
        user_id: parseInt(userId),
        coins: gameState.coins,
        click_power: gameState.clickPower,
        upgrades: gameState.upgrades
    }));
}

// Автосохранение каждые 30 сек
setInterval(saveGame, 30000);

// Инициализация
loadGame();
