import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WALL_THICKNESS } from './constants.js';

let dpr = 1;

export function initCanvas(canvas) {
  dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));
  return ctx;
}

function resizeCanvas(canvas) {
  const windowRatio = window.innerWidth / window.innerHeight;
  const gameRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

  if (windowRatio > gameRatio) {
    canvas.style.height = '100vh';
    canvas.style.width = `${window.innerHeight * gameRatio}px`;
  } else {
    canvas.style.width = '100vw';
    canvas.style.height = `${window.innerWidth / gameRatio}px`;
  }
}

export function clearCanvas(ctx) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawWalls(ctx) {
  ctx.fillStyle = COLORS.walls;
  ctx.fillRect(0, 0, WALL_THICKNESS, CANVAS_HEIGHT);
  ctx.fillRect(CANVAS_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.ceilingFloor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, WALL_THICKNESS);
  ctx.fillRect(0, CANVAS_HEIGHT - WALL_THICKNESS, CANVAS_WIDTH, WALL_THICKNESS);
}

export function drawScore(ctx, score) {
  ctx.fillStyle = COLORS.score;
  ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 4 + 2,
        life: 1,
        color
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
