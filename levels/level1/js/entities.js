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

// Erzeugt zufällige Power-Ups mit erhöhter Chance (60%) auf variabler Höhe
function spawnPickup(startX)
{
    if (Math.random() < 0.6)
    {
        let types = ["stamina", "stamina", "health", "ball"];
        let randomType = types[Math.floor(Math.random() * types.length)];
        
        // Dynamische Y-Höhe: Von hoch (ca. 100px) bis knapp über den Boden (ca. 320px)
        let minY = 100;
        let maxY = GROUND_Y - 60; // 320px
        let spawnY = minY + Math.random() * (maxY - minY);

        activePickups.push(new ItemPickup(startX + 80, spawnY, randomType));
    }
}

// Hindernis-Typen
const obstacleTypes = [
    { type: "single", sprite: new AnimatedSprite([flagFrame1, flagFrame2], pixelScale, 30), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([cartFrame1, cartFrame2], pixelScale, 50), flying: false, damage: 50 },
    { type: "single", sprite: new AnimatedSprite([treeFrame], pixelScale, 12), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([otherGolferFrame1, otherGolferFrame2], pixelScale, 14), flying: false, damage: 25 },
    { type: "single", sprite: new AnimatedSprite([birdFrame1, birdFrame2], pixelScale, 8), flying: true, damage: 15 },
    { type: "bunker", flying: false, damage: 35 },
    { type: "water", flying: false, damage: 35 }
];

function createObstacle(startX)
{
    let randomIndex = Math.floor(Math.random() * obstacleTypes.length);
    let selectedType = obstacleTypes[randomIndex];

    let newObstacle = {
        x: startX,
        y: GROUND_Y,
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

        let rows = bunkerLeft.length;
        newObstacle.height = rows * pixelScale;
        newObstacle.width = newObstacle.sprites.length * (bunkerLeft[0].length * pixelScale);
        
        // Dynamisch exakt auf den Boden setzen
        newObstacle.y = GROUND_Y - newObstacle.height;
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

        let rows = waterLeft.length;
        newObstacle.height = rows * pixelScale;
        newObstacle.width = newObstacle.sprites.length * (waterLeft[0].length * pixelScale);

        // Dynamisch exakt auf den Boden setzen
        newObstacle.y = GROUND_Y - newObstacle.height;
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
            newObstacle.y = GROUND_Y - newObstacle.height;
        }
    }

    spawnPickup(startX);

    return newObstacle;
}