/**
 * levels/RunnerLevel.js
 * Level 1: Pixel Golf Runner Mode
 */

import { ColorPalette, SpriteRenderer } from '../core/Sprites.js';

export class RunnerLevel
{
    constructor()
    {
        this.name = 'runner';
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.audio = null;

        // Player physics & parameters
        this.player = {
            x: 50,
            y: 130,
            width: 40,
            height: 40,
            velocityY: 0,
            isGrounded: true
        };

        // Balancing defaults
        this.initialJumpPower = -4.0;
        this.holdBoostPower = -0.45;
        this.gravity = 0.30;
        this.initialBaseSpeed = 3.9;
        this.baseSpeed = 3.9;
        this.speedIncrement = 0.08;

        // Player stats
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrain = 1.8;
        this.staminaRegen = 0.9;

        this.health = 100;
        this.maxHealth = 100;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 60;

        // Level objects & state
        this.score = 0;
        this.baseMinGap = 480;
        this.activeObstacles = [];
        this.activePickups = [];
        this.clouds = [];
        this.grassTufts = [];
        this.stars = [];

        this.levelCompleted = false;
        this.clubhouseX = 850;
    }

    init(engineInstance, inputController, soundEngine)
    {
        this.engine = engineInstance;
        this.renderer = new SpriteRenderer(engineInstance.ctx, 5);
        this.input = inputController;
        this.audio = soundEngine;

        this.initEnvironment();
        this.reset();
    }

    initEnvironment()
    {
        this.stars = [];
        for (let i = 0; i < 20; i++)
        {
            this.stars.push({
                x: Math.random() * 800,
                y: Math.random() * 100,
                size: Math.random() > 0.5 ? 2 : 1
            });
        }

        this.clouds = [
            { x: 100, y: 20, speed: 0.5 },
            { x: 350, y: 50, speed: 0.8 },
            { x: 650, y: 30, speed: 0.4 }
        ];

        this.grassTufts = [
            { x: 120, y: 175, w: 6 },
            { x: 300, y: 182, w: 10 },
            { x: 520, y: 178, w: 8 },
            { x: 740, y: 185, w: 5 }
        ];
    }

    reset()
    {
        this.player.y = 130;
        this.player.velocityY = 0;
        this.player.isGrounded = true;

        this.baseSpeed = this.initialBaseSpeed;
        this.score = 0;
        this.stamina = this.maxStamina;
        this.health = this.maxHealth;
        this.invulnerabilityTimer = 0;

        this.levelCompleted = false;
        this.clubhouseX = 850;

        this.activeObstacles = [];
        this.activePickups = [];
        this.spawnObstacle(800);

        if (this.audio)
        {
            this.audio.startSpookyMusic();
        }
    }

    spawnPickup(startX)
    {
        if (Math.random() < 0.6)
        {
            const types = ["stamina", "stamina", "health", "ball"];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const spawnY = 70 + Math.random() * 50;
            
            this.activePickups.push({
                x: startX + 80,
                y: spawnY,
                type: randomType,
                width: 25,
                height: 25,
                collected: false
            });
        }
    }

    spawnObstacle(startX)
    {
        const obstacleTypes = ["flag", "cart", "tree", "golfer", "bird", "bunker", "water"];
        const selected = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

        let newObstacle = {
            x: startX,
            y: 130,
            width: 40,
            height: 40,
            type: selected,
            flying: (selected === "bird"),
            damage: (selected === "cart" ? 50 : selected === "bunker" || selected === "water" ? 35 : 25)
        };

        if (selected === "bird")
        {
            newObstacle.y = 85;
        }

        this.activeObstacles.push(newObstacle);
        this.spawnPickup(startX);
    }

    update(dt)
    {
        if (this.levelCompleted)
        {
            return;
        }

        // Jump & Sail Input
        if (this.input.justPressed.action && this.player.isGrounded && this.stamina > 10)
        {
            this.player.velocityY = this.initialJumpPower;
            this.player.isGrounded = false;
            if (this.audio)
            {
                this.audio.playJump();
            }
        }

        if (!this.player.isGrounded && this.input.actions.action && this.stamina > 0)
        {
            this.player.velocityY += this.holdBoostPower;
            this.stamina = Math.max(0, this.stamina - this.staminaDrain);
        }

        // Apply Gravity
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;

        if (this.player.y >= 130)
        {
            this.player.y = 130;
            this.player.velocityY = 0;
            this.player.isGrounded = true;

            if (this.stamina < this.maxStamina)
            {
                this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
            }
        }

        if (this.invulnerabilityTimer > 0)
        {
            this.invulnerabilityTimer--;
        }

        // Level Completion Check
        if (this.score >= 30)
        {
            this.clubhouseX -= this.baseSpeed;
            if (this.clubhouseX <= 550)
            {
                this.clubhouseX = 550;
                this.levelCompleted = true;
                this.player.y = 130;
                this.player.velocityY = 0;
                this.player.isGrounded = true;

                if (this.audio)
                {
                    this.audio.stopMusic();
                }

                this.engine.triggerGameOver(this.score, this.name);
            }
        }
        else
        {
            const lastObstacle = this.activeObstacles[this.activeObstacles.length - 1];
            const currentMinGap = Math.max(280, this.baseMinGap - (this.score * 6));
            const minGap = currentMinGap + Math.random() * 110;

            if (!lastObstacle || (800 - lastObstacle.x) >= minGap)
            {
                this.spawnObstacle(850);
            }
        }

        // Update Obstacles
        for (let i = this.activeObstacles.length - 1; i >= 0; i--)
        {
            const obs = this.activeObstacles[i];
            obs.x -= this.baseSpeed;

            if (obs.flying)
            {
                obs.y = 85 + Math.sin(obs.x * 0.015) * 35;
            }

            if (obs.x + obs.width < 0)
            {
                this.activeObstacles.splice(i, 1);
                if (this.score < 30)
                {
                    this.score++;
                    this.baseSpeed += this.speedIncrement;
                }
                continue;
            }

            // Collision Check
            const hitMargin = 10;
            if (
                this.invulnerabilityTimer === 0 &&
                this.player.x < obs.x + obs.width - hitMargin &&
                this.player.x + this.player.width - hitMargin > obs.x &&
                this.player.y < obs.y + obs.height - hitMargin &&
                this.player.y + this.player.height - hitMargin > obs.y
            )
            {
                this.health -= obs.damage;
                if (this.health <= 0)
                {
                    this.health = 0;
                    if (this.audio)
                    {
                        this.audio.playGameOver();
                    }
                    this.engine.triggerGameOver(this.score, this.name);
                    return;
                }
                else
                {
                    if (this.audio)
                    {
                        this.audio.playHit();
                    }
                    this.invulnerabilityTimer = this.invulnerabilityDuration;
                }
            }
        }

        // Update Pickups
        for (let i = this.activePickups.length - 1; i >= 0; i--)
        {
            const p = this.activePickups[i];
            p.x -= this.baseSpeed;

            if (
                !p.collected &&
                this.player.x < p.x + p.width &&
                this.player.x + this.player.width > p.x &&
                this.player.y < p.y + p.height &&
                this.player.y + this.player.height > p.y
            )
            {
                p.collected = true;
                if (this.audio)
                {
                    this.audio.playJump();
                }

                if (p.type === "ball" && this.score < 30) this.score += 2;
                if (p.type === "stamina") this.stamina = Math.min(this.maxStamina, this.stamina + 40);
                if (p.type === "health") this.health = Math.min(this.maxHealth, this.health + 25);
            }

            if (p.x + p.width < 0 || p.collected)
            {
                this.activePickups.splice(i, 1);
            }
        }

        // Update Environment Scenery
        for (let cloud of this.clouds)
        {
            cloud.x -= cloud.speed * (this.baseSpeed / 6);
            if (cloud.x + 40 < 0)
            {
                cloud.x = 800 + Math.random() * 100;
                cloud.y = 10 + Math.random() * 60;
            }
        }

        for (let tuft of this.grassTufts)
        {
            tuft.x -= this.baseSpeed;
            if (tuft.x < 0)
            {
                tuft.x = 800 + Math.random() * 50;
            }
        }
    }

    render(ctx)
    {
        // Background Color Cycle
        let bgColor = "#87CEEB";
        let grassColor = "#2E8B57";

        if (this.score >= 15)
        {
            bgColor = "#0B132B";
            grassColor = "#1C4E35";
        }
        else if (this.score >= 6)
        {
            bgColor = "#4B2E83";
            grassColor = "#246B43";
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 800, 450);

        // Night Stars
        if (this.score >= 15)
        {
            ctx.fillStyle = ColorPalette[11];
            for (let star of this.stars)
            {
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }

        // Grass Ground
        ctx.fillStyle = grassColor;
        ctx.fillRect(0, 170, 800, 30);

        // Clubhouse Rendering at level end
        if (this.score >= 30)
        {
            this.renderer.drawClubhouse(this.clubhouseX, 110);
        }

        // Pickups
        for (let p of this.activePickups)
        {
            if (!p.collected)
            {
                ctx.fillStyle = p.type === "health" ? ColorPalette[13] : p.type === "stamina" ? ColorPalette[12] : ColorPalette[7];
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }
        }

        // Obstacles
        for (let obs of this.activeObstacles)
        {
            ctx.fillStyle = obs.type === "bunker" ? ColorPalette[9] : obs.type === "water" ? ColorPalette[10] : ColorPalette[3];
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }

        // Player Rendering
        if (this.invulnerabilityTimer === 0 || Math.floor(this.invulnerabilityTimer / 6) % 2 === 0)
        {
            this.renderer.drawGolfer(this.player.x, this.player.y);
        }

        // HUD Overlay
        ctx.fillStyle = (this.score >= 15) ? "#ffffff" : "#000000";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Score: " + this.score, 20, 30);

        // Health Bar
        ctx.fillText("Health:", 420, 27);
        ctx.fillStyle = "#555555";
        ctx.fillRect(480, 15, 100, 14);
        ctx.fillStyle = "#ff7675";
        ctx.fillRect(480, 15, Math.max(0, (this.health / this.maxHealth) * 100), 14);

        // Stamina Bar
        ctx.fillStyle = (this.score >= 15) ? "#ffffff" : "#000000";
        ctx.fillText("Stamina:", 600, 27);
        ctx.fillStyle = "#555555";
        ctx.fillRect(670, 15, 110, 14);
        ctx.fillStyle = this.stamina > 50 ? "#2ecc71" : this.stamina > 20 ? "#f1c40f" : "#ff7675";
        ctx.fillRect(670, 15, (this.stamina / this.maxStamina) * 110, 14);
    }
}