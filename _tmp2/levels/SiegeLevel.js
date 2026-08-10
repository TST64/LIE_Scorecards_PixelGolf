/**
 * levels/SiegeLevel.js
 * Level 2: Zombie Siege Mode
 */

import { ColorPalette, SpriteRenderer } from '../core/Sprites.js';

export class SiegeLevel
{
    constructor()
    {
        this.name = 'siege';
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.audio = null;

        this.playerX = 60;
        this.playerY = 130;
        this.playerSpeed = 2.5;
        this.gravity = 0.28;

        this.swingPower = 0;
        this.maxSwingPower = 100;
        this.powerCharging = false;
        this.powerDirection = 1;

        this.remainingBalls = 50;
        this.timeRemaining = 60;
        this.timerInterval = null;

        this.shotCooldownTimer = 0;
        this.shotCooldownDuration = 45;

        this.score = 0;
        this.wallGrid = [];
        this.wallBlocks = [];
        this.zombies = [];
        this.activeBalls = [];
        this.wallDebrisList = [];

        this.wallStartX = 420;
        this.cols = 4;
        this.rows = 8;
        this.objSize = 40;
    }

    init(engineInstance, inputController, soundEngine)
    {
        this.engine = engineInstance;
        this.renderer = new SpriteRenderer(engineInstance.ctx, 5);
        this.input = inputController;
        this.audio = soundEngine;

        this.reset();
    }

    reset()
    {
        this.playerX = 60;
        this.swingPower = 0;
        this.powerCharging = false;
        this.remainingBalls = 50;
        this.timeRemaining = 60;
        this.shotCooldownTimer = 0;
        this.score = 0;

        this.activeBalls = [];
        this.wallDebrisList = [];
        this.zombies = [];
        this.wallBlocks = [];

        this.initWallGrid();
        this.initZombies();
        this.startTimer();

        if (this.audio)
        {
            this.audio.startSpookyMusic();
        }
    }

    startTimer()
    {
        if (this.timerInterval)
        {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => 
        {
            if (this.engine && this.engine.state === 'PLAYING' && this.timeRemaining > 0)
            {
                this.timeRemaining--;
                if (this.timeRemaining === 0)
                {
                    this.triggerWallExplosion();
                }
            }
        }, 1000);
    }

    initWallGrid()
    {
        this.wallGrid = [];
        for (let col = 0; col < this.cols; col++)
        {
            this.wallGrid[col] = [];
            for (let row = 0; row < this.rows; row++)
            {
                const blockX = this.wallStartX + (col * this.objSize);
                const blockY = 170 - ((row + 1) * this.objSize);

                const block = {
                    x: blockX,
                    y: blockY,
                    targetY: blockY,
                    width: this.objSize,
                    height: this.objSize,
                    variant: Math.floor(Math.random() * 3) + 1,
                    destroyed: false,
                    flashTimer: 0
                };

                this.wallGrid[col][row] = block;
                this.wallBlocks.push(block);
            }
        }
    }

    initZombies()
    {
        for (let i = 0; i < 5; i++)
        {
            const startX = 590 + Math.random() * 120;
            this.zombies.push({
                x: startX,
                y: 130,
                width: 40,
                height: 40,
                minX: 580,
                maxX: 730,
                speed: 0.8 + Math.random() * 0.6,
                direction: Math.random() > 0.5 ? 1 : -1,
                isDead: false,
                flashTimer: 0
            });
        }
    }

    triggerWallExplosion()
    {
        if (this.audio)
        {
            this.audio.playHit();
        }

        for (let block of this.wallBlocks)
        {
            if (!block.destroyed)
            {
                block.destroyed = true;
                for (let i = 0; i < 4; i++)
                {
                    this.wallDebrisList.push({
                        x: block.x + Math.random() * this.objSize,
                        y: block.y + Math.random() * this.objSize,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -Math.random() * 5 - 2,
                        active: true
                    });
                }
            }
        }
    }

    shootBall()
    {
        if (this.remainingBalls <= 0)
        {
            return;
        }

        if (this.audio)
        {
            this.audio.playShoot();
        }

        this.remainingBalls--;
        const powerFactor = this.swingPower / 100;
        const vx = 3.5 + (powerFactor * 9.5);
        const vy = -2.8 - (powerFactor * 7.5);

        this.activeBalls.push({
            x: this.playerX + this.objSize,
            y: this.playerY + 20,
            vx: vx,
            vy: vy,
            active: true
        });

        this.swingPower = 0;
        this.shotCooldownTimer = this.shotCooldownDuration;
    }

    update(dt)
    {
        if (this.shotCooldownTimer > 0)
        {
            this.shotCooldownTimer--;
        }

        // Charging Input Controls
        if (this.input.actions.action && !this.powerCharging && this.shotCooldownTimer === 0 && this.remainingBalls > 0)
        {
            this.powerCharging = true;
            this.swingPower = 0;
        }
        else if (!this.input.actions.action && this.powerCharging)
        {
            this.powerCharging = false;
            this.shootBall();
        }

        if (this.powerCharging)
        {
            this.swingPower += 1.666 * this.powerDirection;
            if (this.swingPower >= this.maxSwingPower)
            {
                this.swingPower = this.maxSwingPower;
                this.powerDirection = -1;
            }
            else if (this.swingPower <= 0)
            {
                this.swingPower = 0;
                this.powerDirection = 1;
            }
        }

        // Horizontal Movement
        if (this.input.actions.left)
        {
            this.playerX = Math.max(10, this.playerX - this.playerSpeed);
        }
        if (this.input.actions.right)
        {
            this.playerX = Math.min(360, this.playerX + this.playerSpeed);
        }

        // Update Balls
        for (let ball of this.activeBalls)
        {
            if (!ball.active) continue;

            ball.x += ball.vx;
            ball.vy += this.gravity;
            ball.y += ball.vy;

            if (ball.y >= 168)
            {
                ball.y = 168;
                ball.active = false;
            }

            // Wall Collisions
            for (let block of this.wallBlocks)
            {
                if (!block.destroyed && ball.x > block.x && ball.x < block.x + block.width && ball.y > block.y && ball.y < block.y + block.height)
                {
                    block.destroyed = true;
                    ball.active = false;
                    if (this.audio)
                    {
                        this.audio.playHit();
                    }
                    break;
                }
            }

            // Zombie Collisions
            for (let z of this.zombies)
            {
                if (!z.isDead && ball.x > z.x && ball.x < z.x + z.width && ball.y > z.y && ball.y < z.y + z.height)
                {
                    z.isDead = true;
                    ball.active = false;
                    this.score += 100;
                    if (this.audio)
                    {
                        this.audio.playHit();
                    }
                    break;
                }
            }
        }

        // Update Zombies
        for (let z of this.zombies)
        {
            if (z.isDead) continue;

            z.x += z.speed * z.direction;
            if (z.x <= z.minX || z.x + z.width >= z.maxX)
            {
                z.direction *= -1;
            }

            if (this.playerX < z.x + z.width && this.playerX + this.objSize > z.x)
            {
                if (this.audio)
                {
                    this.audio.playGameOver();
                }
                this.engine.triggerGameOver(this.score, this.name);
                return;
            }
        }

        // Update Debris
        for (let d of this.wallDebrisList)
        {
            if (!d.active) continue;
            d.x += d.vx;
            d.vy += this.gravity;
            d.y += d.vy;
            if (d.y >= 170) d.active = false;
        }
    }

    render(ctx)
    {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, 800, 450);

        ctx.fillStyle = ColorPalette[12];
        ctx.fillRect(0, 170, 800, 30);

        // Wall Blocks
        for (let block of this.wallBlocks)
        {
            if (!block.destroyed)
            {
                this.renderer.drawWallBlock(block.x, block.y, block.variant);
            }
        }

        // Debris Particles
        ctx.fillStyle = ColorPalette[9];
        for (let d of this.wallDebrisList)
        {
            if (d.active) ctx.fillRect(d.x, d.y, 3, 3);
        }

        // Zombies
        for (let z of this.zombies)
        {
            if (!z.isDead)
            {
                this.renderer.drawZombie(z.x, z.y, 0);
            }
        }

        // Balls
        ctx.fillStyle = ColorPalette[7];
        for (let b of this.activeBalls)
        {
            if (b.active) ctx.fillRect(b.x, b.y, 4, 4);
        }

        // Player
        let pose = "address";
        if (this.powerCharging) pose = "backswing";
        else if (this.shotCooldownTimer > (this.shotCooldownDuration - 15)) pose = "follow";

        this.renderer.drawGolfer(this.playerX, this.playerY, pose);

        // Powerbar UI
        if (this.powerCharging)
        {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(this.playerX - 5, this.playerY - 12, 50, 6);
            ctx.fillStyle = ColorPalette[16];
            ctx.fillRect(this.playerX - 5, this.playerY - 12, (this.swingPower / this.maxSwingPower) * 50, 6);
        }

        // HUD Header
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Bälle: ${this.remainingBalls}`, 20, 25);
        ctx.fillText(`Zeit: ${this.timeRemaining}s`, 140, 25);
        ctx.fillText(`Score: ${this.score}`, 700, 25);
    }
}