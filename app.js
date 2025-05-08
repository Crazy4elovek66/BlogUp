// Game state
const game = {
    subscribers: 0,
    maxSubscribers: 0,
    views: 0,
    clicks: 0,
    subsProgress: 0,
    startTime: Date.now(),
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
            unlockAt: 10
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
            unlockAt: 50
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
            unlockAt: 100
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
            unlockAt: 200
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
            unlockAt: 500
        }
    ],
    autoUpgrades: []
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

// Initialize Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand();

// Game functions
function updateUI() {
    subscribersEl.textContent = Math.floor(game.subscribers);
    viewsEl.textContent = formatNumber(game.views);
    subsProgressEl.style.width = `${game.subsProgress}%`;
    
    if (game.subscribers > game.maxSubscribers) {
        game.maxSubscribers = game.subscribers;
        maxSubscribersEl.textContent = Math.floor(game.maxSubscribers);
    }
}

function formatNumber(num) {
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
    }, 2500);
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
    // Base views
    const viewsGain = 1 + Math.floor(Math.random() * 3);
    game.views += viewsGain;
    game.clicks++;
    
    // Calculate subscriber chance (base 0.1% + upgrades)
    let subChance = 0.001; // 0.1%
    
    // Apply upgrades
    game.upgrades.forEach(upgrade => {
        if (upgrade.id === 1) {
            subChance += upgrade.owned * upgrade.effect / 100;
        }
        if (upgrade.id === 4 && upgrade.owned) {
            subChance *= upgrade.effect;
        }
    });
    
    // Try to get subscriber
    if (Math.random() < subChance) {
        let subsGain = 1;
        
        // Check for viral upgrade
        const viralUpgrade = game.upgrades.find(u => u.id === 2);
        if (viralUpgrade && viralUpgrade.owned && Math.random() < 0.005) {
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
    
    if (game.views >= upgrade.price) {
        game.views -= upgrade.price;
        upgrade.owned++;
        upgrade.price = Math.floor(upgrade.basePrice * Math.pow(1.5, upgrade.owned));
        
        // Apply upgrade effects
        if (upgrade.id === 3) {
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    game.views += upgrade.effect;
                    updateUI();
                }, 1000)
            });
        }
        
        if (upgrade.id === 5 && upgrade.owned) {
            game.autoUpgrades.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    game.views += game.subscribers * upgrade.effect;
                    updateUI();
                }, 1000)
            });
        }
        
        createNotification(`Улучшение куплено: ${upgrade.name}`, upgrade.icon);
        updateUI();
        renderUpgrades();
    }
}

function renderUpgrades() {
    upgradesEl.innerHTML = '';
    
    game.upgrades.forEach(upgrade => {
        if (game.subscribers >= upgrade.unlockAt) {
            const canAfford = game.views >= upgrade.price;
            const upgradeEl = document.createElement('div');
            upgradeEl.className = 'upgrade';
            
            upgradeEl.innerHTML = `
                <div class="upgrade-icon">
                    <i class="${upgrade.icon}"></i>
                </div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name} (${upgrade.owned})</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                </div>
                <div class="upgrade-price">${formatNumber(upgrade.price)}</div>
                <button class="upgrade-btn" ${canAfford ? '' : 'disabled'}
                    onclick="buyUpgrade(${upgrade.id})">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            `;
            
            upgradesEl.appendChild(upgradeEl);
        }
    });
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

function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate selected tab
    document.querySelector(`.tab:nth-child(${tabName === 'main' ? 1 : tabName === 'upgrades' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Game loop
function gameLoop() {
    updateStats();
    requestAnimationFrame(gameLoop);
}

// Event listeners
clickerEl.addEventListener('click', makePost);

// Initialize game
updateUI();
renderUpgrades();
gameLoop();

// Handle Telegram events
tg.onEvent('viewportChanged', () => {
    tg.expand();
});
