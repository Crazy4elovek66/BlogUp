// Основные переменные
let subscribers = 0;
let views = 0;
let clickPower = 1;
let upgrades = [
  { id: 1, name: "Лучший контент", cost: 50, power: 2, purchased: false },
  { id: 2, name: "Вирусный пост", cost: 200, power: 5, purchased: false },
  { id: 3, name: "Коллаборация", cost: 1000, power: 10, purchased: false }
];

// DOM элементы
const subsCounter = document.getElementById('subscribers');
const viewsCounter = document.getElementById('views');
const clickBtn = document.getElementById('clickBtn');
const progressFill = document.getElementById('progressFill');
const upgradesContainer = document.querySelector('.upgrades');

// Инициализация игры
function initGame() {
  updateCounters();
  renderUpgrades();
  
  // Загрузка сохранения
  const save = localStorage.getItem('blogUpSave');
  if (save) {
    const data = JSON.parse(save);
    subscribers = data.subscribers || 0;
    views = data.views || 0;
    clickPower = data.clickPower || 1;
    upgrades = data.upgrades || upgrades;
    updateCounters();
    renderUpgrades();
  }
}

// Обновление счетчиков
function updateCounters() {
  subsCounter.textContent = formatNumber(subscribers);
  viewsCounter.textContent = formatNumber(views);
  
  // Обновление прогресс-бара (макс. уровень 1000 подписчиков)
  const progress = Math.min(subscribers / 10, 100);
  progressFill.style.width = `${progress}%`;
  
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
  subscribers += clickPower;
  views += clickPower * 3;
  updateCounters();
});

// Анимация клика
function createClickEffect(x,
