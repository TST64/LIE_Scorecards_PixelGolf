const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ZUSTÄNDE & BALANCING FÜR LEVEL 2 ---
const GAME_STATE = 
{
    START: "START",
    PLAYING: "PLAYING",
    WON: "WON",
    GAMEOVER: "GAMEOVER"
};

let currentState = GAME_STATE.START;

// Mechanik & Balancing
let playerSpeed = 2.5;
let gravity = 0.28;

// Schlag-Power & Steuerung
let swingPower = 0;
const maxSwingPower = 100;
let powerCharging = false;
let powerDirection = 1;

// Level 2 Ressourcen & Timer
let remainingBalls = 50;
let timeRemaining = 60;
let timerInterval = null;

let score = 0;

let playerX = 60;
let playerY = GROUND_Y - objSize;
let isMoving = false;

let keys = {};
let wallGrid = [];
let wallBlocks = [];
let zombies = [];
let activeBalls = [];
let wallDebrisList = [];

const COLS = 4;
const ROWS = 8;
const wallStartX = 420;

let shotCooldownTimer = 0;
const shotCooldownDuration = 45;

let restartCooldownTimer = 0;
const restartCooldownDuration = 90;

let clubhouseX = 700;
let isAtClubhouse = false;
let wallExploded = false;

let animBalls = 0;
let animTime = 0;

let playerAddressSprite = new AnimatedSprite([golferAddressFrame], pixelScale);
let playerBackswingSprite = new AnimatedSprite([golferBackswingFrame], pixelScale);
let playerFollowThroughSprite = new AnimatedSprite([golferFollowThroughFrame], pixelScale);
let clubhouseSprite = new AnimatedSprite([clubhouseBuildingFrame], pixelScale);

function initLevel2()
{
    currentState = GAME_STATE.PLAYING;
    wallBlocks = [];
    zombies = [];
    activeBalls = [];
    wallDebrisList = [];
    playerX = 60;
    shotCooldownTimer = 0;
    restartCooldownTimer = 0;
    wallExploded = false;

    remainingBalls = 50;
    timeRemaining = 60;
    score = 0;
    isAtClubhouse = false;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => 
    {
        if (currentState === GAME_STATE.PLAYING && timeRemaining > 0)
        {
            timeRemaining--;
            if (timeRemaining === 0)
            {
                triggerWallExplosion();
            }
        }
    }, 1000);

    wallGrid = [];
    for (let col = 0; col < COLS; col++)
    {
        wallGrid[col] = [];
        for (let row = 0; row < ROWS; row++)
        {
            let blockX = wallStartX + (col * objSize);
            let blockY = GROUND_Y - ((row + 1) * objSize);

            let variant = Math.floor(Math.random() * 3) + 1;
            let block = new WallBlock(blockX, blockY, col, variant);

            wallGrid[col][row] = block;
            wallBlocks.push(block);
        }
    }

    for (let i = 0; i < 5; i++)
    {
        let startX = 590 + Math.random() * 120;
        zombies.push(new Zombie(startX, 580, 730));
    }

    if (typeof startSpookyC64Music === "function")
    {
        startSpookyC64Music();
    }
}

function triggerWallExplosion()
{
    if (wallExploded) return;
    wallExploded = true;
    if (typeof playHitSound === "function") playHitSound();

    for (let block of wallBlocks)
    {
        if (!block.destroyed)
        {
            block.destroyed = true;
            for (let i = 0; i < 4; i++)
            {
                wallDebrisList.push(new WallDebris(block.x + Math.random() * objSize, block.y + Math.random() * objSize));
            }
        }
    }
}

function applyWallGravity()
{
    for (let col = 0; col < COLS; col++)
    {
        let activeColBlocks = [];
        for (let row = 0; row < ROWS; row++)
        {
            let block = wallGrid[col][row];
            if (block && !block.destroyed)
            {
                activeColBlocks.push(block);
            }
        }

        for (let i = 0; i < activeColBlocks.length; i++)
        {
            activeColBlocks[i].targetY = GROUND_Y - ((i + 1) * objSize);
        }
    }
}

// --- STEUERUNG: TASTATUR ---
document.addEventListener("keydown", (e) => 
{
    keys[e.code] = true;

    // CHEAT-KEY 'ü' ODER 'Ü': Level 2 sofort gewinnen / überspringen
    if ((e.key === "ü" || e.key === "Ü") && typeof CHEAT_MODE_ENABLED !== "undefined" && CHEAT_MODE_ENABLED)
    {
        for (let z of zombies) z.isDead = true;
        triggerWallExplosion();

        playerX = 680;
        currentState = GAME_STATE.WON;
        restartCooldownTimer = restartCooldownDuration;
        
        if (timerInterval) clearInterval(timerInterval);
        startScoreTally();
        return;
    }    

    if (e.code === "Space" && !powerCharging && shotCooldownTimer === 0 && remainingBalls > 0 && currentState === GAME_STATE.PLAYING)
    {
        powerCharging = true;
        swingPower = 0;
    }

    if (e.code === "KeyP" && currentState !== GAME_STATE.GAMEOVER && currentState !== GAME_STATE.WON && currentState !== GAME_STATE.START)
    {
        if (currentState === GAME_STATE.PLAYING)
        {
            currentState = GAME_STATE.PAUSED;
            if (typeof stopC64Music === "function") stopC64Music();
        }
        else if (currentState === GAME_STATE.PAUSED)
        {
            currentState = GAME_STATE.PLAYING;
            if (typeof startSpookyC64Music === "function") startSpookyC64Music();
        }
        return;
    }    

    if ((currentState === GAME_STATE.WON || currentState === GAME_STATE.GAMEOVER) &&
        restartCooldownTimer === 0 &&
        (e.code === "Space" || e.code === "KeyR" || e.code === "Enter"))
    {
        initLevel2();
    }
});

document.addEventListener("keyup", (e) => 
{
    keys[e.code] = false;

    if (e.code === "Space" && powerCharging && currentState === GAME_STATE.PLAYING)
    {
        powerCharging = false;
        shootBall();
    }
});

// --- TOUCH-STEUERUNG FÜR MOBILGERÄTE ---
function handleTouchStart(e)
{
    e.preventDefault();
    if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended')
    {
        audioCtx.resume();
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    keys["ArrowLeft"] = false;
    keys["ArrowRight"] = false;

    for (let i = 0; i < e.touches.length; i++)
    {
        const touch = e.touches[i];
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;

        if ((currentState === GAME_STATE.WON || currentState === GAME_STATE.GAMEOVER) && typeof checkScoreboardIconClick === "function")
        {
            if (checkScoreboardIconClick(touchX, touchY, canvas.width, canvas.height)) return;
        }

        if ((currentState === GAME_STATE.WON || currentState === GAME_STATE.GAMEOVER) && restartCooldownTimer === 0)
        {
            initLevel2();
            return;
        }

        if (touchX >= 10 && touchX <= 68 && touchY >= 370)
        {
            keys["ArrowLeft"] = true;
        }
        else if (touchX >= 72 && touchX <= 130 && touchY >= 370)
        {
            keys["ArrowRight"] = true;
        }
        else if (touchX > 180)
        {
            if (!powerCharging && shotCooldownTimer === 0 && remainingBalls > 0 && currentState === GAME_STATE.PLAYING)
            {
                powerCharging = true;
                swingPower = 0;
            }
        }
    }
}

function handleTouchEnd(e)
{
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    let rightTouchActive = false;

    for (let i = 0; i < e.touches.length; i++)
    {
        const touchX = (e.touches[i].clientX - rect.left) * scaleX;
        if (touchX > 180) rightTouchActive = true;
    }

    if (!rightTouchActive && powerCharging && currentState === GAME_STATE.PLAYING)
    {
        powerCharging = false;
        shootBall();
    }

    handleTouchStart(e);
}

canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
canvas.addEventListener("touchmove", handleTouchStart, { passive: false });

function drawTouchControls(ctx)
{
    const btnY = 385;
    const btnSize = 50;

    const btnLeftPressed = keys["ArrowLeft"];
    const btnRightPressed = keys["ArrowRight"];

    const buttons = [
        { x: 15, y: btnY, text: "◄", pressed: btnLeftPressed },
        { x: 75, y: btnY, text: "►", pressed: btnRightPressed }
    ];

    for (let btn of buttons)
    {
        let offset = btn.pressed ? 2 : 0;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(btn.x, btn.y + 4, btnSize, btnSize);

        ctx.fillStyle = btn.pressed ? "#d35400" : "#f39c12";
        ctx.fillRect(btn.x, btn.y + offset, btnSize, btnSize);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y + offset, btnSize, btnSize);

        if (!btn.pressed)
        {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(btn.x + 2, btn.y + 2, btnSize - 4, 4);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText(btn.text, btn.x + (btnSize / 2), btn.y + offset + 32);
    }

    ctx.textAlign = "left";
}

function shootBall()
{
    if (remainingBalls <= 0) return;

    if (typeof playJumpSound === "function") playJumpSound();
    remainingBalls--;

    let powerFactor = swingPower / 100;
    let vx = 3.5 + (powerFactor * 9.5);
    let vy = -2.8 - (powerFactor * 7.5);

    let ballStartX = playerX + objSize;
    let ballStartY = playerY + (4 * pixelScale);

    activeBalls.push(new GolfBall(ballStartX, ballStartY, vx, vy));
    swingPower = 0;

    shotCooldownTimer = shotCooldownDuration;

    if (remainingBalls === 0)
    {
        setTimeout(() => 
        {
            let livingZombies = zombies.filter(z => !z.isDead).length;
            if (livingZombies > 0 && currentState === GAME_STATE.PLAYING)
            {
                triggerWallExplosion();
            }
        }, 1500);
    }
}

function startScoreTally()
{
    isAtClubhouse = true;
    if (typeof stopC64Music === "function") stopC64Music();

    animBalls = remainingBalls;
    animTime = timeRemaining;

    score = remainingBalls * timeRemaining;
    if (typeof sendHighscore === "function")
    {
        sendHighscore("savePixelGolfChapter2Score", currentPlayerName, score);
    }
}

// UPDATE & RENDER SCHLEIFE
function updateLevel2()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colorPalette[12];
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    if ((currentState === GAME_STATE.WON || currentState === GAME_STATE.GAMEOVER) && restartCooldownTimer > 0)
    {
        restartCooldownTimer--;
    }

    if (currentState === GAME_STATE.PLAYING)
    {
        if (shotCooldownTimer > 0) shotCooldownTimer--;

        let activeWallBlocks = wallBlocks.filter(b => !b.destroyed);
        let isWallCompletelyDestroyed = (activeWallBlocks.length === 0 || wallExploded);
        let livingZombies = zombies.filter(z => !z.isDead).length;

        isMoving = false;
        let maxX = isWallCompletelyDestroyed ? 740 : 360;

        if (keys["ArrowLeft"] || keys["KeyA"])
        {
            playerX = Math.max(10, playerX - playerSpeed);
            isMoving = true;
        }
        if (keys["ArrowRight"] || keys["KeyD"])
        {
            playerX = Math.min(maxX, playerX + playerSpeed);
            isMoving = true;
        }

        if (livingZombies === 0 && playerX >= 660)
        {
            currentState = GAME_STATE.WON;
            restartCooldownTimer = restartCooldownDuration;
            if (timerInterval) clearInterval(timerInterval);
            startScoreTally();
        }

        if (powerCharging)
        {
            swingPower += 1.666 * powerDirection;
            if (swingPower >= maxSwingPower)
            {
                swingPower = maxSwingPower;
                powerDirection = -1;
            }
            else if (swingPower <= 0)
            {
                swingPower = 0;
                powerDirection = 1;
            }
        }

        for (let block of wallBlocks) block.update();
        for (let d of wallDebrisList) d.update();

        for (let ball of activeBalls)
        {
            ball.update();

            if (ball.active)
            {
                for (let block of wallBlocks)
                {
                    if (!block.destroyed && block.flashTimer === 0 &&
                        ball.x > block.x && ball.x < block.x + block.width &&
                        ball.y > block.y && ball.y < block.y + block.height)
                    {
                        block.triggerHit();
                        ball.active = false;
                        if (typeof playHitSound === "function") playHitSound();

                        applyWallGravity();
                        break;
                    }
                }

                if (ball.active)
                {
                    for (let z of zombies)
                    {
                        if (!z.isDead && z.flashTimer === 0 &&
                            ball.x > z.x && ball.x < z.x + z.width &&
                            ball.y > z.y && ball.y < z.y + z.height)
                        {
                            z.triggerHit();
                            ball.active = false;
                            if (typeof playHitSound === "function") playHitSound();
                            break;
                        }
                    }
                }
            }
        }

        for (let z of zombies)
        {
            z.update(isWallCompletelyDestroyed, playerX);

            if (!z.isDead)
            {
                let playerHitMargin = 8;
                if (
                    playerX < z.x + z.width - playerHitMargin &&
                    playerX + objSize - playerHitMargin > z.x &&
                    playerY < z.y + z.height &&
                    playerY + objSize > z.y
                )
                {
                    currentState = GAME_STATE.GAMEOVER;
                    restartCooldownTimer = restartCooldownDuration;
                    if (timerInterval) clearInterval(timerInterval);
                    if (typeof playGameOverSound === "function") playGameOverSound();
                }
            }
        }
    }

    if (currentState === GAME_STATE.PAUSED)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSE ⏸️", canvas.width / 2, 200);

        ctx.font = "16px Arial";
        ctx.fillStyle = "#dddddd";
        ctx.fillText("Drücke 'P' zum Fortsetzen", canvas.width / 2, 240);
        ctx.textAlign = "left";
        return;
    }

    for (let block of wallBlocks) block.draw(ctx);
    for (let d of wallDebrisList) d.draw(ctx);
    for (let z of zombies) z.draw(ctx);
    for (let ball of activeBalls) ball.draw(ctx);

    let livingZombies = zombies.filter(z => !z.isDead).length;
    if (livingZombies === 0)
    {
        clubhouseSprite.draw(ctx, clubhouseX, GROUND_Y - (12 * pixelScale));
    }

    if (currentState !== GAME_STATE.GAMEOVER)
    {
        if (powerCharging)
        {
            playerBackswingSprite.draw(ctx, playerX, playerY);
        }
        else if (shotCooldownTimer > (shotCooldownDuration - 15))
        {
            playerFollowThroughSprite.draw(ctx, playerX, playerY);
        }
        else
        {
            playerAddressSprite.draw(ctx, playerX, playerY);
        }

        if (!isMoving && !powerCharging && shotCooldownTimer === 0 && remainingBalls > 0 && livingZombies > 0)
        {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(playerX + objSize + 4, GROUND_Y - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Bälle: ${remainingBalls}`, 20, 25);
    ctx.fillText(`Zeit: ${timeRemaining}s`, 140, 25);

    if (powerCharging && currentState === GAME_STATE.PLAYING)
    {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(playerX - 5, playerY - 12, 50, 6);
        ctx.fillStyle = colorPalette[9];
        ctx.fillRect(playerX - 5, playerY - 12, (swingPower / maxSwingPower) * 50, 6);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(playerX - 5, playerY - 12, 50, 6);
    }

    if (livingZombies === 0 && currentState === GAME_STATE.PLAYING)
    {
        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 16px Arial";
        ctx.fillText("WEG FREI! Laufe nach rechts zum Clubhaus ➔", 230, 45);
    }

    if (currentState === GAME_STATE.WON)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(150, 150, 500, 125);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(150, 150, 500, 125);

        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL ABGESCHLOSSEN! ⛳", 400, 175);

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Rest-Bälle: ${animBalls}  ×  Rest-Zeit: ${animTime}s`, 400, 202);

        ctx.fillStyle = "#f1c40f";
        ctx.font = "bold 22px Arial";
        ctx.fillText(`Gesamt Score: ${score}`, 400, 232);

        ctx.fillStyle = "#ddd";
        ctx.font = "12px Arial";
        if (restartCooldownTimer > 0)
        {
            ctx.fillText("Moment...", 400, 260);
        }
        else
        {
            ctx.fillText("Tippe oder drücke LEERTASTE / 'R' für Neustart", 400, 260);
        }
        ctx.textAlign = "left";

        if (typeof drawScoreboardIcon === "function")
        {
            drawScoreboardIcon(ctx, canvas.width, canvas.height);
        }
    }

    if (currentState === GAME_STATE.GAMEOVER)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";

        if (timeRemaining === 0)
        {
            ctx.fillText("DIE ZEIT IST ABGELAUFEN! ⏱️", 400, 185);
        }
        else if (remainingBalls === 0)
        {
            ctx.fillText("KEINE BÄLLE MEHR VORHANDEN! ⚽", 400, 185);
        }
        else
        {
            ctx.fillText("DIE ZOMBIES HABEN DICH ERWISCHT! 🧟", 400, 185);
        }

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        if (restartCooldownTimer > 0)
        {
            ctx.fillText("Moment...", 400, 225);
        }
        else
        {
            ctx.fillText("Tippe oder drücke LEERTASTE / 'R' für Neustart", 400, 225);
        }
        ctx.textAlign = "left";

        if (typeof drawScoreboardIcon === "function")
        {
            drawScoreboardIcon(ctx, canvas.width, canvas.height);
        }
    }

    drawTouchControls(ctx);
}

// --- FESTE 60 FPS GAME LOOP ---
let lastTimeLevel2 = 0;
const targetFPSLevel2 = 60;
const frameIntervalLevel2 = 1000 / targetFPSLevel2;

function gameLoopLevel2(timestamp)
{
    if (!lastTimeLevel2) lastTimeLevel2 = timestamp;
    const elapsed = timestamp - lastTimeLevel2;

    if (elapsed >= frameIntervalLevel2)
    {
        lastTimeLevel2 = timestamp - (elapsed % frameIntervalLevel2);
        updateLevel2();
    }

    requestAnimationFrame(gameLoopLevel2);
}

initLevel2();
requestAnimationFrame(gameLoopLevel2);