/**
 * Modes/SiegeMode.js
 */

import { ColorPalette, SpriteRenderer } from '../core/Sprites.js';

export class SiegeMode
{
    constructor()
    {
        this.name = 'siege';
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.audio = null;

        this.player = {
            x: 50,
            y: 280,
            width: 24,
            height: 32,
            aimAngle: -Math.PI / 4,
            power: 0,
            maxPower: 550,
            isCharging: false
        };

        this.balls = [];
        this.zombies = [];
        this.score = 0;
        this.lives = 3;
        this.spawnTimer = 0;
        this.spawnInterval = 2.5;
    }

    init(engineInstance, inputController, soundEngine)
    {
        this.engine = engineInstance;
        this.renderer = new SpriteRenderer(engineInstance.ctx);
        this.input = inputController;
        this.audio = soundEngine;
        this.reset();
    }

    reset()
    {
        this.player.power = 0;
        this.player.isCharging = false;
        this.balls = [];
        this.zombies = [];
        this.score = 0;
        this.lives = 3;
        this.spawnTimer = 0;
        this.spawnInterval = 2.5;
    }

    update(dt)
    {
        // Charging Mechanics
        if (this.input.actions.action)
        {
            this.player.isCharging = true;
            this.player.power = Math.min(this.player.power + 450 * dt, this.player.maxPower);
        }
        else if (this.player.isCharging)
        {
            this.shootBall();
            this.player.isCharging = false;
            this.player.power = 0;
        }

        // Balls Physics
        const gravity = 550;
        for (let i = this.balls.length - 1; i >= 0; i--)
        {
            const b = this.balls[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.vy += gravity * dt;

            if (b.x > this.engine.virtualWidth + 20 || b.y > 312 || b.x < 0)
            {
                this.balls.splice(i, 1);
            }
        }

        // Zombies Spawns
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval)
        {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.8, this.spawnInterval * 0.96);
            this.zombies.push({
                x: this.engine.virtualWidth + 10,
                y: 280,
                width: 20,
                height: 32,
                speed: 35 + Math.random() * 25
            });
        }

        // Zombies Movement & Breach Check
        for (let zIdx = this.zombies.length - 1; zIdx >= 0; zIdx--)
        {
            const z = this.zombies[zIdx];
            z.x -= z.speed * dt;

            if (z.x <= this.player.x + 15)
            {
                this.zombies.splice(zIdx, 1);
                this.lives -= 1;
                if (this.audio)
                {
                    this.audio.playHit();
                }

                if (this.lives <= 0)
                {
                    if (this.audio)
                    {
                        this.audio.playGameOver();
                    }
                    this.engine.triggerGameOver(this.score, this.name);
                    return;
                }
            }
        }

        // Ball vs Zombie Collisions
        for (let bIdx = this.balls.length - 1; bIdx >= 0; bIdx--)
        {
            const b = this.balls[bIdx];
            for (let zIdx = this.zombies.length - 1; zIdx >= 0; zIdx--)
            {
                const z = this.zombies[zIdx];

                if (
                    b.x >= z.x &&
                    b.x <= z.x + z.width &&
                    b.y >= z.y &&
                    b.y <= z.y + z.height
                )
                {
                    this.zombies.splice(zIdx, 1);
                    this.balls.splice(bIdx, 1);
                    this.score += 100;
                    if (this.audio)
                    {
                        this.audio.playHit();
                    }
                    break;
                }
            }
        }
    }

    shootBall()
    {
        if (this.audio)
        {
            this.audio.playShoot();
        }
        const vx = Math.cos(this.player.aimAngle) * this.player.power;
        const vy = Math.sin(this.player.aimAngle) * this.player.power;

        this.balls.push({
            x: this.player.x + 16,
            y: this.player.y + 10,
            vx: vx,
            vy: vy
        });
    }

    render(ctx)
    {
        ctx.fillStyle = ColorPalette.SKY;
        ctx.fillRect(0, 0, this.engine.virtualWidth, this.engine.virtualHeight);

        ctx.fillStyle = ColorPalette.GRASS_DARK;
        ctx.fillRect(0, 312, this.engine.virtualWidth, 138);

        this.renderer.drawGolfer(this.player.x, this.player.y);

        ctx.fillStyle = ColorPalette.ZOMBIE_SKIN;
        this.zombies.forEach((z) => {
            ctx.fillRect(z.x, z.y, z.width, z.height);
        });

        this.balls.forEach((b) => {
            this.renderer.drawBall(b.x, b.y, 4);
        });

        if (this.player.isCharging)
        {
            const w = 40;
            const h = 6;
            const fill = (this.player.power / this.player.maxPower) * w;

            ctx.fillStyle = ColorPalette.BLACK;
            ctx.fillRect(this.player.x - 5, this.player.y - 12, w, h);
            ctx.fillStyle = ColorPalette.GOLD;
            ctx.fillRect(this.player.x - 5, this.player.y - 12, fill, h);
        }

        ctx.fillStyle = ColorPalette.WHITE;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`PUNKTE: ${this.score}`, 20, 30);
        ctx.fillText(`LEBEN:  ${'❤️'.repeat(Math.max(0, this.lives))}`, 20, 52);
    }
}