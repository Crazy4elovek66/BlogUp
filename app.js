// Game state
const game = {
    score: 0,
    totalScore: 0,
    clicks: 0,
    cps: 0,
    highestCps: 0,
    startTime: Date.now(),
    upgrades: [
        {
            id: 1,
            name: "Auto Clicker",
            description: "Automatically clicks once per second",
            basePrice: 10,
            price: 10,
            owned: 0,
            effect: 1,
            unlockAt: 0
        },
        {
            id: 2,
            name: "Double Click",
            description: "Each click gives 2x points",
            basePrice: 50,
            price: 50,
            owned: 0,
            effect: 2,
            unlockAt: 20
        },
        {
            id: 3,
            name: "Mega Click",
            description: "Each click gives 5x points",
            basePrice: 200,
            price: 200,
            owned: 0,
            effect: 5,
            unlockAt: 100
        },
        {
            id: 4,
            name: "Super Auto Clicker",
            description: "Automatically clicks 5 times per second",
            basePrice: 500,
            price: 500,
            owned: 0,
            effect: 5,
            unlockAt: 200
        },
        {
            id: 5,
            name: "Ultra Click",
            description: "Each click gives 10x points",
            basePrice: 1000,
            price: 1000,
            owned: 0,
            effect: 10,
            unlockAt: 500
        }
    ],
    autoClickers: []
};

// DOM elements
const scoreEl = document.getElementById('score');
const clickerEl = document.getElementById('clicker');
const cpsEl = document.getElementById('cps');
const totalEl = document.getElementById('total');
const upgradesEl = document.getElementById('upgrades');
const totalClicksEl = document.getElementById('total-clicks');
const timePlayedEl = document.getElementById('time-played');
const highestCpsEl = document.getElementById('highest-cps');
const particlesEl = document.getElementById('particles');

// Initialize Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand();

// Game functions
function updateScore() {
    scoreEl.textContent = Math.floor(game.score);
    totalEl.textContent = Math.floor(game.totalScore);
    cpsEl.textContent = game.cps.toFixed(1);
    
    if (game.cps > game.highestCps) {
        game.highestCps = game.cps;
        highestCpsEl.textContent = game.highestCps.toFixed(1);
    }
}

function updateStats() {
    totalClicksEl.textContent = game.clicks;
    const seconds = Math.floor((Date.now() - game.startTime) / 1000);
    timePlayedEl.textContent = `${seconds}s`;
}

function click() {
    // Calculate click value based on upgrades
    let clickValue = 1;
    game.upgrades.forEach(upgrade => {
        if (upgrade.id === 2 || upgrade.id === 3 || upgrade.id === 5) {
            clickValue *= upgrade.owned ? upgrade.effect : 1;
        }
    });
    
    game.score += clickValue;
    game.totalScore += clickValue;
    game.clicks++;
    
    updateScore();
    updateStats();
    createParticles();
    animateScore();
}

function buyUpgrade(upgradeId) {
    const upgrade = game.upgrades.find(u => u.id === upgradeId);
    
    if (game.score >= upgrade.price) {
        game.score -= upgrade.price;
        upgrade.owned++;
        upgrade.price = Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.owned));
        
        // Apply upgrade effects
        if (upgrade.id === 1 || upgrade.id === 4) {
            game.autoClickers.push({
                id: upgrade.id,
                interval: setInterval(() => {
                    game.score += upgrade.effect;
                    game.totalScore += upgrade.effect;
                    updateScore();
                }, upgrade.id === 1 ? 1000 : 200)
            });
        }
        
        updateScore();
        renderUpgrades();
    }
}

function calculateCPS() {
    let cps = 0;
    game.upgrades.forEach(upgrade => {
        if (upgrade.id === 1 && upgrade.owned) {
            cps += upgrade.owned * upgrade.effect;
        }
        if (upgrade.id === 4 && upgrade.owned) {
            cps += upgrade.owned * upgrade.effect * 5;
        }
    });
    game.cps = cps;
    return cps;
}

function renderUpgrades() {
    calculateCPS();
    upgradesEl.innerHTML = '';
    
    game.upgrades.forEach(upgrade => {
        if (game.totalScore >= upgrade.unlockAt) {
            const upgradeEl = document.createElement('div');
            upgradeEl.className = 'upgrade';
            
            const canAfford = game.score >= upgrade.price;
            
            upgradeEl.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name} (${upgrade.owned})</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                </div>
                <button class="upgrade-btn" ${canAfford ? '' : 'disabled'}
                    onclick="buyUpgrade(${upgrade.id})">
                    ${Math.floor(upgrade.price)}
                </button>
            `;
            
            upgradesEl.appendChild(upgradeEl);
        }
    });
}

function createParticles() {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 5 + 2;
        const x = Math.random() * window.innerWidth;
        const color = `hsl(${Math.random() * 60 + 200}, 80%, 60%)`;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = '70%';
        particle.style.backgroundColor = color;
        particle.style.opacity = '0';
        
        particlesEl.appendChild(particle);
        
        // Animate particle
        const animation = particle.animate([
            { 
                transform: 'translateY(0) scale(1)',
                opacity: 1 
            },
            { 
                transform: `translateY(${-Math.random() * 100 - 50}px) translateX(${(Math.random() - 0.5) * 100}px) scale(0)`,
                opacity: 0 
            }
        ], {
            duration: Math.random() * 1000 + 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        animation.onfinish = () => {
            particle.remove();
        };
    }
}

function animateScore() {
    scoreEl.style.transform = 'scale(1.1)';
    setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
    }, 100);
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
    document.querySelector(`.tab:nth-child(${tabName === 'clicker' ? 1 : tabName === 'upgrades' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Game loop
function gameLoop() {
    calculateCPS();
    updateStats();
    renderUpgrades();
    requestAnimationFrame(gameLoop);
}

// Event listeners
clickerEl.addEventListener('click', click);

// Initialize game
updateScore();
updateStats();
renderUpgrades();
gameLoop();

// Handle Telegram events
tg.onEvent('viewportChanged', () => {
    tg.expand();
});
