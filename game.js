const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;
const WALL_WIDTH = 18;
const BIRD_RADIUS = 12;
const GRAVITY = 1800;
const JUMP_STRENGTH = -380;
const BIRD_SPEED = 280;
const SPIKE_WIDTH = 22;
const SPIKE_SLOT_HEIGHT = 58;
const NUM_SLOTS = 10;
const SLOT_START_Y = 60;
const FLOOR_Y = GAME_HEIGHT - 30;
const CEILING_Y = 40;

const COLORS = {
    bg: '#1a1a2e',
    wall: '#16213e',
    wallHighlight: '#0f3460',
    spike: '#e94560',
    spikeGlow: 'rgba(233, 69, 96, 0.3)',
    bird: '#f1c40f',
    birdDark: '#e67e22',
    eye: '#2d2d2d',
    scoreText: 'rgba(255, 255, 255, 0.12)',
    particle: '#e94560',
    gap: 'rgba(83, 216, 251, 0.08)',
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = 'idle';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spikeHighScore') || '0');
        this.bird = this.createBird();
        this.spikes = { left: [], right: [] };
        this.particles = [];
        this.lastTime = 0;
        this.onScoreChange = null;
        this.onGameOver = null;
        this.onStateChange = null;
        this.difficulty = 0;
        this.screenShake = 0;
        this.wallFlash = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    createBird() {
        return {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            vx: BIRD_SPEED,
            vy: 0,
            direction: 1,
            rotation: 0,
            trail: [],
        };
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.scaleX = (rect.width * dpr) / GAME_WIDTH;
        this.scaleY = (rect.height * dpr) / GAME_HEIGHT;
        this.scale = Math.min(this.scaleX, this.scaleY);
        this.offsetX = (rect.width * dpr - GAME_WIDTH * this.scale) / 2;
        this.offsetY = (rect.height * dpr - GAME_HEIGHT * this.scale) / 2;
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.difficulty = 0;
        this.bird = this.createBird();
        this.particles = [];
        this.screenShake = 0;
        this.generateSpikes('right');
        if (this.onScoreChange) this.onScoreChange(this.score);
        if (this.onStateChange) this.onStateChange(this.state);
    }

    tap() {
        if (this.state === 'idle') {
            this.start();
            return;
        }
        if (this.state !== 'playing') return;

        this.bird.vy = JUMP_STRENGTH;
        this.bird.direction *= -1;
        this.bird.vx = BIRD_SPEED * this.bird.direction;

        const targetWall = this.bird.direction > 0 ? 'right' : 'left';
        this.generateSpikes(targetWall);
    }

    generateSpikes(wall) {
        const spikeProb = Math.min(0.65, 0.25 + this.difficulty * 0.025);
        const slots = [];

        for (let i = 0; i < NUM_SLOTS; i++) {
            slots.push(Math.random() < spikeProb);
        }

        let hasGap = false;
        for (let i = 0; i < NUM_SLOTS - 1; i++) {
            if (!slots[i] && !slots[i + 1]) {
                hasGap = true;
                break;
            }
        }

        if (!hasGap) {
            const clearStart = Math.floor(Math.random() * (NUM_SLOTS - 2));
            slots[clearStart] = false;
            slots[clearStart + 1] = false;
        }

        const spikes = [];
        for (let i = 0; i < NUM_SLOTS; i++) {
            if (slots[i]) {
                spikes.push({
                    y: SLOT_START_Y + i * SPIKE_SLOT_HEIGHT,
                    height: SPIKE_SLOT_HEIGHT,
                    slot: i,
                });
            }
        }

        this.spikes[wall] = spikes;
    }

    getGaps(wall) {
        const spiked = new Set();
        for (const s of this.spikes[wall]) {
            spiked.add(s.slot);
        }

        const gaps = [];
        let gapStart = null;

        for (let i = 0; i < NUM_SLOTS; i++) {
            if (!spiked.has(i)) {
                if (gapStart === null) gapStart = i;
            } else {
                if (gapStart !== null) {
                    const startY = SLOT_START_Y + gapStart * SPIKE_SLOT_HEIGHT;
                    const endY = SLOT_START_Y + i * SPIKE_SLOT_HEIGHT;
                    gaps.push({
                        startY,
                        endY,
                        centerY: (startY + endY) / 2,
                        size: i - gapStart,
                    });
                    gapStart = null;
                }
            }
        }
        if (gapStart !== null) {
            const startY = SLOT_START_Y + gapStart * SPIKE_SLOT_HEIGHT;
            const endY = SLOT_START_Y + NUM_SLOTS * SPIKE_SLOT_HEIGHT;
            gaps.push({
                startY,
                endY,
                centerY: (startY + endY) / 2,
                size: NUM_SLOTS - gapStart,
            });
        }

        return gaps;
    }

    update(dt) {
        if (this.state !== 'playing') return;

        dt = Math.min(dt, 0.033);

        const b = this.bird;

        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 6) b.trail.shift();

        b.vy += GRAVITY * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.rotation = Math.atan2(b.vy, Math.abs(b.vx)) * 0.5;

        if (b.y - BIRD_RADIUS < CEILING_Y) {
            b.y = CEILING_Y + BIRD_RADIUS;
            b.vy = Math.abs(b.vy) * 0.3;
        }
        if (b.y + BIRD_RADIUS > FLOOR_Y) {
            b.y = FLOOR_Y - BIRD_RADIUS;
            b.vy = -Math.abs(b.vy) * 0.3;
        }

        const leftEdge = WALL_WIDTH + SPIKE_WIDTH;
        const rightEdge = GAME_WIDTH - WALL_WIDTH - SPIKE_WIDTH;

        if (b.direction > 0 && b.x + BIRD_RADIUS >= rightEdge) {
            if (this.checkCollision('right')) {
                this.die();
                return;
            }
            b.x = rightEdge - BIRD_RADIUS;
            this.scorePoint();
        }

        if (b.direction < 0 && b.x - BIRD_RADIUS <= leftEdge) {
            if (this.checkCollision('left')) {
                this.die();
                return;
            }
            b.x = leftEdge + BIRD_RADIUS;
            this.scorePoint();
        }

        if (this.screenShake > 0) {
            this.screenShake -= dt * 10;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 600 * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    checkCollision(wall) {
        const b = this.bird;
        for (const spike of this.spikes[wall]) {
            const spikeTop = spike.y;
            const spikeBottom = spike.y + spike.height;
            const birdTop = b.y - BIRD_RADIUS;
            const birdBottom = b.y + BIRD_RADIUS;

            if (birdBottom > spikeTop + 4 && birdTop < spikeBottom - 4) {
                return true;
            }
        }
        return false;
    }

    scorePoint() {
        this.score++;
        this.difficulty = Math.min(20, this.score);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spikeHighScore', this.highScore.toString());
        }

        this.bird.vy += JUMP_STRENGTH * 0.15;

        this.wallFlash = { wall: this.bird.direction < 0 ? 'right' : 'left', time: 0.15 };

        if (this.onScoreChange) this.onScoreChange(this.score);
    }

    die() {
        this.state = 'gameover';
        this.screenShake = 1;

        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                life: 0.5 + Math.random() * 0.5,
                color: Math.random() > 0.5 ? COLORS.bird : COLORS.spike,
                size: 3 + Math.random() * 4,
            });
        }

        if (this.onGameOver) this.onGameOver(this.score, this.highScore);
        if (this.onStateChange) this.onStateChange(this.state);
    }

    render() {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake * 8;
            const shakeY = (Math.random() - 0.5) * this.screenShake * 8;
            ctx.translate(shakeX, shakeY);
        }

        this.drawBackground(ctx);
        this.drawWalls(ctx);
        this.drawSpikes(ctx);
        this.drawBird(ctx);
        this.drawParticles(ctx);

        ctx.restore();
    }

    drawBackground(ctx) {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let y = SLOT_START_Y; y < FLOOR_Y; y += SPIKE_SLOT_HEIGHT) {
            ctx.beginPath();
            ctx.moveTo(WALL_WIDTH, y);
            ctx.lineTo(GAME_WIDTH - WALL_WIDTH, y);
            ctx.stroke();
        }
    }

    drawWalls(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, WALL_WIDTH, 0);
        gradient.addColorStop(0, COLORS.wallHighlight);
        gradient.addColorStop(1, COLORS.wall);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WALL_WIDTH, GAME_HEIGHT);

        const gradient2 = ctx.createLinearGradient(GAME_WIDTH - WALL_WIDTH, 0, GAME_WIDTH, 0);
        gradient2.addColorStop(0, COLORS.wall);
        gradient2.addColorStop(1, COLORS.wallHighlight);
        ctx.fillStyle = gradient2;
        ctx.fillRect(GAME_WIDTH - WALL_WIDTH, 0, WALL_WIDTH, GAME_HEIGHT);

        if (this.wallFlash) {
            ctx.fillStyle = `rgba(83, 216, 251, ${this.wallFlash.time * 2})`;
            if (this.wallFlash.wall === 'left') {
                ctx.fillRect(0, 0, WALL_WIDTH, GAME_HEIGHT);
            } else {
                ctx.fillRect(GAME_WIDTH - WALL_WIDTH, 0, WALL_WIDTH, GAME_HEIGHT);
            }
            this.wallFlash.time -= 0.016;
            if (this.wallFlash.time <= 0) this.wallFlash = null;
        }

        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(0, 0, GAME_WIDTH, CEILING_Y);
        ctx.fillRect(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);
    }

    drawSpikes(ctx) {
        for (const wall of ['left', 'right']) {
            for (const spike of this.spikes[wall]) {
                ctx.save();

                ctx.shadowColor = COLORS.spikeGlow;
                ctx.shadowBlur = 8;

                ctx.fillStyle = COLORS.spike;
                ctx.beginPath();

                if (wall === 'left') {
                    const baseX = WALL_WIDTH;
                    ctx.moveTo(baseX, spike.y + 2);
                    ctx.lineTo(baseX + SPIKE_WIDTH, spike.y + spike.height / 2);
                    ctx.lineTo(baseX, spike.y + spike.height - 2);
                } else {
                    const baseX = GAME_WIDTH - WALL_WIDTH;
                    ctx.moveTo(baseX, spike.y + 2);
                    ctx.lineTo(baseX - SPIKE_WIDTH, spike.y + spike.height / 2);
                    ctx.lineTo(baseX, spike.y + spike.height - 2);
                }

                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }

    drawBird(ctx) {
        const b = this.bird;

        ctx.globalAlpha = 0.15;
        for (let i = 0; i < b.trail.length; i++) {
            const t = b.trail[i];
            const alpha = (i / b.trail.length) * 0.15;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.bird;
            ctx.beginPath();
            ctx.arc(t.x, t.y, BIRD_RADIUS * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation * b.direction);

        ctx.fillStyle = COLORS.bird;
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.birdDark;
        ctx.beginPath();
        const beakDir = b.direction;
        ctx.moveTo(beakDir * BIRD_RADIUS, -4);
        ctx.lineTo(beakDir * (BIRD_RADIUS + 8), 0);
        ctx.lineTo(beakDir * BIRD_RADIUS, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(beakDir * 4, -3, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.eye;
        ctx.beginPath();
        ctx.arc(beakDir * 5, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(beakDir * 5.5, -4, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    getBirdState() {
        return {
            x: this.bird.x,
            y: this.bird.y,
            vx: this.bird.vx,
            vy: this.bird.vy,
            direction: this.bird.direction,
        };
    }

    getConstants() {
        return {
            GAME_WIDTH,
            GAME_HEIGHT,
            WALL_WIDTH,
            BIRD_RADIUS,
            GRAVITY,
            JUMP_STRENGTH,
            BIRD_SPEED,
            SPIKE_WIDTH,
            FLOOR_Y,
            CEILING_Y,
        };
    }
}
