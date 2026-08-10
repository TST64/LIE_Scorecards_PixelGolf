/**
 * Core/ApiBridge.js
 * Apps Script Anbindung (Google Sheets Backend)
 */

export class ApiBridge
{
    constructor(baseUrl)
    {
        this.baseUrl = baseUrl || window.GAS_WEB_APP_URL || '';
    }

    getPlayerNameFromUrl()
    {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('player') || urlParams.get('name') || 'Gast';
    }

    async submitScore(playerName, score, mode = 'runner')
    {
        if (!this.baseUrl)
        {
            console.warn('ApiBridge: Keine WebApp-URL definiert.');
            return { status: 'success', simulated: true };
        }

        const payload = {
            action: 'savePixelGolfHighscore',
            playerName: playerName || this.getPlayerNameFromUrl(),
            score: score,
            mode: mode,
            timestamp: new Date().toISOString()
        };

        try
        {
            const queryParams = new URLSearchParams(payload).toString();
            const response = await fetch(`${this.baseUrl}?${queryParams}`, {
                method: 'GET',
                mode: 'no-cors'
            });

            return { status: 'submitted', payload };
        }
        catch (error)
        {
            console.error('ApiBridge Error:', error);
            throw error;
        }
    }
}