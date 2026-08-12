// Mauerblock mit sichtbarem Fallen und Treffer-Blinken
class WallBlock
{
    constructor(x, y, colIdx, variant)
    {
        this.x = x;
        this.y = y;
        this.targetY = y;
        this.colIdx = colIdx;
        this.width = objSize;
        this.height = objSize;
        this.destroyed = false;
        this.flashTimer = 0;

        let frame = wallBlockFrame1;
        if (variant === 2) frame = wallBlockFrame2;
        if (variant === 3) frame = wallBlockFrame3;

        this.sprite = new AnimatedSprite([frame], pixelScale);
        this.flashSprite = new AnimatedSprite([hitFlashFrame], pixelScale);
    }

    triggerHit()
    {
        this.flashTimer = 8;
    }

    update()
    {
        if (this.flashTimer > 0)
        {
            this.flashTimer--;
            if (this.flashTimer === 0)
            {
                this.destroyed = true;
            }
        }

        if (!this.destroyed && this.y < this.targetY)
        {
            this.y += 3;
            if (this.y > this.targetY)
            {
                this.y = this.targetY;
            }
        }
    }

    draw(ctx)
    {
        if (this.flashTimer > 0)
        {
            this.flashSprite.draw(ctx, this.x, this.y);
        }
        else if (!this.destroyed)
        {
            this.sprite.draw(ctx, this.x, this.y);
        }
    }
}

// Zombie mit Treffer-Blinken
class Zombie
{
    constructor(x, minX, maxX)
    {
        this.x = x;
        this.y = GROUND_Y - objSize;
        this.width = objSize;
        this.height = objSize;
        this.minX = minX;
        this.maxX = maxX;
        this.speed = 0.8 + Math.random() * 0.6;
        this.attackSpeed = 1.6 + Math.random() * 0.4;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.isDead = false;
        this.flashTimer = 0;

        this.sprite = new AnimatedSprite([zombieFrame1, zombieFrame2], pixelScale);
        this.flashSprite = new AnimatedSprite([hitFlashFrame], pixelScale);
    }

    triggerHit()
    {
        this.flashTimer = 8;
    }

    update(wallDestroyed, targetPlayerX)
    {
        if (this.flashTimer > 0)
        {
            this.flashTimer--;
            if (this.flashTimer === 0)
            {
                this.isDead = true;
            }
            return;
        }

        if (this.isDead) return;

        if (wallDestroyed)
        {
            if (this.x > targetPlayerX) this.x -= this.attackSpeed;
            else this.x += this.attackSpeed;
        }
        else
        {
            this.x += this.speed * this.direction;
            if (this.x <= this.minX || this.x + this.width >= this.maxX)
            {
                this.direction *= -1;
            }
        }

        this.sprite.update();
    }

    draw(ctx)
    {
        if (this.flashTimer > 0)
        {
            this.flashSprite.draw(ctx, this.x, this.y);
        }
        else if (!this.isDead)
        {
            this.sprite.draw(ctx, this.x, this.y);
        }
    }
}

// Fliegender Golfball
class GolfBall
{
    constructor(x, y, vx, vy)
    {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
    }

    update()
    {
        if (!this.active) return;

        this.x += this.vx;
        this.vy += gravity;
        this.y += this.vy;

        if (this.y >= (GROUND_Y - 2))
        {
            this.y = GROUND_Y - 2;
            this.active = false;
        }
    }

    draw(ctx)
    {
        if (!this.active) return;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Mauer-Trümmerteil (Explosions-Partikel)
class WallDebris
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 5 - 2;
        this.color = Math.random() > 0.5 ? colorPalette[20] : colorPalette[21];
        this.active = true;
    }

    update()
    {
        if (!this.active) return;
        this.x += this.vx;
        this.vy += gravity;
        this.y += this.vy;

        if (this.y >= GROUND_Y)
        {
            this.active = false;
        }
    }

    draw(ctx)
    {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}