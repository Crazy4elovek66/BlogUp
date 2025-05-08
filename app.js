// Game state
const game = {
    subscribers: 0,
    maxSubscribers: 0,
    views: 0,
    clicks: 0,
    subsProgress: 0,
    startTime: Date.now(),
    prestige: {
        level: 0,
        points: 0,
        bonus: 1
    },
    upgrades: [
        {
            id: 1,
            name: "Качественный контент",
            icon: "fas fa-star",
            description: "Увеличивает шанс получить подписчика на 0.02%",
            basePrice: 100,
            price: 100,
            owned: 0,
            effect: 0.02,
            unlockAt: 10,
            maxLevel: 50
        },
        {
            id: 2,
            name: "Вирусный ролик",
            icon: "fas fa-virus",
            description: "Шанс получить +1-5 подписчиков за клик (0.5%)",
            basePrice: 500,
            price: 500,
            owned: 0,
            effect: 5,
            unlockAt: 50,
            maxLevel: 10
        },
        {
            id: 3,
            name: "Реклама",
            icon: "fas fa-ad",
            description: "Автоматические просмотры каждую секунду",
            basePrice: 1000,
            price: 1000,
            owned: 0,
            effect: 1,
            unlockAt: 100,
            maxLevel: 20
        },
        {
            id: 4,
            name: "Коллаборация",
            icon: "fas fa-handshake",
            description: "Увеличивает базовый шанс подписчика в 2 раза",
            basePrice: 5000,
            price: 5000,
            owned: 0,
            effect: 2,
            unlockAt: 200,
            maxLevel: 5
        },
        {
            id: 5,
            name: "Мерч",
            icon: "fas fa-tshirt",
            description: "Подписчики приносят просмотры автоматически",
            basePrice: 10000,
            price: 10000,
            owned: 0,
            effect: 0.1,
            unlockAt: 500,
            maxLevel: 10
        },
        {
            id: 6,
            name: "Трендовый хэштег",
            icon: "fas fa-hashtag",
            description: "Увеличивает просмотры за клик на 20%",
            basePrice: 20000,
            price: 20000,
            owned: 0,
            effect: 0.2,
            unlockAt: 1000,
            maxLevel: 5
        },
        {
            id: 7,
            name: "Алгоритм рекомендаций",
            icon: "fas fa-robot",
            description: "Увеличивает все доходы на 50%",
            basePrice: 50000,
            price: 50000,
            owned: 0,
            effect: 0.5,
            unlockAt: 5000,
            maxLevel: 3
        }
    ],
    autoUpgrades: [],
    achievements: [
        { id: 1, name: "Новичок", description: "Получить 10 подписчиков", reward: 100, completed: false, target: 10 },
        { id: 2, name: "Популярный блогер", description: "100 подписчиков", reward: 1000, completed: false, target: 100 },
        { id: 3, name: "Вирусная звезда", description: "1000 подписчиков", reward: 10000, completed: false, target: 1000 },
        { id: 4, name: "Медиамагнат", description: "10000 подписчиков", reward: 100000, completed: false, target: 10000 }
    ],
    lastSave: Date.now()
};

// DOM elements
const subscribersEl = document.getElementById('subscribers');
const viewsEl = document.getElementById('views');
const clickerEl = document.getElementById('clicker');
const subsProgressEl = document.getElementById('subs-progress');
const upgradesEl = document.getElementById('upgrades');
const totalClicksEl = document.getElementById('total-clicks');
const timePlayedEl = document.getElementById('time-played');
const maxSubscribersEl = document.getElementById('max-subscribers');
const prestigePointsEl = document.getElementById('prestige-points');
const prestigeBonusEl = document.getElementById('prestige-bonus');

// Initialize Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand();

// Game functions
function updateUI() {
    subscribersEl.textContent = Math.floor(game.subscribers);
    viewsEl.textContent = formatNumber(game.views);
    subsProgressEl.style.width = `${game.subsProgress}%`;
    prestigePointsEl.textContent = game.prestige.points;
    prestigeBonusEl.textContent = `${(game.prestige.bonus * 100).toFixed(0)}%`;
    
    if (game.subscribers > game.maxSubscribers) {
        game.maxSubscribers = game.subscribers;
        maxSubscribersEl.textContent = Math.floor(game.maxSubscribers);
        checkAchievements();
    }
}

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num);
}

function createNotification(text, icon = 'fas fa-bell') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="${icon}"></i> ${text}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function createFloatingIcon(icon, x, y) {
    const iconEl = document.createElement('i');
    iconEl.className = `floating-icon ${icon}`;
    iconEl.style.left = `${x}px`;
    iconEl.style.top = `${y}px`;
    document.body.appendChild(iconEl);
    
    setTimeout(() => {
        iconEl.remove();
    }, 1000);
}

function makePost() {
    // Base views with prestige bonus
    const baseViews = 1 + Math.floor(Math.random() * 3);
    const viewsMultiplier = 1 + (game.upgrades.find(u => u.id === 6)?.owned * 0.2 || 0;
    const prestigeMultiplier = game.prestige.bonus;
    const viewsGain = Math.floor(baseViews * viewsMultiplier * prestigeMultiplier);
    
    game.views += viewsGain;
    game.clicks++;
    
    // Calculate subscriber chance (base 0.1% + upgrades)
    let subChance = 0.001 * game.prestige.bonus; // 0.1% with prestige bonus
    
    // Apply upgrades
    const qualityUpgrade = game.upgrades.find(u => u.id === 1);
    if (qualityUpgrade) {
        subChance += qualityUpgrade.owned * qualityUpgrade.effect / 100;
    }
    
    const collabUpgrade = game.upgrades.find(u => u.id === 4);
    if (collabUpgrade && collabUpgrade.owned) {
        subChance *= Math.pow(collabUpgrade.effect, collabUpgrade.owned);
    }
    
    const algoUpgrade = game.upgrades.find(u => u.id === 7);
    if (algoUpgrade && algoUpgrade.owned) {
        subChance *= 1 + algoUpgrade.effect * algoUpgrade.owned;
    }
    
    // Try to get subscriber
    if (Math.random() < subChance) {
        let subsGain = 1;
        
        // Check for viral upgrade
        const viralUpgrade = game.upgrades.find(u => u.id === 2);
        if (viralUpgrade && viralUpgrade.owned && Math.random() < 0.005 * viralUpgrade.owned) {
            subsGain += Math.floor(Math.random() * viralUpgrade.effect) + 1;
            createNotification(`Вирусный ролик! +${subsGain} подписчиков`, 'fas fa-virus');
        }
        
        game.subscribers += subsGain;
        game.subsProgress = 0;
        
        createFloatingIcon('fas fa-user-plus', 
            clickerEl.offsetLeft + clickerEl.offsetWidth / 2,
            clickerEl.offsetTop + clickerEl.offsetHeight / 2
        );
    } else {
        // Increase progress bar
        game.subsProgress = Math.min(game.subsProgress + (0.1 + Math.random() * 0.2), 100);
    }
    
    // Animate click
    clickerEl.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickerEl.style.transform = 'scale(1)';
    }, 100);
    
    updateUI();
    renderUpgrades();
}

function buyUpgrade(upgradeId) {
    const upgrade = game.upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade || upgrade.owned >= upgrade.maxLevel) return;
    
    if (game.views >= upgrade.price) {
        game.views -= upgrade.price;
        upgrade.owned++;
        upgrade.price = Math.floor(upgrade.basePrice * Math.pow(1.5, upgrade.owned));
        
        // Apply upgrade effects
        if (upgrade.id === 3 && upgrade.owned === 1) {
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    const algoUpgrade = game.upgrades.find(u => u.id === 7);
                    const algoMultiplier = algoUpgrade?.owned ? 1 + algoUpgrade.effect * algoUpgrade.owned : 1;
                    const prestigeMultiplier = game.prestige.bonus;
                    
                    game.views += upgrade.effect * upgrade.owned * algoMultiplier * prestigeMultiplier;
                    updateUI();
                }, 1000)
            });
        }
        
        if (upgrade.id === 5 && upgrade.owned === 1) {
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    const algoUpgrade = game.upgrades.find(u => u.id === 7);
                    const algoMultiplier = algoUpgrade?.owned ? 1 + algoUpgrade.effect * algoUpgrade.owned : 1;
                    const prestigeMultiplier = game.prestige.bonus;
                    
                    game.views += game.subscribers * upgrade.effect * upgrade.owned * algoMultiplier * prestigeMultiplier;
                    updateUI();
                }, 1000)
            });
        }
        
        createNotification(`Улучшение куплено: ${upgrade.name} (уровень ${upgrade.owned})`, upgrade.icon);
        updateUI();
        renderUpgrades();
    }
}

function renderUpgrades() {
    upgradesEl.innerHTML = '';
    
    game.upgrades.forEach(upgrade => {
        if (game.subscribers >= upgrade.unlockAt) {
            const canAfford = game.views >= upgrade.price;
            const isMaxLevel = upgrade.owned >= upgrade.maxLevel;
            const upgradeEl = document.createElement('div');
            upgradeEl.className = `upgrade ${isMaxLevel ? 'max-level' : ''}`;
            
            upgradeEl.innerHTML = `
                <div class="upgrade-icon">
                    <i class="${upgrade.icon}"></i>
                    ${upgrade.owned > 0 ? `<span class="upgrade-level">${upgrade.owned}</span>` : ''}
                </div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}${isMaxLevel ? ' (MAX)' : ''}</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                    <div class="upgrade-progress">
                        <div class="progress-bar" style="width: ${(upgrade.owned / upgrade.maxLevel) * 100}%"></div>
                    </div>
                </div>
                <div class="upgrade-price">${isMaxLevel ? 'MAX' : formatNumber(upgrade.price)}</div>
                <button class="upgrade-btn" ${canAfford && !isMaxLevel ? '' : 'disabled'}
                    onclick="buyUpgrade(${upgrade.id})">
                    <i class="fas fa-${isMaxLevel ? 'check' : 'shopping-cart'}"></i>
                </button>
            `;
            
            upgradesEl.appendChild(upgradeEl);
        }
    });
}

function checkAchievements() {
    game.achievements.forEach(achievement => {
        if (!achievement.completed && game.maxSubscribers >= achievement.target) {
            achievement.completed = true;
            game.views += achievement.reward;
            createNotification(`Достижение: ${achievement.name}! +${formatNumber(achievement.reward)} просмотров`, 'fas fa-trophy');
        }
    });
}

function prestige() {
    if (game.maxSubscribers < 10000) {
        createNotification("Нужно минимум 10,000 подписчиков для престижа!", 'fas fa-lock');
        return;
    }
    
    const pointsGain = Math.floor(Math.sqrt(game.maxSubscribers / 10000));
    const confirmPrestige = confirm(`Вы получите ${pointsGain} престиж-очков и начнёте заново. Продолжить?`);
    
    if (confirmPrestige) {
        // Clear intervals
        game.autoUpgrades.forEach(upgrade => {
            clearInterval(upgrade.interval);
        });
        
        // Reset game state
        game.prestige.points += pointsGain;
        game.prestige.bonus = 1 + (game.prestige.points * 0.1);
        game.prestige.level++;
        
        game.subscribers = 0;
        game.maxSubscribers = 0;
        game.views = 0;
        game.clicks = 0;
        game.subsProgress = 0;
        game.autoUpgrades = [];
        
        // Reset upgrades but keep prestige upgrades
        game.upgrades.forEach(upgrade => {
            if (upgrade.id < 6) { // Keep only high-end upgrades
                upgrade.owned = 0;
                upgrade.price = upgrade.basePrice;
            }
        });
        
        // Reset achievements
        game.achievements.forEach(achievement => {
            achievement.completed = false;
        });
        
        createNotification(`Престиж ${game.prestige.level}! Бонус: +${(game.prestige.bonus * 100 - 100).toFixed(0)}% к доходам`, 'fas fa-arrow-up');
        updateUI();
        renderUpgrades();
    }
}

function updateStats() {
    totalClicksEl.textContent = game.clicks;
    const seconds = Math.floor((Date.now() - game.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        timePlayedEl.textContent = `${hours}ч ${minutes % 60}м`;
    } else if (minutes > 0) {
        timePlayedEl.textContent = `${minutes}м ${seconds % 60}с`;
    } else {
        timePlayedEl.textContent = `${seconds}с`;
    }
}

function saveGame() {
    localStorage.setItem('blogUpSave', JSON.stringify(game));
    game.lastSave = Date.now();
}

function loadGame() {
    const save = localStorage.getItem('blogUpSave');
    if (save) {
        const savedGame = JSON.parse(save);
        
        // Merge saved game with current game structure
        Object.keys(savedGame).forEach(key => {
            game[key] = savedGame[key];
        });
        
        // Restore intervals for auto upgrades
        game.autoUpgrades = [];
        if (game.upgrades.find(u => u.id === 3 && u.owned > 0)) {
            game.autoUpgrades.push({
                id: 3,
                interval: setInterval(() => {
                    const algoUpgrade = game.upgrades.find(u => u.id === 7);
                    const algoMultiplier = algoUpgrade?.owned ? 1 + algoUpgrade.effect * algoUpgrade.owned : 1;
                    const prestigeMultiplier = game.prestige.bonus;
                    
                    game.views += game.upgrades.find(u => u.id === 3).effect * game.upgrades.find(u => u.id === 3).owned * algoMultiplier * prestigeMultiplier;
                    updateUI();
                }, 1000)
            });
        }
        
        if (game.upgrades.find(u => u.id === 5 && u.owned > 0)) {
            game.autoUpgrades.push({
                id: 5,
                interval: setInterval(() => {
                    const algoUpgrade = game.upgrades.find(u => u.id === 7);
                    const algoMultiplier = algoUpgrade?.owned ? 1 + algoUpgrade.effect * algoUpgrade.owned : 1;
                    const prestigeMultiplier = game.prestige.bonus;
                    
                    game.views += game.subscribers * game.upgrades.find(u => u.id === 5).effect * game.upgrades.find(u => u.id === 5).owned * algoMultiplier * prestigeMultiplier;
                    updateUI();
                }, 1000)
            });
        }
        
        createNotification("Игра загружена", 'fas fa-save');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`.tab:nth-child(${tabName === 'main' ? 1 : tabName === 'upgrades' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Game loop
function gameLoop() {
    updateStats();
    
    // Auto-save every 30 seconds
    if (Date.now() - game.lastSave > 30000) {
        saveGame();
    }
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
clickerEl.addEventListener('click', makePost);
document.getElementById('prestige-btn').addEventListener('click', prestige);

// Initialize game
loadGame();
updateUI();
renderUpgrades();
gameLoop();

// Handle Telegram events
tg.onEvent('viewportChanged', () => {
    tg.expand();
});

// Save on page unload
window.addEventListener('beforeunload', saveGame);
