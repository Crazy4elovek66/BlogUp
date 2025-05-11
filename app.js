// Game state
const game = {
    subscribers: 0,
    maxSubscribers: 0,
    views: 0,
    clicks: 0,
    prestige: 0,
    subsProgress: 0,
    startTime: Date.now(),
    upgrades: [
        // Common upgrades (Базовые улучшения)
        {
            id: 1,
            name: "Качественный контент",
            tier: "common",
            icon: "fas fa-star",
            description: "Увеличивает шанс получить подписчика на 0.02%",
            basePrice: 100,
            price: 100,
            owned: 0,
            effect: 0.02,
            unlockAt: 10,
            currency: "views"
        },
        {
            id: 2,
            name: "Вирусный ролик",
            tier: "common",
            icon: "fas fa-virus",
            description: "Шанс получить +1-5 подписчиков за клик (0.5%)",
            basePrice: 500,
            price: 500,
            owned: 0,
            effect: 5,
            unlockAt: 50,
            currency: "views"
        },
        {
            id: 3,
            name: "Реклама",
            tier: "common",
            icon: "fas fa-ad",
            description: "Автоматические просмотры каждую секунду",
            basePrice: 1000,
            price: 1000,
            owned: 0,
            effect: 1,
            unlockAt: 100,
            currency: "views"
        },
        
        // Rare upgrades (Улучшения среднего уровня)
        {
            id: 4,
            name: "Коллаборация",
            tier: "rare",
            icon: "fas fa-handshake",
            description: "Увеличивает базовый шанс подписчика в 2 раза",
            basePrice: 5000,
            price: 5000,
            owned: 0,
            effect: 2,
            unlockAt: 200,
            currency: "views",
            requiredUpgrades: [1, 2]
        },
        {
            id: 5,
            name: "Мерч",
            tier: "rare",
            icon: "fas fa-tshirt",
            description: "Подписчики приносят просмотры автоматически",
            basePrice: 10000,
            price: 10000,
            owned: 0,
            effect: 0.1,
            unlockAt: 500,
            currency: "views",
            requiredUpgrades: [3]
        },
        {
            id: 6,
            name: "Спонсорство",
            tier: "rare",
            icon: "fas fa-money-bill-wave",
            description: "Увеличивает доход от рекламы в 3 раза",
            basePrice: 25000,
            price: 25000,
            owned: 0,
            effect: 3,
            unlockAt: 1000,
            currency: "views",
            requiredUpgrades: [3]
        },
        
        // Epic upgrades (Эпические улучшения)
        {
            id: 7,
            name: "Трендовый хэштег",
            tier: "epic",
            icon: "fas fa-hashtag",
            description: "Каждый клик дает 10% шанс на x10 просмотров",
            basePrice: 100000,
            price: 100000,
            owned: 0,
            effect: 10,
            unlockAt: 5000,
            currency: "views",
            requiredUpgrades: [1, 2, 4]
        },
        {
            id: 8,
            name: "Партнерская программа",
            tier: "epic",
            icon: "fas fa-network-wired",
            description: "Подписчики привлекают новых подписчиков (0.01% в секунду)",
            basePrice: 500,
            price: 500,
            owned: 0,
            effect: 0.01,
            unlockAt: 10000,
            currency: "subscribers",
            requiredUpgrades: [4, 5]
        },
        {
            id: 9,
            name: "Собственный бренд",
            tier: "epic",
            icon: "fas fa-crown",
            description: "Престиж увеличивает все доходы (1% за уровень престижа)",
            basePrice: 1,
            price: 1,
            owned: 0,
            effect: 0.01,
            unlockAt: 20000,
            currency: "prestige",
            requiredUpgrades: [4, 5, 6]
        }
    ],
    autoUpgrades: [],
    prestigeUnlocked: false
};

document.addEventListener('DOMContentLoaded', function() {
    // Получаем user_id из Telegram WebApp
    const user_id = Telegram.WebApp.initDataUnsafe.user?.id.toString();
    
    // Инициализируем пользователя
    fetch('/init_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({user_id: user_id})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('views-count').innerText = data.views;
    });

    // Обработчик клика
    document.getElementById('click-button').addEventListener('click', function() {
        fetch('/add_view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({user_id: user_id})
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                document.getElementById('views-count').innerText = data.views;
                // Анимация клика
                const clickEffect = document.createElement('div');
                clickEffect.className = 'click-effect';
                clickEffect.style.left = (event.clientX - 10) + 'px';
                clickEffect.style.top = (event.clientY - 10) + 'px';
                document.body.appendChild(clickEffect);
                setTimeout(() => clickEffect.remove(), 1000);
            }
        });
    });
});

function updateUI(data) {
    document.getElementById('viewsCount').textContent = data.views;
    document.getElementById('level').textContent = `Уровень: ${data.level}`;
    
    // Пример изменения стиля в зависимости от уровня
    const button = document.getElementById('clickButton');
    button.className = `click-button level-${data.level}`;
}

function animateClick() {
    const button = document.getElementById('clickButton');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => button.style.transform = 'scale(1)', 100);
}

function buyUpgrade(upgradeId) {
    const upgrade = game.upgrades.find(u => u.id === upgradeId);
    
    // Проверка требований к другим улучшениям
    if (upgrade.requiredUpgrades) {
        const hasAllRequirements = upgrade.requiredUpgrades.every(reqId => {
            const reqUpgrade = game.upgrades.find(u => u.id === reqId);
            return reqUpgrade && reqUpgrade.owned > 0;
        });
        
        if (!hasAllRequirements) {
            createNotification(`Требуются другие улучшения!`, 'fas fa-lock');
            return;
        }
    }
    
    // Проверка валюты
    let canAfford = false;
    if (upgrade.currency === "views" && game.views >= upgrade.price) {
        canAfford = true;
        game.views -= upgrade.price;
    } else if (upgrade.currency === "subscribers" && game.subscribers >= upgrade.price) {
        canAfford = true;
        game.subscribers -= upgrade.price;
    } else if (upgrade.currency === "prestige" && game.prestige >= upgrade.price) {
        canAfford = true;
        game.prestige -= upgrade.price;
    }
    
    if (canAfford) {
        upgrade.owned++;
        upgrade.price = Math.floor(upgrade.basePrice * Math.pow(1.5, upgrade.owned));
        
        // Применяем эффекты улучшений
        if (upgrade.id === 3 || upgrade.id === 6) {
            // Очищаем старые авто-улучшения этого типа
            game.autoUpgrades = game.autoUpgrades.filter(au => au.id !== 3);
            
            // Рассчитываем множитель эффекта
            let effect = upgrade.effect;
            if (upgrade.id === 6) effect *= game.upgrades.find(u => u.id === 3).owned;
            
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    game.views += effect;
                    updateUI();
                }, 1000)
            });
        }
        
        if (upgrade.id === 5) {
            game.autoUpgrades = game.autoUpgrades.filter(au => au.id !== 5);
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    game.views += game.subscribers * upgrade.effect * (1 + game.prestige * game.upgrades.find(u => u.id === 9)?.effect || 1);
                    updateUI();
                }, 1000)
            });
        }
        
        if (upgrade.id === 8) {
            game.autoUpgrades = game.autoUpgrades.filter(au => au.id !== 8);
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    if (Math.random() < 0.01 * upgrade.effect * (1 + game.prestige * game.upgrades.find(u => u.id === 9)?.effect || 1)) {
                        game.subscribers += 1;
                        updateUI();
                    }
                }, 1000)
            });
        }
        
        if (upgrade.id === 9 && !game.prestigeUnlocked) {
            game.prestigeUnlocked = true;
            createNotification("Престиж разблокирован! Можно переродиться.", 'fas fa-flag');
        }
        
        createNotification(`Улучшение куплено: ${upgrade.name}`, upgrade.icon);
        updateUI();
        renderUpgrades();
    } else {
        createNotification(`Недостаточно ${upgrade.currency === "views" ? "просмотров" : upgrade.currency === "subscribers" ? "подписчиков" : "престижа"}!`, 'fas fa-times');
    }
}

function renderUpgrades() {
    upgradesEl.innerHTML = '';
    
    // Группируем улучшения по редкости
    const groupedUpgrades = {
        common: [],
        rare: [],
        epic: []
    };
    
    game.upgrades.forEach(upgrade => {
        if (game.subscribers >= upgrade.unlockAt) {
            groupedUpgrades[upgrade.tier].push(upgrade);
        }
    });
    
    // Рендерим каждую группу с заголовком
    for (const [tier, upgrades] of Object.entries(groupedUpgrades)) {
        if (upgrades.length === 0) continue;
        
        const tierTitle = document.createElement('div');
        tierTitle.className = 'upgrade-tier-title';
        tierTitle.textContent = 
            tier === 'common' ? 'Базовые улучшения' : 
            tier === 'rare' ? 'Продвинутые улучшения' : 'Эпические улучшения';
        upgradesEl.appendChild(tierTitle);
        
        upgrades.forEach(upgrade => {
            let canAfford = false;
            if (upgrade.currency === "views") canAfford = game.views >= upgrade.price;
            else if (upgrade.currency === "subscribers") canAfford = game.subscribers >= upgrade.price;
            else if (upgrade.currency === "prestige") canAfford = game.prestige >= upgrade.price;
            
            const upgradeEl = document.createElement('div');
            upgradeEl.className = `upgrade upgrade-${upgrade.tier}`;
            
            upgradeEl.innerHTML = `
                <div class="upgrade-icon">
                    <i class="${upgrade.icon}"></i>
                </div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name} (${upgrade.owned})</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                    ${upgrade.requiredUpgrades ? `<div class="upgrade-reqs">Требуется: ${upgrade.requiredUpgrades.map(id => game.upgrades.find(u => u.id === id).name).join(', ')}</div>` : ''}
                </div>
                <div class="upgrade-price">
                    ${formatNumber(upgrade.price)} 
                    <i class="fas fa-${upgrade.currency === "views" ? "eye" : upgrade.currency === "subscribers" ? "users" : "crown"}"></i>
                </div>
                <button class="upgrade-btn" ${canAfford ? '' : 'disabled'}
                    onclick="buyUpgrade(${upgrade.id})">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            `;
            
            upgradesEl.appendChild(upgradeEl);
        });
    }
}

// Добавляем функцию престижа
function prestige() {
    if (game.prestigeUnlocked && game.subscribers >= 20000) {
        const prestigeGain = Math.floor(Math.sqrt(game.subscribers / 10000));
        game.prestige += prestigeGain;
        
        // Сброс игры, но сохранение престижа и некоторых улучшений
        game.subscribers = 0;
        game.views = 0;
        game.clicks = 0;
        game.subsProgress = 0;
        game.startTime = Date.now();
        
        // Очищаем авто-улучшения
        game.autoUpgrades.forEach(au => clearInterval(au.interval));
        game.autoUpgrades = [];
        
        // Сброс некоторых улучшений (кроме эпических)
        game.upgrades.forEach(upgrade => {
            if (upgrade.tier !== 'epic') {
                upgrade.owned = 0;
                upgrade.price = upgrade.basePrice;
            }
        });
        
        createNotification(`Перерождение! Получено ${prestigeGain} уровней престижа`, 'fas fa-flag');
        updateUI();
        renderUpgrades();
    } else if (!game.prestigeUnlocked) {
        createNotification(`Требуется улучшение "Собственный бренд"`, 'fas fa-lock');
    } else {
        createNotification(`Требуется 20,000 подписчиков для перерождения`, 'fas fa-users');
    }
}

// Добавляем кнопку престижа в HTML и обновляем стили
