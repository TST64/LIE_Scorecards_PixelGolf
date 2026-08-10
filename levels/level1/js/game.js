const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- SPIELZUSTÄNDE & PHANTOM-KONFIGURATION ---
const GAME_STATE = 
{
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAMEOVER: "GAMEOVER"
};

let currentState = GAME_STATE.START;

// Gameplay- & Physik-Parameter
let initialJumpPower = -1.0;
let holdBoostPower = -0.2;
let gravity = 0.1;

let initialBaseSpeed = 2.0;
let baseSpeed = initialBaseSpeed;

let staminaDrain = 1.2;
let staminaRegen = 0.9;
let baseMinGap = 480;
const speedIncrement = 0.05;

// Status-Werte
let stamina = 100;
const maxStamina = 100;

let health = 100;
const maxHealth = 100;

let invulnerabilityTimer = 0;
const invulnerabilityDuration = 60;

let score = 0;

// Grundpositionen (Zentrale Höhe 450px)
let player = { x: 50, y: PLAYER_BASE_Y, width: objSize, height: objSize, velocityY: 0 };
let activeObstacles = [];
let isSpacePressed = false;
let isGrounded = true;

// Level-Ende & Jubel-Status
let levelCompleted = false;
let clubhouseX = 850;
let celebrateFrame = 0;
let celebrateTimer = 0;

let playerSprite = new AnimatedSprite([golferFrame1, golferFrame2], pixelScale);
let cloudSprite = new AnimatedSprite([cloudFrame], pixelScale);
let clubhouseSprite = new AnimatedSprite([clubhouseBuildingFrame], pixelScale);

let clouds = [
    { x: 100, y: 30, speed: 0.5 },
    { x: 350, y: 70, speed: 0.8 },
    { x: 650, y: 40, speed: 0.4 }
];

let grassTufts = [
    { x: 120, y: GROUND_Y + 5, w: 6 },
    { x: 300, y: GROUND_Y + 12, w: 10 },
    { x: 520, y: GROUND_Y + 8, w: 8 },
    { x: 740, y: GROUND_Y + 15, w: 5 }
];

function resetGame()
{
    currentState = GAME_STATE.PLAYING;
    baseSpeed = initialBaseSpeed;

    score = 0;
    stamina = maxStamina;
    health = maxHealth;
    invulnerabilityTimer = 0;
    
    levelCompleted = false;
    clubhouseX = 850;
    celebrateFrame = 0;
    celebrateTimer = 0;

    player.y = PLAYER_BASE_Y;
    player.velocityY = 0;
    isGrounded = true;

    activeObstacles = [];
    activePickups = [];
    activeObstacles.push(createObstacle(800));

    if (typeof startC64Music === "function")
    {
        startC64Music();
    }
}

function initGame(level)
{
    if (level === 1)
    {
        resetGame();
        requestAnimationFrame(gameLoop);
    }
    else if (level === 2)
    {
        window.location.href = "levels/level2/index.html";
    }
}

// --- STEUERUNG: TASTATUR ---
document.addEventListener("keydown", (e) => 
{
    // CHEAT-KEY 'ü' ODER 'Ü': Level 1 überspringen
    if ((e.key === "ü" || e.key === "Ü") && typeof CHEAT_MODE_ENABLED !== "undefined" && CHEAT_MODE_ENABLED)
    {
        score = 30;
        clubhouseX = 550;
        levelCompleted = true;
        player.y = PLAYER_BASE_Y;
        player.velocityY = 0;
        isGrounded = true;

        if (typeof stopC64Music === "function") 
        {
            stopC64Music();
        }
        return;
    }

    if (e.code === "Space")
    {
        isSpacePressed = true;

        if (currentState === GAME_STATE.START)
        {
            resetGame();
            return;
        }

        if (isGrounded && currentState === GAME_STATE.PLAYING && stamina > 10 && !levelCompleted)
        {
            if (typeof playJumpSound === "function") playJumpSound();
            player.velocityY = initialJumpPower;
            isGrounded = false;
        }
    }

    if (e.code === "KeyP" && currentState !== GAME_STATE.GAMEOVER && currentState !== GAME_STATE.START && !levelCompleted)
    {
        if (currentState === GAME_STATE.PLAYING)
        {
            currentState = GAME_STATE.PAUSED;
            if (typeof stopC64Music === "function") stopC64Music();
        }
        else
        {
            currentState = GAME_STATE.PLAYING;
            if (typeof startC64Music === "function") startC64Music();
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    if (currentState === GAME_STATE.GAMEOVER && (e.code === "KeyR" || e.code === "Enter"))
    {
        resetGame();
        requestAnimationFrame(gameLoop);
        return;
    }
});

document.addEventListener("keyup", (e) => 
{
    if (e.code === "Space")
    {
        isSpacePressed = false;
    }
});

// --- STEUERUNG: TOUCH / MAUSKLICK (INCL. HIGHSCORE ICON) ---
function handleCanvasInteraction(clientX, clientY)
{
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Klick auf Highscore-Icon prüfen bei Game Over oder Level-Abschluss
    if ((currentState === GAME_STATE.GAMEOVER || levelCompleted) && typeof checkScoreboardIconClick === "function")
    {
        if (checkScoreboardIconClick(clickX, clickY, canvas.width, canvas.height))
        {
            return;
        }
    }

    isSpacePressed = true;

    if (currentState === GAME_STATE.START)
    {
        resetGame();
        return;
    }

    if (currentState === GAME_STATE.GAMEOVER)
    {
        resetGame();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (isGrounded && currentState === GAME_STATE.PLAYING && stamina > 10 && !levelCompleted)
    {
        if (typeof playJumpSound === "function") playJumpSound();
        player.velocityY = initialJumpPower;
        isGrounded = false;
    }
}

canvas.addEventListener("mousedown", (e) => 
{
    handleCanvasInteraction(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => 
{
    e.preventDefault();
    if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended')
    {
        audioCtx.resume();
    }
    const touch = e.touches[0];
    handleCanvasInteraction(touch.clientX, touch.clientY);
}, { passive: false });

canvas.addEventListener("touchend", (e) => 
{
    e.preventDefault();
    isSpacePressed = false;
}, { passive: false });

// --- ENVIRONMENT ---
function drawEnvironment(ctx)
{
    let bgColor = "#87CEEB";
    let grassColor = "#2E8B57";
    let tuftColor = "#246B43";

    if (score >= 15)
    {
        bgColor = "#0B132B";
        grassColor = "#1C4E35";
        tuftColor = "#123322";
    }
    else if (score >= 6)
    {
        bgColor = "#4B2E83";
        grassColor = "#246B43";
        tuftColor = "#194A2E";
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (score >= 15)
    {
        ctx.fillStyle = colorPalette[11];
        for (let star of stars)
        {
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }
    }

    for (let i = 0; i < clouds.length; i++)
    {
        cloudSprite.draw(ctx, clouds[i].x, clouds[i].y);
    }

    ctx.fillStyle = grassColor;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    ctx.fillStyle = tuftColor;
    for (let tuft of grassTufts)
    {
        ctx.fillRect(tuft.x, tuft.y, tuft.w, 3);
    }
}

// GAME LOOP
function gameLoop()
{
    if (currentState === GAME_STATE.START)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawEnvironment(ctx);

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 28px Arial";
        ctx.fillText("LOCH IHN EIN - Pixel Golf Run", 180, 150);

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(`Hallo ${currentPlayerName}! Tippe oder drücke LEERTASTE`, 205, 200);

        ctx.font = "12px Arial";
        ctx.fillStyle = "#ddd";
        ctx.fillText("Steuerung: Tippen = Hüpfen | Gedrückt halten = Segeln (Stamina)", 210, 240);

        requestAnimationFrame(gameLoop);
        return;
    }

    if (currentState === GAME_STATE.GAMEOVER)
    {
        if (typeof sendHighscore === "function")
        {
            sendHighscore("savePixelGolfHighscore", currentPlayerName, score);
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 280, 180);

        ctx.font = "20px Arial";
        ctx.fillText("Dein Score: " + score, 330, 230);
        ctx.fillText("Tippe oder drücke 'R' / 'Enter' für Neustart", 215, 270);

        if (typeof drawScoreboardIcon === "function")
        {
            drawScoreboardIcon(ctx, canvas.width, canvas.height);
        }
        return;
    }

    if (currentState === GAME_STATE.PAUSED)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("PAUSE", 340, 200);
        ctx.font = "20px Arial";
        ctx.fillText("Drücke 'P' zum Fortsetzen", 280, 240);
        return;
    }

    if (!levelCompleted)
    {
        if (!isGrounded && isSpacePressed && stamina > 0)
        {
            player.velocityY += holdBoostPower;
            stamina -= staminaDrain;
            if (stamina < 0) stamina = 0;
        }

        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y >= PLAYER_BASE_Y)
        {
            player.y = PLAYER_BASE_Y;
            player.velocityY = 0;
            isGrounded = true;

            if (stamina < maxStamina)
            {
                stamina += staminaRegen;
                if (stamina > maxStamina) stamina = maxStamina;
            }
        }

        if (invulnerabilityTimer > 0) invulnerabilityTimer--;

        if (score >= 30)
        {
            clubhouseX -= baseSpeed;
            if (clubhouseX <= 550)
            {
                clubhouseX = 550;
                levelCompleted = true;

                player.y = PLAYER_BASE_Y;
                player.velocityY = 0;
                isGrounded = true;

                if (typeof stopC64Music === "function") stopC64Music();
                if (typeof sendHighscore === "function")
                {
                    sendHighscore("savePixelGolfHighscore", currentPlayerName, score);
                }
            }
        }
        else
        {
            let lastObstacle = activeObstacles[activeObstacles.length - 1];
            let currentMinGap = Math.max(280, baseMinGap - (score * 5));
            let minGap = currentMinGap + Math.random() * 110;

            if (lastObstacle && (canvas.width - lastObstacle.x) >= minGap)
            {
                activeObstacles.push(createObstacle(800));
            }
        }

        for (let i = activeObstacles.length - 1; i >= 0; i--)
        {
            let obs = activeObstacles[i];
            obs.x -= baseSpeed;

            if (obs.flying)
            {
                obs.y = 280 + Math.sin(obs.x * 0.015) * 35;
            }
            else
            {
                obs.y = GROUND_Y - obs.height;
            }

            if (obs.x + obs.width < 0)
            {
                activeObstacles.splice(i, 1);
                if (score < 30)
                {
                    score++;
                    baseSpeed += speedIncrement;
                }
                continue;
            }

            let hitMargin = 10;
            if (
                invulnerabilityTimer === 0 &&
                player.x < obs.x + obs.width - hitMargin &&
                player.x + player.width - hitMargin > obs.x &&
                player.y < obs.y + obs.height - hitMargin &&
                player.y + player.height - hitMargin > obs.y
            )
            {
                health -= obs.damage;
                if (health <= 0)
                {
                    health = 0;
                    if (typeof playGameOverSound === "function") playGameOverSound();
                    currentState = GAME_STATE.GAMEOVER;
                }
                else
                {
                    if (typeof playHitSound === "function") playHitSound();
                    invulnerabilityTimer = invulnerabilityDuration;
                }
            }

            for (let sprite of obs.sprites)
            {
                sprite.update();
            }
        }

        for (let i = activePickups.length - 1; i >= 0; i--)
        {
            let p = activePickups[i];
            p.update(baseSpeed);

            if (!p.collected &&
                player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y < p.y + p.height &&
                player.y + player.height > p.y)
            {
                p.collected = true;
                if (typeof playPickupSound === "function") playPickupSound();

                if (p.type === "ball" && score < 30) score += 2;
                if (p.type === "stamina") stamina = Math.min(maxStamina, stamina + 40);
                if (p.type === "health") health = Math.min(maxHealth, health + 25);
            }

            if (p.x + p.width < 0 || p.collected)
            {
                activePickups.splice(i, 1);
            }
        }

        for (let i = 0; i < clouds.length; i++)
        {
            clouds[i].x -= clouds[i].speed * (baseSpeed / 6);
            if (clouds[i].x + objSize < 0)
            {
                clouds[i].x = canvas.width + Math.random() * 100;
                clouds[i].y = 20 + Math.random() * 60;
            }
        }

        for (let tuft of grassTufts)
        {
            tuft.x -= baseSpeed;
            if (tuft.x < 0) tuft.x = canvas.width + Math.random() * 50;
        }

        if (isGrounded) playerSprite.update();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEnvironment(ctx);

    if (score >= 30)
    {
        clubhouseSprite.draw(ctx, clubhouseX, GROUND_Y - (12 * pixelScale));
    }

    for (let p of activePickups)
    {
        p.draw(ctx);
    }

    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Score: " + score, 30, 30);

    ctx.fillText("Health:", 380, 30);
    ctx.fillStyle = "#555";
    ctx.fillRect(445, 16, 100, 16);
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(445, 16, Math.max(0, (health / maxHealth) * 100), 16);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(445, 16, 100, 16);

    ctx.fillStyle = "white";
    ctx.fillText("Stamina:", 570, 30);
    ctx.fillStyle = "#555";
    ctx.fillRect(640, 16, 110, 16);

    if (stamina > 50) ctx.fillStyle = "#2ecc71";
    else if (stamina > 20) ctx.fillStyle = "#f1c40f";
    else ctx.fillStyle = "#e74c3c";

    ctx.fillRect(640, 16, (stamina / maxStamina) * 110, 16);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(640, 16, 110, 16);

    for (let obs of activeObstacles)
    {
        for (let i = 0; i < obs.sprites.length; i++)
        {
            obs.sprites[i].draw(ctx, obs.x + (i * objSize), obs.y);
        }
    }

    if (levelCompleted)
    {
        celebrateTimer++;
        if (celebrateTimer > 10)
        {
            celebrateTimer = 0;
            celebrateFrame = (celebrateFrame === 0) ? 1 : 0;
        }

        let jumpOffset = (celebrateFrame === 1) ? -8 : 0;
        playerSprite.currentFrame = celebrateFrame;
        playerSprite.draw(ctx, player.x, PLAYER_BASE_Y + jumpOffset);

        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(150, 150, 500, 110);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(150, 150, 500, 110);

        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL 1 ABGESCHLOSSEN! ⛳", 400, 185);

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Glückwunsch ${currentPlayerName}! Clubhaus erreicht.`, 400, 215);
        ctx.fillText("Tippe oder drücke LEERTASTE für Level 2", 400, 238);
        ctx.textAlign = "left";

        if (typeof drawScoreboardIcon === "function")
        {
            drawScoreboardIcon(ctx, canvas.width, canvas.height);
        }

        if (isSpacePressed)
        {
            isSpacePressed = false;
            
            if (typeof startLevel2 === "function")
            {
                startLevel2();
            }
            else
            {
                window.location.href = "levels/level2/index.html";
            }
            return;
        }
    }
    else
    {
        if (invulnerabilityTimer === 0 || Math.floor(invulnerabilityTimer / 6) % 2 === 0)
        {
            playerSprite.draw(ctx, player.x, player.y);
        }
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();