const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let playerX = 60;
let playerY = 170 - objSize;
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

// Nachlade-Cooldown (45 Frames = 0.75 Sekunden)
let shotCooldownTimer = 0;
const shotCooldownDuration = 45;

// Neustart-Sperre (90 Frames = 1.5 Sekunden)
let restartCooldownTimer = 0;
const restartCooldownDuration = 90;

// Status & Clubhaus
let clubhouseX = 700;
let isAtClubhouse = false;
let wallExploded = false;

let animBalls = 0;
let animTime = 0;

// Sprites direkt instanziieren (clubhouseBuildingFrame kommt sauber aus sprites.js)
let playerAddressSprite = new AnimatedSprite([golferAddressFrame], pixelScale);
let playerBackswingSprite = new AnimatedSprite([golferBackswingFrame], pixelScale);
let playerFollowThroughSprite = new AnimatedSprite([golferFollowThroughFrame], pixelScale);
let clubhouseSprite = new AnimatedSprite([clubhouseBuildingFrame], pixelScale);

function initChapter2()
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

    // Timer starten
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (currentState === GAME_STATE.PLAYING && timeRemaining > 0)
        {
            timeRemaining--;
            if (timeRemaining === 0)
            {
                triggerWallExplosion();
            }
        }
    }, 1000);

    // 2D-Mauer Grid
    wallGrid = [];
    for (let col = 0; col < COLS; col++)
    {
        wallGrid[col] = [];
        for (let row = 0; row < ROWS; row++)
        {
            let blockX = wallStartX + (col * objSize);
            let blockY = 170 - ((row + 1) * objSize);

            let variant = Math.floor(Math.random() * 3) + 1;
            let block = new WallBlock(blockX, blockY, col, variant);

            wallGrid[col][row] = block;
            wallBlocks.push(block);
        }
    }

    // Zombies
    for (let i = 0; i < 5; i++)
    {
        let startX = 590 + Math.random() * 120;
        zombies.push(new Zombie(startX, 580, 730));
    }

    startSpookyC64Music();
}

// Mauer in Trümmer zerspringen lassen
function triggerWallExplosion()
{
    if (wallExploded) return;
    wallExploded = true;
    playHitSound();

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

// Berechnet Zielpositionen für sanftes Herunterfallen der Steine
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
            activeColBlocks[i].targetY = 170 - ((i + 1) * objSize);
        }
    }
}

// STEUERUNG
document.addEventListener("keydown", (e) => {
    keys[e.code] = true;

    if (e.code === "Space" && !powerCharging && shotCooldownTimer === 0 && remainingBalls > 0 && currentState === GAME_STATE.PLAYING)
    {
        powerCharging = true;
        swingPower = 0;
    }

    // Neustart nur wenn Spiel vorbei UND Cooldown abgelaufen ist
    if ((currentState === GAME_STATE.WON || currentState === GAME_STATE.GAMEOVER) &&
        restartCooldownTimer === 0 &&
        (e.code === "Space" || e.code === "KeyR" || e.code === "Enter"))
    {
        initChapter2();
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.code] = false;

    if (e.code === "Space" && powerCharging && currentState === GAME_STATE.PLAYING)
    {
        powerCharging = false;
        shootBall();
    }
});

function shootBall()
{
    if (remainingBalls <= 0) return;

    playJumpSound();
    remainingBalls--;

    let powerFactor = swingPower / 100;
    let vx = 3.5 + (powerFactor * 9.5);
    let vy = -2.8 - (powerFactor * 7.5);

    let ballStartX = playerX + objSize;
    let ballStartY = playerY + (4 * pixelScale);

    activeBalls.push(new GolfBall(ballStartX, ballStartY, vx, vy));
    swingPower = 0;

    shotCooldownTimer = shotCooldownDuration;

    // Keine Bälle mehr vorhanden -> Mauer sprengen
    if (remainingBalls === 0)
    {
        setTimeout(() => {
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
    stopC64Music();

    animBalls = remainingBalls;
    animTime = timeRemaining;

    score = remainingBalls * timeRemaining;
    checkAndSendHighScoreCh2(score);
}

// GAME LOOP
function gameLoop()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Satte grüne Fairway-Farbe
    ctx.fillStyle = colorPalette[12];
    ctx.fillRect(0, 170, canvas.width, 30);

    // Neustart-Sperre herunterzählen
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

        // 1. Bewegung
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

        // Zielerreichung: Alle Zombies weg & Spieler beim Clubhaus
        if (livingZombies === 0 && playerX >= 660)
        {
            currentState = GAME_STATE.WON;
            restartCooldownTimer = restartCooldownDuration;
            if (timerInterval) clearInterval(timerInterval);
            startScoreTally();
        }

        // Powerbar aufladen (Exakte 1.0 Sekunden Aufladezeit)
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

        // 2. Mauer-Updates & Trümmer-Physik
        for (let block of wallBlocks) block.update();
        for (let d of wallDebrisList) d.update();

        // 3. Bälle & Kollisionen
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
                        playHitSound();

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
                            playHitSound();
                            break;
                        }
                    }
                }
            }
        }

        // 4. Zombies & Angriff auf den Spieler
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
                    playGameOverSound();
                }
            }
        }
    }

    // 5. ZEICHNEN
    for (let block of wallBlocks) block.draw(ctx);
    for (let d of wallDebrisList) d.draw(ctx);
    for (let z of zombies) z.draw(ctx);
    for (let ball of activeBalls) ball.draw(ctx);

    let livingZombies = zombies.filter(z => !z.isDead).length;
    if (livingZombies === 0)
    {
        clubhouseSprite.draw(ctx, clubhouseX, 110);
    }

    // Spieler-Rendering
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
            ctx.arc(playerX + objSize + 4, 168, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // HUD Oberzeile
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Bälle: ${remainingBalls}`, 20, 25);
    ctx.fillText(`Zeit: ${timeRemaining}s`, 140, 25);
    ctx.fillText(`HI: ${highScoreCh2}`, 700, 25);

    // Powerbar UI
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

    // WEG FREI Hinweis
    if (livingZombies === 0 && currentState === GAME_STATE.PLAYING)
    {
        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 16px Arial";
        ctx.fillText("WEG FREI! Laufe nach rechts zum Clubhaus ➔", 230, 45);
    }

    // WIN SCREEN
    if (currentState === GAME_STATE.WON)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(150, 30, 500, 125);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(150, 30, 500, 125);

        ctx.fillStyle = "#2ecc71";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL ABGESCHLOSSEN! ⛳", 400, 55);

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Rest-Bälle: ${animBalls}  ×  Rest-Zeit: ${animTime}s`, 400, 82);

        ctx.fillStyle = "#f1c40f";
        ctx.font = "bold 22px Arial";
        ctx.fillText(`Gesamt Score: ${score}`, 400, 112);

        ctx.fillStyle = "#ddd";
        ctx.font = "12px Arial";
        if (restartCooldownTimer > 0)
        {
            ctx.fillText("Moment...", 400, 140);
        }
        else
        {
            ctx.fillText("Drücke LEERTASTE oder 'R' für Neustart", 400, 140);
        }
        ctx.textAlign = "left";
    }

    // GAME OVER SCREEN
    if (currentState === GAME_STATE.GAMEOVER)
    {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";

        if (timeRemaining === 0)
        {
            ctx.fillText("DIE ZEIT IST ABGELAUFEN! ⏱️", 400, 85);
        }
        else if (remainingBalls === 0)
        {
            ctx.fillText("KEINE BÄLLE MEHR VORHANDEN! ⚽", 400, 85);
        }
        else
        {
            ctx.fillText("DIE ZOMBIES HABEN DICH ERWISCHT! 🧟", 400, 85);
        }

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        if (restartCooldownTimer > 0)
        {
            ctx.fillText("Moment...", 400, 125);
        }
        else
        {
            ctx.fillText("Drücke LEERTASTE oder 'R' für Neustart", 400, 125);
        }
        ctx.textAlign = "left";
    }

    requestAnimationFrame(gameLoop);
}

initChapter2();
gameLoop();