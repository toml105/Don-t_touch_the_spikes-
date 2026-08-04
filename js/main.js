import { CANVAS_WIDTH, CANVAS_HEIGHT, WALL_THICKNESS, SPIKE_WIDTH, CEILING_FLOOR_SPIKE_HEIGHT, BIRD_RADIUS, COLORS } from './constants.js';
import { initCanvas, clearCanvas, drawWalls, drawScore, ParticleSystem } from './renderer.js';
import { Bird } from './bird.js';
import { SpikeManager } from './spikes.js';
import { Bot } from './bot.js';

const STATE = { MENU: 0, PLAYING: 1, GAME_OVER: 2 };

const canvas = document.getElementById('gameCanvas');
const ctx = initCanvas(canvas);

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const botToggle = document.getElementById('botToggle');
const botLabel = document.getElementById('botLabel');

const bird = new Bird();
const spikeManager = new SpikeManager();
const bot = new Bot();
const particles = new ParticleSystem();

let state = STATE.MENU;
let score = 0;
let bestScore = parseInt(localStorage.getItem('spikes_best') || '0');
let lastTimestamp = 0;
let hasBouncedOnce = false;

botToggle.addEventListener('change', () => {
  bot.enabled = botToggle.checked;
  botLabel.textContent = botToggle.checked ? 'Bot Mode' : 'Manual Mode';
});

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}

function startGame() {
  bird.reset();
  spikeManager.reset();
  spikeManager.generateWallSpikes('left', 0);
  spikeManager.generateWallSpikes('right', 0);
  bot.reset();
  particles.particles = [];
  score = 0;
  hasBouncedOnce = false;
  state = STATE.PLAYING;
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
}

function gameOver() {
  state = STATE.GAME_OVER;
  bird.alive = false;
  particles.spawn(bird.x, bird.y, COLORS.bird);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('spikes_best', String(bestScore));
  }

  finalScoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;

  setTimeout(() => {
    gameOverScreen.classList.remove('hidden');
  }, 300);

  if (bot.enabled) {
    setTimeout(() => {
      if (state === STATE.GAME_OVER) startGame();
    }, 1500);
  }
}

function handleInput() {
  if (state === STATE.MENU) {
    startGame();
  } else if (state === STATE.PLAYING && !bot.enabled) {
    bird.flap();
  } else if (state === STATE.GAME_OVER && !bot.enabled) {
    startGame();
  }
}

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInput();
});
canvas.addEventListener('mousedown', handleInput);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleInput();
  }
});

function update(dt) {
  if (state !== STATE.PLAYING) return;

  if (bot.update(bird, spikeManager)) {
    bird.flap();
  }

  bird.update(dt);

  const leftEdge = WALL_THICKNESS + SPIKE_WIDTH + bird.radius;
  const rightEdge = CANVAS_WIDTH - WALL_THICKNESS - SPIKE_WIDTH - bird.radius;

  if (bird.x <= leftEdge && bird.vx < 0) {
    bird.x = leftEdge;
    const rects = spikeManager.getWallSpikeRects('left');
    for (const r of rects) {
      if (circleRectCollision(bird.x, bird.y, bird.radius, r.x, r.y, r.w, r.h)) {
        gameOver();
        return;
      }
    }
    bird.bounceOffWall();
    score++;
    hasBouncedOnce = true;
    spikeManager.generateWallSpikes('left', score);
  }

  if (bird.x >= rightEdge && bird.vx > 0) {
    bird.x = rightEdge;
    const rects = spikeManager.getWallSpikeRects('right');
    for (const r of rects) {
      if (circleRectCollision(bird.x, bird.y, bird.radius, r.x, r.y, r.w, r.h)) {
        gameOver();
        return;
      }
    }
    bird.bounceOffWall();
    score++;
    hasBouncedOnce = true;
    spikeManager.generateWallSpikes('right', score);
  }

  const ceilingLimit = WALL_THICKNESS + CEILING_FLOOR_SPIKE_HEIGHT + bird.radius;
  const floorLimit = CANVAS_HEIGHT - WALL_THICKNESS - CEILING_FLOOR_SPIKE_HEIGHT - bird.radius;

  if (bird.y <= ceilingLimit || bird.y >= floorLimit) {
    gameOver();
    return;
  }
}

function render() {
  clearCanvas(ctx);
  drawWalls(ctx);
  spikeManager.draw(ctx);
  drawScore(ctx, score);

  if (state === STATE.PLAYING && bot.enabled && bot.targetY > 0) {
    ctx.strokeStyle = COLORS.botTarget;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(WALL_THICKNESS, bot.targetY);
    ctx.lineTo(CANVAS_WIDTH - WALL_THICKNESS, bot.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  bird.draw(ctx);
  particles.update();
  particles.draw(ctx);
}

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }

  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  const dt = Math.min(elapsed / 16.667, 3);

  update(dt);
  render();
}

bird.reset();
requestAnimationFrame(gameLoop);
