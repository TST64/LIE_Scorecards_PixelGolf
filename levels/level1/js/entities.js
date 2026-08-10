class AnimatedSprite
{
    constructor(frames, pixelSize, ticksPerFrame = 12)
    {
        this.frames = frames;
        this.pixelSize = pixelSize;
        this.currentFrame = 0;
        this.tickCount = 0;
        this.ticksPerFrame = ticksPerFrame; // Nimmt jetzt den übergebenen Wert an!
    }

    update()
    {
        this.tickCount++;
        if (this.tickCount >= this.ticksPerFrame)
        {
            this.tickCount = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }
    }

    draw(ctx, x, y)
    {
        const frame = this.frames[this.currentFrame];
        for (let row = 0; row < frame.length; row++)
        {
            for (let col = 0; col < frame[row].length; col++)
            {
                let colorIndex = frame[row][col];
                if (colorIndex !== 0)
                {
                    ctx.fillStyle = colorPalette[colorIndex];
                    let drawX = x + (col * this.pixelSize);
                    let drawY = y + (row * this.pixelSize);
                    ctx.fillRect(drawX, drawY, this.pixelSize, this.pixelSize);
                }
            }
        }
    }
}

// Sternenfeld für den Nachtmodus
let stars = [];
for (let i = 0; i < 20; i++)
{
    stars.push({
        x: Math.random() * 800,
        y: Math.random() * 100,
        size: Math.random() > 0.5 ? 2 : 1
    });
}

// Pickup-Klasse für Power-Ups
class ItemPickup
{
    constructor(x, y, type)
    {
        this.x = x;
        this.y = y;
        this.type = type; // "ball", "stamina", "health"
        this.width = 5 * pixelScale;
        this.height = 5 * pixelScale;
        this.collected = false;

        if (type === "ball")
        {
            this.sprite = new AnimatedSprite([golfBallPickupFrame], pixelScale);
        }
        else if (type === "stamina")
        {
            this.sprite = new AnimatedSprite([staminaItemFrame], pixelScale);
        }
        else if (type === "health")
        {
            this.sprite = new AnimatedSprite([healthItemFrame], pixelScale);
        }
    }

    update(speed)
    {
        this.x -= speed;
    }

    draw(ctx)
    {
        if (!this.collected)
        {
            this.sprite.draw(ctx, this.x, this.y);
        }
    }
}

let activePickups = [];

// Erzeugt zufällige Power-Ups mit erhöhter Chance (60%)
function spawnPickup(startX)
{
    if (Math.random() < 0.6)
    {
        let types = ["stamina", "stamina", "health", "ball"];
        let randomType = types[Math.floor(Math.random() * types.length)];
        let spawnY = 70 + Math.random() * 50; // Schwebend auf Sprunghöhe
        activePickups.push(new ItemPickup(startX + 80, spawnY, randomType));
    }
}

// In obstacleTypes in levels/level1/js/entities.js:
const obstacleTypes = [
    { type: "single", sprite: new AnimatedSprite([flagFrame1, flagFrame2], pixelScale, 30), flying: false, damage: 25 }, // Fahne weht sehr ruhig
    { type: "single", sprite: new AnimatedSprite([cartFrame1, cartFrame2], pixelScale, 50), flying: false, damage: 50 },  // Cart ruckelt sanft
    { type: "single", sprite: new AnimatedSprite([treeFrame], pixelScale, 12), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([otherGolferFrame1, otherGolferFrame2], pixelScale, 14), flying: false, damage: 25 }, // Gegenspieler geht gemütlich
    { type: "single", sprite: new AnimatedSprite([birdFrame1, birdFrame2], pixelScale, 8), flying: true, damage: 15 },    // Vogel flattert etw. schneller
    { type: "bunker", flying: false, damage: 35 },
    { type: "water", flying: false, damage: 35 }
];

function createObstacle(startX)
{
    let randomIndex = Math.floor(Math.random() * obstacleTypes.length);
    let selectedType = obstacleTypes[randomIndex];

    let newObstacle = {
        x: startX,
        y: 130,
        width: objSize,
        height: objSize,
        sprites: [],
        flying: selectedType.flying,
        damage: selectedType.damage
    };

    if (selectedType.type === "bunker")
    {
        let middleCount = Math.floor(Math.random() * 3);
        newObstacle.sprites.push(new AnimatedSprite([bunkerLeft], pixelScale));
        for (let i = 0; i < middleCount; i++)
        {
            newObstacle.sprites.push(new AnimatedSprite([bunkerMiddle], pixelScale));
        }
        newObstacle.sprites.push(new AnimatedSprite([bunkerRight], pixelScale));

        newObstacle.width = newObstacle.sprites.length * objSize;
        newObstacle.y = 130;
    }
    else if (selectedType.type === "water")
    {
        let middleCount = Math.floor(Math.random() * 3);
        newObstacle.sprites.push(new AnimatedSprite([waterLeft], pixelScale));
        for (let i = 0; i < middleCount; i++)
        {
            newObstacle.sprites.push(new AnimatedSprite([waterMiddle], pixelScale));
        }
        newObstacle.sprites.push(new AnimatedSprite([waterRight], pixelScale));

        newObstacle.width = newObstacle.sprites.length * objSize;
        newObstacle.y = 130;
    }
    else
    {
        newObstacle.sprites.push(selectedType.sprite);

        let frame = selectedType.sprite.frames[0];
        let cols = frame[0].length;
        let rows = frame.length;

        newObstacle.width = cols * pixelScale;
        newObstacle.height = rows * pixelScale;

        if (selectedType.flying)
        {
            newObstacle.y = 85;
        }
        else
        {
            newObstacle.y = 170 - newObstacle.height;
        }
    }

    // Power-Up zusammen mit dem Hindernis erzeugen
    spawnPickup(startX);

    return newObstacle;
}