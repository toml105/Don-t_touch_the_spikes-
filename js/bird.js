import {
  CANVAS_WIDTH, CANVAS_HEIGHT, BIRD_RADIUS, BIRD_HORIZONTAL_SPEED,
  GRAVITY, FLAP_STRENGTH, MAX_FALL_SPEED, COLORS
} from './constants.js';

export class Bird {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = BIRD_RADIUS;
    this.alive = true;
    this.rotation = 0;
  }

  reset() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    this.vx = BIRD_HORIZONTAL_SPEED;
    this.vy = 0;
    this.alive = true;
    this.rotation = 0;
  }

  flap() {
    if (!this.alive) return;
    this.vy = FLAP_STRENGTH;
  }

  update(dt) {
    if (!this.alive) return;

    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.rotation = Math.atan2(this.vy, Math.abs(this.vx)) * 0.5;
  }

  bounceOffWall() {
    this.vx = -this.vx;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = COLORS.bird;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8a100';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bird;
    ctx.beginPath();
    ctx.arc(0, -1, this.radius, 0, Math.PI * 2);
    ctx.fill();

    const eyeOffsetX = this.vx > 0 ? 5 : -5;
    ctx.fillStyle = COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(eyeOffsetX, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.birdPupil;
    ctx.beginPath();
    ctx.arc(eyeOffsetX + (this.vx > 0 ? 1.5 : -1.5), -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const beakDir = this.vx > 0 ? 1 : -1;
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.moveTo(beakDir * this.radius, 2);
    ctx.lineTo(beakDir * (this.radius + 8), 4);
    ctx.lineTo(beakDir * this.radius, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
