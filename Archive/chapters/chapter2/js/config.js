// --- GLOBALE SKALIERUNGSWERTE ---
const pixelScale = 5;
const objSize = 8 * pixelScale;

const GAME_STATE = 
{
    START: "START",
    PLAYING: "PLAYING",
    WON: "WON",
    GAMEOVER: "GAMEOVER"
};

let currentState = GAME_STATE.START;

// Spieler-Identifikation
const urlParams = new URLSearchParams(window.location.search);
const currentPlayerName = urlParams.get('player') || "Golfer";

// Mechanik & Balancing
let playerSpeed = 2.5;
let gravity = 0.28;

// Schlag-Power
let swingPower = 0;
const maxSwingPower = 100;
let powerCharging = false;
let powerDirection = 1;

// Chapter II Ressourcen & Timer
let remainingBalls = 50;  // Auf 50 Bälle reduziert
let timeRemaining = 60;   // Auf 60 Sekunden reduziert
let timerInterval = null;

let score = 0;
let highScoreCh2 = localStorage.getItem("golfHighScore_ch2") || 0;

// Highscore-Übertragung an Google Apps Script
function sendHighscoreCh2(playerName, score) 
{
    const API_URL = "https://script.google.com/macros/s/AKfycbz-J5f6pzUF5xRN4CEDU1kNX6bbFf-y922-hTZLrjxiJ_QmgY4WYuSg0IabruTuhprh/exec";
    
    const payload = JSON.stringify({
        action: 'savePixelGolfChapter2Score',
        spielerName: playerName,
        score: parseInt(score) || 0,
        timestamp: new Date().toISOString()
    });

    const callbackName = "gas_ch2_cb_" + Math.random().toString(36).substring(2, 15);
    window[callbackName] = function(data) 
    {
        console.log("Chapter 2 Score gespeichert:", data);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${API_URL}?callback=${callbackName}&data=${encodeURIComponent(payload)}`;
    document.body.appendChild(script);
}

function checkAndSendHighScoreCh2(newScore)
{
    if (newScore > highScoreCh2)
    {
        highScoreCh2 = newScore;
        localStorage.setItem("golfHighScore_ch2", highScoreCh2);
        console.log(`Neuer Chapter 2 Highscore für ${currentPlayerName}: ${highScoreCh2}`);
        sendHighscoreCh2(currentPlayerName, highScoreCh2);
    }
}