import {
  CANVAS_WIDTH, CANVAS_HEIGHT, WALL_THICKNESS, SPIKE_WIDTH,
  SPIKE_HEIGHT, SPIKE_GAP, CEILING_FLOOR_SPIKE_HEIGHT,
  MIN_GAP_SIZE, INITIAL_SPIKE_COUNT, MAX_SPIKE_COUNT,
  DIFFICULTY_RAMP_SCORE, COLORS
} from './constants.js';

export class SpikeManager {
  constructor() {
    const usableHeight = CANVAS_HEIGHT - CEILING_FLOOR_SPIKE_HEIGHT * 2 - WALL_THICKNESS * 2;
    this.slotCount = Math.floor(usableHeight / SPIKE_GAP);
    this.topOffset = WALL_THICKNESS + CEILING_FLOOR_SPIKE_HEIGHT;
    this.leftSpikes = [];
    this.rightSpikes = [];
  }

  reset() {
    this.leftSpikes = new Array(this.slotCount).fill(false);
    this.rightSpikes = new Array(this.slotCount).fill(false);
  }

  generateWallSpikes(side, score) {
    const t = Math.min(score / DIFFICULTY_RAMP_SCORE, 1);
    const spikeCount = Math.round(INITIAL_SPIKE_COUNT + (MAX_SPIKE_COUNT - INITIAL_SPIKE_COUNT) * t);
    const spikes = new Array(this.slotCount).fill(false);

    const indices = [];
    for (let i = 0; i < this.slotCount; i++) indices.push(i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const count = Math.min(spikeCount, this.slotCount - MIN_GAP_SIZE);
    for (let i = 0; i < count; i++) {
      spikes[indices[i]] = true;
    }

    this._ensurePassable(spikes);

    if (side === 'left') {
      this.leftSpikes = spikes;
    } else {
      this.rightSpikes = spikes;
    }
  }

  _ensurePassable(spikes) {
    let maxGap = 0;
    let current = 0;
    for (let i = 0; i < spikes.length; i++) {
      if (!spikes[i]) {
        current++;
        maxGap = Math.max(maxGap, current);
      } else {
        current = 0;
      }
    }

    while (maxGap < MIN_GAP_SIZE) {
      for (let i = 0; i < spikes.length; i++) {
        if (spikes[i]) {
          spikes[i] = false;
          break;
        }
      }
      maxGap = 0;
      current = 0;
      for (let i = 0; i < spikes.length; i++) {
        if (!spikes[i]) {
          current++;
          maxGap = Math.max(maxGap, current);
        } else {
          current = 0;
        }
      }
    }
  }

  getWallSpikeRects(side) {
    const spikes = side === 'left' ? this.leftSpikes : this.rightSpikes;
    const rects = [];
    for (let i = 0; i < spikes.length; i++) {
      if (!spikes[i]) continue;
      const y = this.topOffset + i * SPIKE_GAP;
      if (side === 'left') {
        rects.push({ x: WALL_THICKNESS, y, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
      } else {
        rects.push({ x: CANVAS_WIDTH - WALL_THICKNESS - SPIKE_WIDTH, y, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
      }
    }
    return rects;
  }

  getGaps(side) {
    const spikes = side === 'left' ? this.leftSpikes : this.rightSpikes;
    const gaps = [];
    let start = -1;

    for (let i = 0; i <= spikes.length; i++) {
      if (i < spikes.length && !spikes[i]) {
        if (start === -1) start = i;
      } else {
        if (start !== -1) {
          const startY = this.topOffset + start * SPIKE_GAP;
          const endY = this.topOffset + i * SPIKE_GAP;
          const centerY = (startY + endY) / 2;
          gaps.push({ startY, endY, centerY, size: i - start });
          start = -1;
        }
      }
    }
    return gaps;
  }

  draw(ctx) {
    ctx.fillStyle = COLORS.spikes;
    this._drawWallSpikes(ctx, 'left');
    this._drawWallSpikes(ctx, 'right');
    this._drawCeilingFloorSpikes(ctx);
  }

  _drawWallSpikes(ctx, side) {
    const spikes = side === 'left' ? this.leftSpikes : this.rightSpikes;
    for (let i = 0; i < spikes.length; i++) {
      if (!spikes[i]) continue;
      const y = this.topOffset + i * SPIKE_GAP;
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(WALL_THICKNESS, y);
        ctx.lineTo(WALL_THICKNESS + SPIKE_WIDTH, y + SPIKE_HEIGHT / 2);
        ctx.lineTo(WALL_THICKNESS, y + SPIKE_HEIGHT);
      } else {
        const baseX = CANVAS_WIDTH - WALL_THICKNESS;
        ctx.moveTo(baseX, y);
        ctx.lineTo(baseX - SPIKE_WIDTH, y + SPIKE_HEIGHT / 2);
        ctx.lineTo(baseX, y + SPIKE_HEIGHT);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawCeilingFloorSpikes(ctx) {
    const spikeW = 20;
    const count = Math.floor((CANVAS_WIDTH - WALL_THICKNESS * 2) / spikeW);
    const startX = WALL_THICKNESS;

    ctx.fillStyle = COLORS.spikes;
    for (let i = 0; i < count; i++) {
      const x = startX + i * spikeW;
      ctx.beginPath();
      ctx.moveTo(x, WALL_THICKNESS);
      ctx.lineTo(x + spikeW / 2, WALL_THICKNESS + CEILING_FLOOR_SPIKE_HEIGHT);
      ctx.lineTo(x + spikeW, WALL_THICKNESS);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, CANVAS_HEIGHT - WALL_THICKNESS);
      ctx.lineTo(x + spikeW / 2, CANVAS_HEIGHT - WALL_THICKNESS - CEILING_FLOOR_SPIKE_HEIGHT);
      ctx.lineTo(x + spikeW, CANVAS_HEIGHT - WALL_THICKNESS);
      ctx.closePath();
      ctx.fill();
    }
  }
}
