// --- ZENTRALE SPIEL-KONFIGURATION ---
const CHEAT_MODE_ENABLED = true; // 'true' = Cheats aktiv, 'false' = Deaktiviert

const GAME_CANVAS_WIDTH = 800;
const GAME_CANVAS_HEIGHT = 450;

// Globale Skalierung für Pixel-Art
const pixelScale = 5;
const objSize = 8 * pixelScale;

// Standard Boden-Höhe (Canvas Y = 380)
const GROUND_Y = 380;
const PLAYER_BASE_Y = GROUND_Y - objSize;

// Spieler-Identifikation aus URL-Parameter
const urlParams = new URLSearchParams(window.location.search);
const currentPlayerName = urlParams.get('player') || urlParams.get('spielerName') || "Golfer";

// --- HIGHSCORE BACKEND (Google Apps Script) ---
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz-J5f6pzUF5xRN4CEDU1kNX6bbFf-y922-hTZLrjxiJ_QmgY4WYuSg0IabruTuhprh/exec";

function sendHighscore(levelAction, playerName, score) 
{
    const payload = JSON.stringify({
        action: levelAction,
        spielerName: playerName,
        score: parseInt(score) || 0,
        timestamp: new Date().toISOString()
    });

    const callbackName = "gas_cb_" + Math.random().toString(36).substring(2, 15);
    window[callbackName] = function(data) 
    {
        console.log("Highscore gesendet:", data);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${GAS_API_URL}?callback=${callbackName}&data=${encodeURIComponent(payload)}`;
    document.body.appendChild(script);
}

// Prüft Touch/Klick auf das Highscore-Icon (Glocke/Trophäe unten rechts)
function checkScoreboardIconClick(clickX, clickY, canvasWidth, canvasHeight)
{
    const btnWidth = 40;
    const btnHeight = 40;
    const btnX = canvasWidth - btnWidth - 15;
    const btnY = canvasHeight - btnHeight - 15;

    if (clickX >= btnX && clickX <= btnX + btnWidth && clickY >= btnY && clickY <= btnY + btnHeight)
    {
        // Prüft, ob wir uns in einem Unterordner unter /levels/ befinden
        if (window.location.pathname.includes("/levels/"))
        {
            window.location.href = "../../highscores.html";
        }
        else
        {
            window.location.href = "highscores.html";
        }
        return true;
    }
    return false;
}

// Zeichnet das Highscore-Button Icon
function drawScoreboardIcon(ctx, canvasWidth, canvasHeight)
{
    const btnWidth = 40;
    const btnHeight = 40;
    const btnX = canvasWidth - btnWidth - 15;
    const btnY = canvasHeight - btnHeight - 15;

    // Button Hintergrund
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

    // Trophäen / Leaderboard Symbol
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆", btnX + 20, btnY + 27);
    ctx.textAlign = "left";
}