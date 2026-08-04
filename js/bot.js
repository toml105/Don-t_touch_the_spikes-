import {
  CANVAS_WIDTH, WALL_THICKNESS, SPIKE_WIDTH, GRAVITY,
  CEILING_FLOOR_SPIKE_HEIGHT, CANVAS_HEIGHT, BIRD_RADIUS,
  BOT_FLAP_THRESHOLD, BOT_FLAP_COOLDOWN
} from './constants.js';

export class Bot {
  constructor() {
    this.enabled = false;
    this.targetY = 0;
    this.framesSinceFlap = 999;
  }

  reset() {
    this.targetY = 0;
    this.framesSinceFlap = 999;
  }

  toggle() {
    this.enabled = !this.enabled;
  }

  update(bird, spikeManager) {
    if (!this.enabled || !bird.alive) return false;

    this.framesSinceFlap++;

    const side = bird.vx > 0 ? 'right' : 'left';
    const wallX = side === 'right'
      ? CANVAS_WIDTH - WALL_THICKNESS - SPIKE_WIDTH - bird.radius
      : WALL_THICKNESS + SPIKE_WIDTH + bird.radius;

    const dist = Math.abs(wallX - bird.x);
    const framesLeft = Math.max(1, dist / Math.abs(bird.vx));

    const predictedY = bird.y + bird.vy * framesLeft + 0.5 * GRAVITY * framesLeft * framesLeft;

    const gaps = spikeManager.getGaps(side);
    if (gaps.length === 0) return false;

    let bestGap = gaps[0];
    let bestScore = -Infinity;
    for (const gap of gaps) {
      const score = gap.size * 20 - Math.abs(gap.centerY - predictedY);
      if (score > bestScore) {
        bestScore = score;
        bestGap = gap;
      }
    }

    this.targetY = bestGap.centerY;

    const ceilingLimit = WALL_THICKNESS + CEILING_FLOOR_SPIKE_HEIGHT + BIRD_RADIUS + 10;
    const floorLimit = CANVAS_HEIGHT - WALL_THICKNESS - CEILING_FLOOR_SPIKE_HEIGHT - BIRD_RADIUS - 10;

    if (bird.y <= ceilingLimit) return false;
    if (bird.y >= floorLimit && this.framesSinceFlap >= BOT_FLAP_COOLDOWN) {
      this.framesSinceFlap = 0;
      return true;
    }

    const diff = bird.y - this.targetY;

    if (diff > BOT_FLAP_THRESHOLD && this.framesSinceFlap >= BOT_FLAP_COOLDOWN) {
      this.framesSinceFlap = 0;
      return true;
    }

    if (bird.vy > 3 && diff > 0 && this.framesSinceFlap >= BOT_FLAP_COOLDOWN) {
      this.framesSinceFlap = 0;
      return true;
    }

    return false;
  }
}
