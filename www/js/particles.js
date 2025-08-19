// particles.js - Система частиц для создания атмосферных эффектов (снег, пепел, искры)
// Использует HTML5 Canvas для оптимальной производительности

class Particle {
    constructor(x, y, type = 'snow') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.opacity = Math.random();
        this.angle = 0;
        
        // Настройки в зависимости от типа частицы
        switch(type) {
            case 'snow':
                this.size = Math.random() * 4 + 1;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 + 1;
                this.color = '#ffffff';
                this.life = 1;
                this.decay = 0;
                break;
                
            case 'ash':
                this.size = Math.random() * 3 + 0.5;
                this.speedX = Math.random() * 1.5 - 0.75;
                this.speedY = Math.random() * 1.5 + 0.5;
                this.color = `hsl(${20 + Math.random() * 40}, 50%, ${30 + Math.random() * 40}%)`;
                this.life = Math.random() * 0.8 + 0.2;
                this.decay = Math.random() * 0.005 + 0.002;
                break;
                
            case 'embers':
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = -(Math.random() * 3 + 1);
                this.color = `hsl(${Math.random() * 60}, 100%, ${50 + Math.random() * 30}%)`;
                this.life = Math.random() * 0.9 + 0.1;
                this.decay = Math.random() * 0.008 + 0.005;
                this.glow = true;
                break;
        }
        
        this.initialLife = this.life;
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        // Обновляем позицию
        this.x += this.speedX * deltaTime * 60;
        this.y += this.speedY * deltaTime * 60;
        
        // Для снега добавляем колебание
        if (this.type === 'snow') {
            this.angle += 0.02;
            this.x += Math.cos(this.angle) * 0.5;
        }
        
        // Обновляем жизнь частицы
        this.life -= this.decay;
        this.opacity = this.life;
        
        // Проверяем границы экрана
        if (this.y > canvasHeight + 10) {
            this.reset(canvasWidth, canvasHeight);
        }
        
        if (this.x < -10 || this.x > canvasWidth + 10) {
            if (this.type === 'snow') {
                this.x = this.x < -10 ? canvasWidth + 10 : -10;
            } else {
                this.reset(canvasWidth, canvasHeight);
            }
        }
        
        // Если жизнь закончилась, сбрасываем частицу
        if (this.life <= 0) {
            this.reset(canvasWidth, canvasHeight);
        }
    }
    
    reset(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = -10;
        this.life = this.initialLife;
        this.opacity = Math.random();
        
        if (this.type === 'embers') {
            this.x = Math.random() * canvasWidth;
            this.y = canvasHeight + 10;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Устанавливаем прозрачность
        ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
        
        // Для частиц с эффектом свечения
        if (this.glow) {
            ctx.shadowBlur = this.size * 2;
            ctx.shadowColor = this.color;
        }
        
        // Рисуем частицу
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        this.currentEffect = 'none';
        
        // Настройки по умолчанию
        this.settings = {
            snow: { count: 100, color: '#ffffff' },
            ash: { count: 80, color: 'gray' },
            embers: { count: 60, color: 'orange' }
        };
    }

    init() {
        // Создаем canvas для частиц
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particles-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '10';
        
        // Добавляем canvas в body
        document.body.appendChild(this.canvas);
        
        // Получаем контекст
        this.ctx = this.canvas.getContext('2d');
        
        // Устанавливаем размеры canvas
        this.resizeCanvas();
        
        // Слушаем изменение размера окна
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('Система частиц инициализирована');
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createSnowEffect() {
        this.stop();
        this.currentEffect = 'snow';
        this.particles = [];
        
        // Создаем снежинки
        for (let i = 0; i < this.settings.snow.count; i++) {
            this.particles.push(new Particle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                'snow'
            ));
        }
        
        this.start();
        console.log('Эффект снега активирован');
    }

    createAshEffect() {
        this.stop();
        this.currentEffect = 'ash';
        this.particles = [];
        
        // Создаем пепел
        for (let i = 0; i < this.settings.ash.count; i++) {
            this.particles.push(new Particle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                'ash'
            ));
        }
        
        this.start();
        console.log('Эффект пепла активирован');
    }
    
    createEmbersEffect() {
        this.stop();
        this.currentEffect = 'embers';
        this.particles = [];
        
        // Создаем искры/угли
        for (let i = 0; i < this.settings.embers.count; i++) {
            this.particles.push(new Particle(
                Math.random() * this.canvas.width,
                this.canvas.height + Math.random() * 100,
                'embers'
            ));
        }
        
        this.start();
        console.log('Эффект искр активирован');
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    stop() {
        this.isRunning = false;
        this.currentEffect = 'none';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Очищаем canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('Система частиц остановлена');
    }
    
    animate(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    update(deltaTime) {
        // Обновляем все частицы
        for (let particle of this.particles) {
            particle.update(deltaTime, this.canvas.width, this.canvas.height);
        }
    }

    render() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем все частицы
        for (let particle of this.particles) {
            particle.draw(this.ctx);
        }
    }
    
    // Методы для управления настройками
    setParticleCount(type, count) {
        if (this.settings[type]) {
            this.settings[type].count = count;
        }
    }
    
    // Удаление canvas при необходимости
    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        window.removeEventListener('resize', () => this.resizeCanvas());
        console.log('Система частиц удалена');
    }
}

// Создаем глобальный экземпляр системы частиц
window.ParticleSystem = ParticleSystem;

// Автоинициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Создаем и инициализируем систему частиц
    window.particleSystem = new ParticleSystem();
    window.particleSystem.init();
    
 

    // Для демонстрации - можно активировать эффект снега на главном меню
    // window.particleSystem.createSnowEffect();
    
    console.log('Система частиц готова к использованию');
});