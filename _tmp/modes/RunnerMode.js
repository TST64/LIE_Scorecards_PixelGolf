/**
 * Modes/RunnerMode.js
 */

import { ColorPalette, SpriteRenderer } from '../core/Sprites.js';

export class RunnerMode
{
    constructor()
    {
        this.name = 'runner';
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.audio = null;

        this.player = {
            x: 80,
            y: 280,
            width: 24,
            height: 32,
            velocityY: 0,
            isGrounded: false
        };

        this.obstacles = [];
        this.score = 0;
        this.baseSpeed = 220;
        this.speed = 220;
        this.gravity = 900;
        this.spawnTimer = 0;
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
        this.player.y = 280;
        this.player.velocityY = 0;
        this.player.isGrounded = true;
        this.obstacles = [];
        this.score = 0;
        this.speed = this.baseSpeed;
        this.spawnTimer = 0;
    }

    update(dt)
    {
        // Dynamic Speedup
        this.speed = this.baseSpeed + Math.floor(this.score / 10) * 5;

        // Jump Input
        if (this.input.justPressed.action && this.player.isGrounded)
        {
            this.player.velocityY = -380;
            this.player.isGrounded = false;
            if (this.audio)
            {
                this.audio.playJump();
            }
        }

        // Physik
        this.player.velocityY += this.gravity * dt;
        this.player.y += this.player.velocityY * dt;

        const groundY = 280;
        if (this.player.y >= groundY)
        {
            this.player.y = groundY;
            this.player.velocityY = 0;
            this.player.isGrounded = true;
        }

        // Obstacles
        this.score += dt * 10;
        this.spawnTimer += dt;

        if (this.spawnTimer > 1.8 - Math.min(1.0, this.score / 500))
        {
            if (Math.random() < 0.7)
            {
                this.obstacles.push({
                    x: this.engine.virtualWidth + 20,
                    y: 292,
                    width: 20,
                    height: 20
                });
                this.spawnTimer = 0;
            }
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--)
        {
            const obs = this.obstacles[i];
            obs.x -= this.speed * dt;

            const padding = 3;
            if (
                this.player.x + padding < obs.x + obs.width - padding &&
                this.player.x + this.player.width - padding > obs.x + padding &&
                this.player.y + padding < obs.y + obs.height - padding &&
                this.player.y + this.player.height - padding > obs.y + padding
            )
            {
                if (this.audio)
                {
                    this.audio.playGameOver();
                }
                this.engine.triggerGameOver(Math.floor(this.score), this.name);
                return;
            }

            if (obs.x < -30)
            {
                this.obstacles.splice(i, 1);
            }
        }
    }

    render(ctx)
    {
        ctx.fillStyle = ColorPalette.SKY;
        ctx.fillRect(0, 0, this.engine.virtualWidth, this.engine.virtualHeight);

        ctx.fillStyle = ColorPalette.GRASS_LIGHT;
        ctx.fillRect(0, 312, this.engine.virtualWidth, 138);

        this.renderer.drawGolfer(this.player.x, this.player.y);

        ctx.fillStyle = ColorPalette.RED;
        this.obstacles.forEach((obs) => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        ctx.fillStyle = ColorPalette.WHITE;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`DISTANZ: ${Math.floor(this.score)}m`, 20, 30);
    }
}