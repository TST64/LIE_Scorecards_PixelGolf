// Sicherheits-Fallback, falls config.js nicht rechtzeitig geladen wurde
if (typeof currentPlayerName === 'undefined')
{
    var currentPlayerName = "Golfer";
}

if (!DEBUG_MODE)
{
    document.getElementById("controlsPanel").style.display = "none";
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 50, y: 130, width: objSize, height: objSize, velocityY: 0 };
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
    { x: 100, y: 20, speed: 0.5 },
    { x: 350, y: 50, speed: 0.8 },
    { x: 650, y: 30, speed: 0.4 }
];

let grassTufts = [
    { x: 120, y: 175, w: 6 },
    { x: 300, y: 182, w: 10 },
    { x: 520, y: 178, w: 8 },
    { x: 740, y: 185, w: 5 }
];

function resetGame()
{
    currentState = GAME_STATE.PLAYING;
    
    // Geschwindigkeit strikt auf den Startwert zurücksetzen
    baseSpeed = initialBaseSpeed;

    if (DEBUG_MODE)
    {
        document.getElementById("sliderBaseSpeed").value = initialBaseSpeed.toFixed(1);
        document.getElementById("valBaseSpeed").textContent = initialBaseSpeed.toFixed(1);
    }

    score = 0;
    stamina = maxStamina;
    health = maxHealth;
    invulnerabilityTimer = 0;
    
    // Status für Ziel & Jubel komplett zurücksetzen
    levelCompleted = false;
    clubhouseX = 850;
    celebrateFrame = 0;
    celebrateTimer = 0;

    // Spieler-Position exakt zurücksetzen
    player.y = 130;
    player.velocityY = 0;
    isGrounded = true;

    // Hindernisse & Pickups leeren und frisch starten
    activeObstacles = [];
    activePickups = [];
    activeObstacles.push(createObstacle(800));

    // C64-Soundtrack neu anstoßen
    startC64Music();
}
// Live-Labor Event Listener
document.getElementById("sliderInitialJump").addEventListener("input", (e) => {
    initialJumpPower = parseFloat(e.target.value);
    document.getElementById("valInitialJump").textContent = initialJumpPower.toFixed(1);
});
document.getElementById("sliderHoldBoost").addEventListener("input", (e) => {
    holdBoostPower = parseFloat(e.target.value);
    document.getElementById("valHoldBoost").textContent = holdBoostPower.toFixed(2);
});
document.getElementById("sliderGravity").addEventListener("input", (e) => {
    gravity = parseFloat(e.target.value);
    document.getElementById("valGravity").textContent = gravity.toFixed(2);
});
document.getElementById("sliderBaseSpeed").addEventListener("input", (e) => {
    initialBaseSpeed = parseFloat(e.target.value);
    baseSpeed = initialBaseSpeed;
    document.getElementById("valBaseSpeed").textContent = initialBaseSpeed.toFixed(1);
});
document.getElementById("sliderStaminaDrain").addEventListener("input", (e) => {
    staminaDrain = parseFloat(e.target.value);
    document.getElementById("valStaminaDrain").textContent = staminaDrain.toFixed(1);
});
document.getElementById("sliderStaminaRegen").addEventListener("input", (e) => {
    staminaRegen = parseFloat(e.target.value);
    document.getElementById("valStaminaRegen").textContent = staminaRegen.toFixed(1);
});
document.getElementById("sliderBaseGap").addEventListener("input", (e) => {
    baseMinGap = parseInt(e.target.value);
    document.getElementById("valBaseGap").textContent = baseMinGap;
});

// --- STEUERUNG: TASTATUR ---
document.addEventListener("keydown", (e) => {
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
            playJumpSound();
            player.velocityY = initialJumpPower;
            isGrounded = false;
        }
    }

    if (e.code === "KeyP" && currentState !== GAME_STATE.GAMEOVER && currentState !== GAME_STATE.START && !levelCompleted)
    {
        if (currentState === GAME_STATE.PLAYING)
        {
            currentState = GAME_STATE.PAUSED;
            stopC64Music();
        }
        else
        {
            currentState = GAME_STATE.PLAYING;
            startC64Music();
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    if ((currentState === GAME_STATE.GAMEOVER || levelCompleted) && (e.code === "KeyR" || e.code === "Enter"))
    {
        resetGame();
        requestAnimationFrame(gameLoop);
        return;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "Space")
    {
        isSpacePressed = false;
    }
});

// --- STEUERUNG: TOUCH (SMARTPHONE) ---
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();

    if (audioCtx.state === 'suspended')
    {
        audioCtx.resume();
    }

    isSpacePressed = true;

    if (currentState === GAME_STATE.START)
    {
        resetGame();
        return;
    }

    if (currentState === GAME_STATE.GAMEOVER || levelCompleted)
    {
        resetGame();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (isGrounded && currentState === GAME_STATE.PLAYING && stamina > 10 && !levelCompleted)
    {
        playJumpSound();
        player.velocityY = initialJumpPower;
        isGrounded = false;
    }
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    isSpacePressed = false;
}, { passive: false });

// --- ENVIRONMENT ---
function drawEnvironment(ctx)
{
    let bgColor = "#87CEEB"; // Tag
    let grassColor = "#2E8B57";
    let tuftColor = "#246B43";

    if (score >= 15)
    {
        bgColor = "#0B132B"; // Nacht
        grassColor = "#1C4E35";
        tuftColor = "#123322";
    }
    else if (score >= 6)
    {
        bgColor = "#4B2E83"; // Dämmerung
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
    ctx.fillRect(0, 170, canvas.width, 30);

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
        ctx.fillText("LOCH IHN EIN - Pixel Golf Run II", 180, 65);

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(`Hallo ${currentPlayerName}! Tippe oder drücke LEERTASTE`, 205, 105);

        ctx.font = "12px Arial";
        ctx.fillStyle = "#ddd";
        ctx.fillText("Steuerung: Tippen = Hüpfen | Gedrückt halten = Segeln (Stamina)", 210, 140);

        requestAnimationFrame(gameLoop);
        return;
    }

    if (currentState === GAME_STATE.GAMEOVER)
    {
        checkAndSendHighScore(score);

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 280, 70);

        ctx.font = "20px Arial";
        ctx.fillText("Dein Score: " + score + "   |   Highscore: " + highScore, 240, 110);
        ctx.fillText("Tippe oder drücke 'R' / 'Enter' für Neustart", 215, 150);
        return;
    }

    if (currentState === GAME_STATE.PAUSED)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("PAUSE", 340, 90);
        ctx.font = "20px Arial";
        ctx.fillText("Drücke 'P' zum Fortsetzen", 280, 130);
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

        if (player.y >= 130)
        {
            player.y = 130;
            player.velocityY = 0;
            isGrounded = true;

            if (stamina < maxStamina)
            {
                stamina += staminaRegen;
                if (stamina > maxStamina) stamina = maxStamina;
            }
        }

        if (invulnerabilityTimer > 0) invulnerabilityTimer--;

        // Zielerreichung prüfen
        if (score >= 30)
        {
            clubhouseX -= baseSpeed;
            if (clubhouseX <= 550)
            {
                clubhouseX = 550;
                levelCompleted = true;

                player.y = 130;
                player.velocityY = 0;
                isGrounded = true;

                stopC64Music();
                checkAndSendHighScore(score);
            }
        }
        else
        {
            let lastObstacle = activeObstacles[activeObstacles.length - 1];
            let currentMinGap = Math.max(280, baseMinGap - (score * 6));
            let minGap = currentMinGap + Math.random() * 110;

            if (lastObstacle && (canvas.width - lastObstacle.x) >= minGap)
            {
                activeObstacles.push(createObstacle(canvas.width + 50));
            }
        }

        for (let i = activeObstacles.length - 1; i >= 0; i--)
        {
            let obs = activeObstacles[i];
            obs.x -= baseSpeed;

            if (obs.flying)
            {
                obs.y = 85 + Math.sin(obs.x * 0.015) * 35;
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
                    playGameOverSound();
                    currentState = GAME_STATE.GAMEOVER;
                }
                else
                {
                    playHitSound();
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
                playPickupSound();

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
                clouds[i].y = 10 + Math.random() * 60;
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
        clubhouseSprite.draw(ctx, clubhouseX, 110);
    }

    for (let p of activePickups)
    {
        p.draw(ctx);
    }

    ctx.fillStyle = (score >= 15) ? "white" : "black";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score + "  |  HI: " + highScore, 200, 30);

    ctx.fillText("Health:", 420, 27);
    ctx.fillStyle = "#555";
    ctx.fillRect(470, 15, 100, 14);
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(470, 15, Math.max(0, (health / maxHealth) * 100), 14);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(470, 15, 100, 14);

    ctx.fillStyle = (score >= 15) ? "white" : "black";
    ctx.font = "14px Arial";
    ctx.fillText("Stamina:", 600, 27);
    ctx.fillStyle = "#555";
    ctx.fillRect(660, 15, 110, 14);

    if (stamina > 50) ctx.fillStyle = "#2ecc71";
    else if (stamina > 20) ctx.fillStyle = "#f1c40f";
    else ctx.fillStyle = "#e74c3c";

    ctx.fillRect(660, 15, (stamina / maxStamina) * 110, 14);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(660, 15, 110, 14);

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
        playerSprite.draw(ctx, player.x, 130 + jumpOffset);

        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(150, 45, 500, 75);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(150, 45, 500, 75);

        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("ZIEL ERREICHT! ⛳", 400, 70);

        ctx.fillStyle = "white";
        ctx.font = "13px Arial";
        ctx.fillText(`Glückwunsch ${currentPlayerName}! Clubhaus erreicht.`, 400, 92);
        ctx.fillText("Tippe oder drücke 'R' / 'Enter' zum Weiterspielen", 400, 110);
        ctx.textAlign = "left";
    }
    else
    {
        if (invulnerabilityTimer === 0 || Math.floor(invulnerabilityTimer / 6) % 2 === 0)
        {
            playerSprite.draw(ctx, player.x, player.y);
        }
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Developed by Gemini © 2026 LochIhnEin", canvas.width - 10, canvas.height - 8);
    ctx.textAlign = "left";

    requestAnimationFrame(gameLoop);
}

gameLoop();