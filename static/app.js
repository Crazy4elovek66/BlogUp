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

// DOM Elements
const clickButton = document.getElementById('clicker');
const upgradesEl = document.getElementById('upgrades');
const subscribersEl = document.getElementById('subscribers');
const viewsEl = document.getElementById('views');
const totalClicksEl = document.getElementById('total-clicks');
const timePlayedEl = document.getElementById('time-played');
const maxSubscribersEl = document.getElementById('max-subscribers');
const prestigePointsEl = document.getElementById('prestige-points');
const prestigeBonusEl = document.getElementById('prestige-bonus');
const subsProgressEl = document.getElementById('subs-progress');
const prestigeBtn = document.getElementById('prestige-btn');

// Initialize the game
function initGame() {
    // Load saved game if exists
    loadGame();
    
    // Set up event listeners
    clickButton.addEventListener('click', handleClick);
    prestigeBtn.addEventListener('click', prestige);
    
    // Start game loop
    setInterval(gameLoop, 1000);
    
    // Initial render
    updateUI();
    renderUpgrades();
}

// Game loop
function gameLoop() {
    // Update time played
    updateTimePlayed();
    
    // Process auto-upgrades
    processAutoUpgrades();
    
    // Save game periodically
    if (game.clicks % 10 === 0) {
        saveGame();
    }
}

function handleClick() {
    game.clicks++;
    
    // Base views gain
    let viewsGain = 1;
    
    // Apply prestige bonus if available
    const prestigeBonus = 1 + (game.prestige * (game.upgrades.find(u => u.id === 9)?.effect || 0);
    
    // Check for viral video chance
    if (Math.random() < 0.005 * (game.upgrades.find(u => u.id === 2)?.owned * prestigeBonus) {
        const viralGain = Math.floor(Math.random() * 5) + 1;
        game.subscribers += viralGain;
        createNotification(`Вирусный ролик! +${viralGain} подписчиков`, 'fas fa-virus');
    }
    
    // Check for hashtag bonus (upgrade 7)
    if (Math.random() < 0.1 * (game.upgrades.find(u => u.id === 7)?.owned * prestigeBonus)) {
        viewsGain *= 10;
    }
    
    // Add views
    game.views += viewsGain;
    
    // Calculate subscriber chance
    let subChance = 0.001;
    subChance += 0.0002 * (game.upgrades.find(u => u.id === 1)?.owned * prestigeBonus;
    
    // Apply collaboration bonus (upgrade 4)
    if (game.upgrades.find(u => u.id === 4)?.owned) {
        subChance *= 2;
    }
    
    if (Math.random() < subChance) {
        game.subscribers++;
        if (game.subscribers > game.maxSubscribers) {
            game.maxSubscribers = game.subscribers;
        }
    }
    
    // Update progress bar
    game.subsProgress = Math.min((game.subscribers % 100) / 100 * 100, 100);
    
    // Check for prestige unlock
    if (game.subscribers >= 20000 && !game.prestigeUnlocked && game.upgrades.find(u => u.id === 9)?.owned) {
        game.prestigeUnlocked = true;
        createNotification("Престиж разблокирован!", 'fas fa-flag');
    }
    
    // Update UI
    updateUI();
    animateClick();
}

function updateUI() {
    subscribersEl.textContent = formatNumber(game.subscribers);
    viewsEl.textContent = formatNumber(game.views);
    totalClicksEl.textContent = formatNumber(game.clicks);
    maxSubscribersEl.textContent = formatNumber(game.maxSubscribers);
    prestigePointsEl.textContent = formatNumber(game.prestige);
    prestigeBonusEl.textContent = `${Math.round((1 + (game.prestige * (game.upgrades.find(u => u.id === 9)?.effect || 0) - 1) * 100}%`;
    subsProgressEl.style.width = `${game.subsProgress}%`;
    
    // Update upgrade buttons
    renderUpgrades();
}

function updateTimePlayed() {
    const seconds = Math.floor((Date.now() - game.startTime) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    timePlayedEl.textContent = `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${secs}s`;
}

function processAutoUpgrades() {
    const prestigeBonus = 1 + (game.prestige * (game.upgrades.find(u => u.id === 9)?.effect || 0));
    
    // Process ad upgrades (3 and 6)
    const adUpgrade = game.upgrades.find(u => u.id === 3);
    const sponsorUpgrade = game.upgrades.find(u => u.id === 6);
    if (adUpgrade?.owned) {
        let adGain = adUpgrade.effect * adUpgrade.owned;
        if (sponsorUpgrade?.owned) {
            adGain *= sponsorUpgrade.effect * sponsorUpgrade.owned;
        }
        game.views += adGain * prestigeBonus;
    }
    
    // Process merch upgrade (5)
    const merchUpgrade = game.upgrades.find(u => u.id === 5);
    if (merchUpgrade?.owned) {
        game.views += game.subscribers * merchUpgrade.effect * merchUpgrade.owned * prestigeBonus;
    }
    
    // Process affiliate program (8)
    const affiliateUpgrade = game.upgrades.find(u => u.id === 8);
    if (affiliateUpgrade?.owned) {
        if (Math.random() < 0.01 * affiliateUpgrade.effect * affiliateUpgrade.owned * prestigeBonus) {
            game.subscribers++;
            if (game.subscribers > game.maxSubscribers) {
                game.maxSubscribers = game.subscribers;
            }
        }
    }
    
    updateUI();
}

// Format numbers for display
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Create notification
function createNotification(message, icon) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="${icon}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Click animation
function animateClick() {
    clickButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickButton.style.transform = 'scale(1)';
    }, 100);
}

// Save/load game functions
function saveGame() {
    localStorage.setItem('mediaCareerSave', JSON.stringify(game));
}

function loadGame() {
    const savedGame = localStorage.getItem('mediaCareerSave');
    if (savedGame) {
        const parsed = JSON.parse(savedGame);
        
        // Merge saved game with current game state
        for (const key in parsed) {
            if (game.hasOwnProperty(key)) {
                game[key] = parsed[key];
            }
        }
        
        // Restore intervals for auto-upgrades
        game.autoUpgrades = [];
        if (game.upgrades.find(u => u.id === 3)?.owned) {
            game.autoUpgrades.push({ id: 3 });
        }
        if (game.upgrades.find(u => u.id === 5)?.owned) {
            game.autoUpgrades.push({ id: 5 });
        }
        if (game.upgrades.find(u => u.id === 8)?.owned) {
            game.autoUpgrades.push({ id: 8 });
        }
        
        createNotification('Игра загружена!', 'fas fa-check');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
