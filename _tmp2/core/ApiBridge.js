/**
 * Core/ApiBridge.js
 * Apps Script Anbindung für Google Sheets Backend & Highscores
 */

export class ApiBridge
{
    constructor(baseUrl)
    {
        this.baseUrl = baseUrl || window.GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbz-J5f6pzUF5xRN4CEDU1kNX6bbFf-y922-hTZLrjxiJ_QmgY4WYuSg0IabruTuhprh/exec";
    }

    getPlayerNameFromUrl()
    {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('player') || urlParams.get('spielerName') || 'Golfer';
    }

    submitScore(playerName, score, mode = 'runner')
    {
        if (!this.baseUrl)
        {
            console.warn('ApiBridge: Keine WebApp-URL definiert.');
            return;
        }

        const actionName = (mode === 'siege') ? 'savePixelGolfChapter2Score' : 'savePixelGolfHighscore';
        const finalPlayerName = playerName || this.getPlayerNameFromUrl();

        const payload = JSON.stringify({
            action: actionName,
            spielerName: finalPlayerName,
            score: parseInt(score) || 0,
            timestamp: new Date().toISOString()
        });

        // JSONP Callback Handler für Google Apps Script
        const callbackName = "gas_cb_" + Math.random().toString(36).substring(2, 15);
        window[callbackName] = (data) => 
        {
            console.log("Highscore Server-Antwort:", data);
            delete window[callbackName];
        };

        const script = document.createElement("script");
        script.src = `${this.baseUrl}?callback=${callbackName}&data=${encodeURIComponent(payload)}`;
        document.body.appendChild(script);
    }
}