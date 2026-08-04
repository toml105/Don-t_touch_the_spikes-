(() => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    const bot = new Bot(game);

    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreEl = document.getElementById('final-score');
    const finalHighScoreEl = document.getElementById('final-high-score');
    const botBtn = document.getElementById('bot-btn');
    const botStatus = document.getElementById('bot-status');
    const playBtn = document.getElementById('play-btn');
    const retryBtn = document.getElementById('retry-btn');
    const speedControl = document.getElementById('speed-control');
    const botSpeedSlider = document.getElementById('bot-speed');
    const speedLabel = document.getElementById('speed-label');

    highScoreEl.textContent = game.highScore;

    game.onScoreChange = (score) => {
        scoreEl.textContent = score;
    };

    game.onGameOver = (score, highScore) => {
        finalScoreEl.textContent = score;
        finalHighScoreEl.textContent = highScore;
        highScoreEl.textContent = highScore;

        if (!bot.enabled) {
            gameOverScreen.style.display = 'flex';
        }
    };

    game.onStateChange = (state) => {
        if (state === 'playing') {
            startScreen.style.display = 'none';
            gameOverScreen.style.display = 'none';
        }
    };

    canvas.addEventListener('pointerdown', (e) => {
        if (bot.enabled) return;
        e.preventDefault();

        if (game.state === 'gameover') {
            gameOverScreen.style.display = 'none';
            game.state = 'idle';
            startScreen.style.display = 'flex';
            return;
        }

        game.tap();
    });

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bot.enabled) {
            game.tap();
        } else {
            game.tap();
        }
    });

    retryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        gameOverScreen.style.display = 'none';
        game.state = 'idle';
        startScreen.style.display = 'flex';
    });

    botBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOn = bot.toggle();
        botBtn.textContent = `Bot: ${isOn ? 'ON' : 'OFF'}`;
        botBtn.classList.toggle('active', isOn);
        botStatus.style.display = isOn ? 'flex' : 'none';
        speedControl.style.display = isOn ? 'flex' : 'none';
    });

    const speedNames = ['', 'Slow', 'Relaxed', 'Normal', 'Fast', 'Turbo'];
    botSpeedSlider.addEventListener('input', () => {
        const val = parseInt(botSpeedSlider.value);
        speedLabel.textContent = speedNames[val];
    });

    function gameLoop(timestamp) {
        if (game.lastTime === 0) game.lastTime = timestamp;
        const dt = (timestamp - game.lastTime) / 1000;
        game.lastTime = timestamp;

        bot.update(timestamp);
        game.update(dt);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        });
    }

    let deferredPrompt;
    const installPrompt = document.getElementById('install-prompt');
    const installBtn = document.getElementById('install-btn');
    const dismissInstall = document.getElementById('dismiss-install');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installPrompt.style.display = 'flex';
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installPrompt.style.display = 'none';
        });
    }

    if (dismissInstall) {
        dismissInstall.addEventListener('click', () => {
            installPrompt.style.display = 'none';
        });
    }
})();
