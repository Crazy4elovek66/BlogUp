// Основные переменные
let subscribers = 0;
let views = 0;
let clickPower = 1;
let subscriberChance = 0.01; // Начальный шанс 1%
const maxSubscribersForNextLevel = 1000;
let currentLevel = 0;

// Уровни прокачки
const levels = [
  { name: "Новичок", threshold: 0, color: "#00BFFF" },
  { name: "Эксперт", threshold: 10, color: "#00FF7F" },
  { name: "Вирусный", threshold: 100, color: "#FFA52E" },
  { name: "Легенда", threshold: 500, color: "#FF4500" },
  { name: "Икона", threshold: 1000, color: "#B200FF" }
];

// Улучшения
const upgrades = [
  { 
    id: 1, 
    name: "Качественный контент", 
    description: "Увеличивает шанс подписчика на 0.5%", 
    cost: 50, 
    effect: function() { subscriberChance += 0.005; updateChanceText(); },
    purchased: false 
  },
  { 
    id: 2, 
    name: "Вирусный пост", 
    description: "Увеличивает просмотры в 2 раза", 
    cost: 200, 
    effect: function() { clickPower *= 2; },
    purchased: false 
  },
  { 
    id: 3, 
    name: "Коллаборация", 
    description: "Шанс подписчика ×3", 
    cost: 500, 
    effect: function() { subscriberChance *= 3; updateChanceText(); },
    purchased: false 
  },
  { 
    id: 4, 
    name: "Премиум контент", 
    description: "Увеличивает базовые просмотры +5", 
    cost: 1000, 
    effect: function() { clickPower += 5; },
    purchased: false 
  }
];

// DOM элементы
const subsCounter = document.getElementById('subscribers');
const viewsCounter = document.getElementById('views');
const clickBtn = document.getElementById('clickBtn');
const progressFill = document.getElementById('progressFill');
const upgradesContainer = document.getElementById('upgradesContainer');
const levelText = document.getElementById('levelText');
const chanceText = document.getElementById('chanceText');

// Инициализация игры
// В разделе скриптов добавьте обработку ошибок:
async function loadStats() {
    try {
        const response = await fetch('/get_stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id })
        });
        
        const data = await response.json();
        if (data.success) {
            views = data.views;
            clickPower = data.click_power;
            updateUI();
        } else {
            console.error('Error loading stats:', data.error);
            tg.showAlert('Ошибка загрузки данных. Попробуйте позже.');
        }
    } catch (error) {
        console.error('Network error:', error);
        tg.showAlert('Проблемы с соединением. Проверьте интернет.');
    }
}
function initGame() {
  // Загрузка сохранения
  const save = localStorage.getItem('blogUpSave');
  if (save) {
    const data = JSON.parse(save);
    subscribers = data.subscribers || 0;
    views = data.views || 0;
    clickPower = data.clickPower || 1;
    subscriberChance = data.subscriberChance || 0.01;
    currentLevel = data.currentLevel || 0;
    
    // Восстановление улучшений
    if (data.upgrades) {
      data.upgrades.forEach(savedUpgrade => {
        const upgrade = upgrades.find(u => u.id === savedUpgrade.id);
        if (upgrade) {
          upgrade.purchased = savedUpgrade.purchased;
        }
      });
    }
  }
  
  updateCounters();
  renderUpgrades();
  updateLevelText();
  updateChanceText();
}

// Обновление счетчиков
function updateCounters() {
  subsCounter.textContent = formatNumber(subscribers);
  viewsCounter.textContent = formatNumber(views);
  
  // Динамическое изменение сложности
  subscriberChance = Math.max(0.001, 0.02 - (subscribers * 0.00002));
  
  // Обновление прогресс-бара
  const progress = Math.min((subscribers / maxSubscribersForNextLevel) * 100, 100);
  progressFill.style.width = `${progress}%`;
  
  // Изменение цвета при увеличении сложности
  if (subscribers > 300) {
    progressFill.classList.add('hard');
  } else {
    progressFill.classList.remove('hard');
  }
  
  // Проверка достижения нового уровня
  checkLevelUp();
  
  updateChanceText();
  saveGame();
}

// Форматирование чисел
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Обработка клика
clickBtn.addEventListener('click', function(e) {
  // Координаты клика для анимации
  const rect = this.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Создание эффекта клика
  createClickEffect(x, y);
  
  // Обновление счетчиков
  views += clickPower;
  
  // Проверка на получение подписчика
  if (Math.random() < subscriberChance) {
    subscribers += 1;
    // Анимация для редкого получения подписчика
    showSubscriberEffect();
  }
  
  updateCounters();
});

// Анимация клика
function createClickEffect(x, y) {
  const effect = document.createElement('div');
  effect.className = 'click-effect';
  effect.style.left = `${x - 10}px`;
  effect.style.top = `${y - 10}px`;
  clickBtn.appendChild(effect);
  
  effect.addEventListener('animationend', () => {
    effect.remove();
  });
}

// Эффект получения подписчика
function showSubscriberEffect() {
  const effect = document.createElement('div');
  effect.className = 'subscriber-effect';
  effect.textContent = '+1 подписчик!';
  document.body.appendChild(effect);
  
  setTimeout(() => {
    effect.remove();
  }, 2000);
}

// Обновление текста шанса
function updateChanceText() {
  chanceText.textContent = `Шанс подписчика: ${(subscriberChance * 100).toFixed(2)}%`;
}

// Обновление текста уровня
function updateLevelText() {
  const levelNames = levels.map(l => l.name);
  levelText.innerHTML = levelNames.join(' | ');
  
  // Подсветка текущего уровня
  const levelElements = levelText.textContent.split(' | ');
  levelText.innerHTML = levelElements.map((name, i) => 
    i <= currentLevel ? `<span style="color: ${levels[i].color}">${name}</span>` : name
  ).join(' | ');
}

// Проверка достижения нового уровня
function checkLevelUp() {
  const newLevel = levels.reduce((maxLevel, level, index) => {
    return subscribers >= level.threshold ? index : maxLevel;
  }, 0);
  
  if (newLevel > currentLevel) {
    currentLevel = newLevel;
    showLevelUpNotification(levels[currentLevel].name);
    updateLevelText();
  }
}

// Уведомление о новом уровне
function showLevelUpNotification(levelName) {
  const notification = document.createElement('div');
  notification.className = 'level-up';
  notification.innerHTML = `
    <h2>Новый уровень!</h2>
    <p>Вы достигли: ${levelName}</p>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Рендер улучшений
function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  
  upgrades.forEach(upgrade => {
    const upgradeEl = document.createElement('div');
    upgradeEl.className = 'upgrade';
    upgradeEl.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-name">${upgrade.name}</div>
        <div class="upgrade-desc">${upgrade.description}</div>
      </div>
      <button ${upgrade.purchased || subscribers < upgrade.cost ? 'disabled' : ''}>
        ${upgrade.purchased ? 'Куплено' : `${formatNumber(upgrade.cost)} подписчиков`}
      </button>
    `;
    
    if (!upgrade.purchased) {
      const btn = upgradeEl.querySelector('button');
      btn.addEventListener('click', () => buyUpgrade(upgrade.id));
    }
    
    upgradesContainer.appendChild(upgradeEl);
  });
}

// Покупка улучшения
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade || upgrade.purchased || subscribers < upgrade.cost) return;
  
  subscribers -= upgrade.cost;
  upgrade.effect();
  upgrade.purchased = true;
  
  updateCounters();
  renderUpgrades();
}

// Сохранение игры
function saveGame() {
  const saveData = {
    subscribers,
    views,
    clickPower,
    subscriberChance,
    currentLevel,
    upgrades: upgrades.map(u => ({ id: u.id, purchased: u.purchased }))
  };
  localStorage.setItem('blogUpSave', JSON.stringify(saveData));
}

// Сброс игры (для тестирования)
function resetGame() {
  if (confirm('Вы уверены, что хотите сбросить прогресс?')) {
    localStorage.removeItem('blogUpSave');
    location.reload();
  }
}

// Запуск игры
initGame();

// Для тестирования можно добавить в консоль:
// resetGame() - сбросить прогресс
