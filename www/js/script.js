// Функция для скрытия логотипа
function hideLogo() {
    const logo = document.getElementById('logo');
    if (logo) {
        logo.style.display = 'none';
    }
}


import { scenes } from './scenes.js'; // Импортируем сцены

const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
const newGameButton = document.getElementById('new-game');
const continueGameButton = document.getElementById('continue-game');
const loadGameButton = document.getElementById('load-game');
const saveGameButton = document.getElementById('save-game');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game');
const backToMenuButton = document.getElementById('back-to-menu');
const sceneImage = document.getElementById('scene-image');
const fileInput = document.getElementById('file-input'); // Скрытый input для загрузки файлов

let gameState = {
    currentScene: 'start',
    progress: 0,
    playerName: '',
    inventory: [],
    timestamp: new Date().toISOString()
};

// Переменная для отслеживания состояния игры
let isGameActive = false;
let hasGameInProgress = false;

// Функция для прокрутки текста к началу
function scrollToTop() {
    const textContainer = document.getElementById('text-container');
    if (textContainer) {
        textContainer.scrollTop = 0;
    }
}

// Включение/выключение музыки
musicToggle.addEventListener('change', (event) => {
    if (event.target.checked) {
        bgMusic.play().catch(e => console.log('Автовоспроизведение заблокировано'));
    } else {
        bgMusic.pause();
    }
});

// Начало новой игры
newGameButton.addEventListener('click', () => {
    if (hasGameInProgress) {
        if (!confirm('У вас есть игра в процессе. Начать новую игру? Несохранённый прогресс будет потерян.')) {
            return;
        }
    }
    
    gameState = { 
        currentScene: 'start', 
        progress: 0, 
        playerName: '', 
        inventory: [],
        timestamp: new Date().toISOString()
    };
    
    startGame();
});

// Продолжить игру
continueGameButton.addEventListener('click', () => {
    if (hasGameInProgress) {
        showGame();
        renderScene();
    }
});

// Загрузка игры из файла
loadGameButton.addEventListener('click', () => {
    fileInput.click(); // Открываем диалог выбора файла
});

// Обработка выбранного файла
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.name.endsWith('.json') && !file.name.endsWith('.gamesave')) {
        showNotification('Неверный тип файла! Выберите файл сохранения (.json или .gamesave)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const savedData = JSON.parse(e.target.result);
            
            // Проверяем валидность данных
            if (validateSaveData(savedData)) {
                gameState = savedData;
                hasGameInProgress = true;
                updateContinueButton();
                showNotification('Игра успешно загружена!', 'success');
                startGame();
            } else {
                showNotification('Неверный формат файла сохранения!', 'error');
            }
        } catch (error) {
            showNotification('Ошибка при загрузке файла: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('Ошибка при чтении файла!', 'error');
    };
    
    reader.readAsText(file);
    
    // Очищаем input для возможности загрузки того же файла повторно
    event.target.value = '';
});

// Сохранение игры в файл
saveGameButton.addEventListener('click', () => {
    if (!isGameActive) {
        showNotification('Нет активной игры для сохранения!', 'error');
        return;
    }
    
    saveGameToFile();
});

// Функция создания файла сохранения
function saveGameToFile() {
    try {
        // Добавляем метаданные к сохранению
        const saveData = {
            ...gameState,
            timestamp: new Date().toISOString(),
            version: '1.0',
            sceneName: scenes[gameState.currentScene]?.title || gameState.currentScene
        };
        
        const jsonString = JSON.stringify(saveData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Создаем имя файла с датой и временем
        const now = new Date();
        const dateString = now.toLocaleDateString('ru-RU').replace(/\./g, '-');
        const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
        const filename = `елка-сохранение-${dateString}-${timeString}.gamesave`;
        
        // Создаем ссылку для загрузки
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Освобождаем память
        URL.revokeObjectURL(url);
        
        showNotification('Игра сохранена в файл: ' + filename, 'success');
        
    } catch (error) {
        showNotification('Ошибка при сохранении: ' + error.message, 'error');
    }
}

// Валидация данных сохранения
function validateSaveData(data) {
    return data && 
           typeof data === 'object' && 
           data.currentScene && 
           typeof data.progress === 'number' && 
           Array.isArray(data.inventory);
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Удаляем предыдущее уведомление, если есть
    const existingNotification = document.querySelector('.game-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `game-notification ${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем уведомление через 4 секунды
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 4000);
}

// Добавляем стили анимации в head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Функция для запуска игры
function startGame() {
    isGameActive = true;
    hasGameInProgress = true;
    updateContinueButton();
    renderScene();
    showGame();

        // Скрыть логотип при запуске игры
    hideLogo();
    
    // Останавливаем частицы в меню
    if (window.particleSystem) {
        window.particleSystem.stop();
    }
}

// Функция для показа игры и скрытия меню
function showGame() {
    menu.classList.add('hidden');
    gameContainer.style.display = 'flex';
}

// Функция для показа меню и скрытия игры
function showMenu() {
    menu.classList.remove('hidden');
    gameContainer.style.display = 'none';
    
    // Игра больше не активна визуально, но прогресс сохраняется
    isGameActive = false;
    
    // Обновляем состояние кнопки "Продолжить"
    updateContinueButton();
    
    // Активируем атмосферные частицы для меню
    if (window.particleSystem) {
        window.particleSystem.createSnowEffect();
    }
}

// Функция обновления состояния кнопки "Продолжить игру"
function updateContinueButton() {
    if (hasGameInProgress) {
        continueGameButton.style.display = 'block';
        continueGameButton.disabled = false;
    } else {
        continueGameButton.style.display = 'none';
    }
}

// Функция завершения игры
function endGame() {
    // Сбрасываем флаги состояния игры
    isGameActive = false;
    hasGameInProgress = false;
    
    // Показываем финальное сообщение
    showNotification('Спасибо за игру! Игра завершена.', 'success');
    
    // Возвращаемся в меню
    showMenu();
    
    // Сбрасываем состояние игры
    gameState = { 
        currentScene: 'start', 
        progress: 0, 
        playerName: '', 
        inventory: [],
        timestamp: new Date().toISOString()
    };
    
    updateContinueButton();
}

// Отображение текущей сцены
function renderScene() {
    const scene = scenes[gameState.currentScene];

        // Прокрутка к началу текста
    scrollToTop();
    
    // Проверяем, существует ли сцена
    if (!scene) {
        console.error(`Сцена "${gameState.currentScene}" не найдена!`);
        endGame();
        return;
    }
    
    document.getElementById('scene-text').innerText = scene.text;

    // Обновляем картинку сцены
    if (scene.image) {
        sceneImage.style.backgroundImage = `url('${scene.image}')`;
    }

    // Можно добавить разные эффекты частиц в зависимости от сцены
    if (window.particleSystem && scene.particles) {
        switch(scene.particles) {
            case 'snow':
                window.particleSystem.createSnowEffect();
                break;
            case 'ash':
                window.particleSystem.createAshEffect();
                break;
            case 'embers':
                window.particleSystem.createEmbersEffect();
                break;
        }
    }

    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = '';

    // Если choices не определены или пусты, значит это финальная сцена
    if (!scene.choices || scene.choices.length === 0) {
        // Создаем кнопку "Завершить игру"
        const endButton = document.createElement('button');
        endButton.innerText = 'Завершить игру';
        endButton.addEventListener('click', () => {
            endGame();
        });
        choicesContainer.appendChild(endButton);
        return;
    }

    scene.choices.forEach(choice => {
        const button = document.createElement('button');
        button.innerText = choice.text;
        button.addEventListener('click', () => {
                    // Прокручиваем текст к началу
            scrollToTop();
            // Проверяем специальные команды завершения
            if (choice.nextScene === 'END_GAME' || choice.action === 'endGame') {
                endGame();
                return;
            }
            
            gameState.currentScene = choice.nextScene;
            gameState.progress++; // Увеличиваем прогресс
            renderScene();
        });
        choicesContainer.appendChild(button);
    });
}

// Возврат в меню (иконка)
backToMenuButton.addEventListener('click', () => {
    showMenu();
});

// Инициализация игры - показываем только меню
document.addEventListener('DOMContentLoaded', () => {
    showMenu();
    updateContinueButton(); // Обновляем состояние кнопки при загрузке
    
    // Ждем инициализации системы частиц и запускаем снежный эффект для меню
    setTimeout(() => {
        if (window.particleSystem) {
            window.particleSystem.createSnowEffect();
        }
    }, 100);
    
    // Добавляем обработчик для предотвращения случайной потери прогресса
    window.addEventListener('beforeunload', (event) => {
        if (hasGameInProgress && isGameActive) {
            event.preventDefault();
            event.returnValue = 'У вас есть несохраненный прогресс игры. Вы уверены, что хотите покинуть игру?';
        }
    });
});