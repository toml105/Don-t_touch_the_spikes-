class Bot {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.lastTapTime = 0;
        this.cooldown = 120;
        this.gamesPlayed = 0;
        this.totalScore = 0;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    update(now) {
        if (!this.enabled) return;

        if (this.game.state === 'idle') {
            this.game.tap();
            this.lastTapTime = now;
            return;
        }

        if (this.game.state === 'gameover') {
            this.gamesPlayed++;
            this.totalScore += this.game.score;
            setTimeout(() => {
                if (this.enabled && this.game.state === 'gameover') {
                    this.game.start();
                    this.lastTapTime = performance.now();
                }
            }, 600);
            return;
        }

        if (this.game.state !== 'playing') return;
        if (now - this.lastTapTime < this.cooldown) return;

        const shouldTap = this.decide();
        if (shouldTap) {
            this.game.tap();
            this.lastTapTime = now;
        }
    }

    decide() {
        const bird = this.game.getBirdState();
        const c = this.game.getConstants();

        const targetWall = bird.direction > 0 ? 'right' : 'left';
        const targetX = bird.direction > 0
            ? c.GAME_WIDTH - c.WALL_WIDTH - c.SPIKE_WIDTH - c.BIRD_RADIUS
            : c.WALL_WIDTH + c.SPIKE_WIDTH + c.BIRD_RADIUS;

        const distToWall = Math.abs(targetX - bird.x);
        const timeToWall = distToWall / c.BIRD_SPEED;

        const projectedY = bird.y + bird.vy * timeToWall + 0.5 * c.GRAVITY * timeToWall * timeToWall;

        const gaps = this.game.getGaps(targetWall);
        if (gaps.length === 0) return false;

        const bestGap = this.findBestGap(gaps, projectedY);
        const margin = c.BIRD_RADIUS + 6;

        const safeTop = bestGap.startY + margin;
        const safeBottom = bestGap.endY - margin;

        if (projectedY >= safeTop && projectedY <= safeBottom) {
            return false;
        }

        const newVy = c.JUMP_STRENGTH;
        const oppositeWall = bird.direction > 0 ? 'left' : 'right';
        const oppositeTargetX = bird.direction > 0
            ? c.WALL_WIDTH + c.SPIKE_WIDTH + c.BIRD_RADIUS
            : c.GAME_WIDTH - c.WALL_WIDTH - c.SPIKE_WIDTH - c.BIRD_RADIUS;

        const newDistToWall = Math.abs(oppositeTargetX - bird.x);
        const newTimeToWall = newDistToWall / c.BIRD_SPEED;

        const newProjectedY = bird.y + newVy * newTimeToWall + 0.5 * c.GRAVITY * newTimeToWall * newTimeToWall;

        const oppositeGaps = this.game.getGaps(oppositeWall);
        if (oppositeGaps.length === 0) return false;

        const newBestGap = this.findBestGap(oppositeGaps, newProjectedY);
        const newSafeTop = newBestGap.startY + margin;
        const newSafeBottom = newBestGap.endY - margin;

        if (newProjectedY >= newSafeTop && newProjectedY <= newSafeBottom) {
            return true;
        }

        if (bird.y > c.FLOOR_Y - c.BIRD_RADIUS - 30 && bird.vy > 0) {
            return true;
        }
        if (bird.y < c.CEILING_Y + c.BIRD_RADIUS + 30 && bird.vy < 0) {
            return false;
        }

        const currentDist = Math.abs(projectedY - bestGap.centerY);
        const newDist = Math.abs(newProjectedY - newBestGap.centerY);
        return newDist < currentDist;
    }

    findBestGap(gaps, targetY) {
        let best = gaps[0];
        let bestDist = Math.abs(gaps[0].centerY - targetY);

        for (let i = 1; i < gaps.length; i++) {
            const dist = Math.abs(gaps[i].centerY - targetY);
            if (dist < bestDist || (dist === bestDist && gaps[i].size > best.size)) {
                best = gaps[i];
                bestDist = dist;
            }
        }

        return best;
    }

    getStats() {
        return {
            gamesPlayed: this.gamesPlayed,
            totalScore: this.totalScore,
            averageScore: this.gamesPlayed > 0
                ? Math.round(this.totalScore / this.gamesPlayed)
                : 0,
        };
    }
}
