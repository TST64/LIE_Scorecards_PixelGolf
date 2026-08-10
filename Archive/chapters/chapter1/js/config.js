// --- GLOBALE SKALIERUNGSWERTE ---
const pixelScale = 5;
const objSize = 8 * pixelScale;

// --- DEBUGSCHALTER & SPIELZUSTÄNDE ---
const DEBUG_MODE = false;

const GAME_STATE = 
{
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAMEOVER: "GAMEOVER"
};

let currentState = GAME_STATE.START;

// Dynamische Balancing-Parameter (Griffiges Mid-Tempo)
let initialJumpPower = -4.0;
let holdBoostPower = -0.45;
let gravity = 0.30;

let initialBaseSpeed = 3.9; // Leicht angehoben (vorher 3.2, ganz am Anfang 4.7)
let baseSpeed = initialBaseSpeed;

let staminaDrain = 1.8; // Etwas höherer Verbrauch beim Segeln
let staminaRegen = 0.9; // Stamina-Erholung leicht angepasst
let baseMinGap = 480;   // Hindernisabstand wieder knackiger (vorher 580)

const speedIncrement = 0.08; // Solide Geschwindigkeitssteigerung pro Punkt


// Status-Werte
let stamina = 100;
const maxStamina = 100;

let health = 100;
const maxHealth = 100;

let invulnerabilityTimer = 0;
const invulnerabilityDuration = 60;

let score = 0;
let highScore = localStorage.getItem("golfHighScore") || 0;

// Highscore-Übertragung an Google Apps Script via JSONP
function sendHighscoreToScorecardApp(playerName, score) 
{
    const API_URL = "https://script.google.com/macros/s/AKfycbz-J5f6pzUF5xRN4CEDU1kNX6bbFf-y922-hTZLrjxiJ_QmgY4WYuSg0IabruTuhprh/exec";
    
    const payload = JSON.stringify({
        action: 'savePixelGolfHighscore',
        spielerName: playerName,
        score: parseInt(score) || 0,
        timestamp: new Date().toISOString()
    });

    const callbackName = "gas_hs_cb_" + Math.random().toString(36).substring(2, 15);
    window[callbackName] = function(data) 
    {
        console.log("Server-Antwort:", data);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${API_URL}?callback=${callbackName}&data=${encodeURIComponent(payload)}`;
    document.body.appendChild(script);
}

// Highscore-Prüfung & Auslösung
function checkAndSendHighScore(newScore)
{
    if (newScore > highScore)
    {
        highScore = newScore;
        localStorage.setItem("golfHighScore", highScore);
        console.log(`Neuer Highscore für ${currentPlayerName}: ${highScore}`);
        sendHighscoreToScorecardApp(currentPlayerName, highScore);
    }
}