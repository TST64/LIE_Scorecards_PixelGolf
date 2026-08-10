/**
 * Core/Engine.js
 * Canvas Scaling, Game Loop & State Management
 */

export class GameEngine
{
    constructor(canvasId, targetWidth = 800, targetHeight = 450)
    {
        this.canvas = document.getElementById(canvasId);

        if (!this.canvas)
        {
            console.error(`[GameEngine] Canvas element with ID '${canvasId}' was not found in DOM!`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        
        this.virtualWidth = targetWidth;
        this.virtualHeight = targetHeight;
        
        this.isRunning = false;
        this.lastTime = 0;
        this.currentLevel = null;
        this.input = null;
        this.api = null;
        this.sound = null;
        
        this.state = 'MENU';
        this.lastScore = 0;

        this.initCanvas();
    }

    initCanvas()
    {
        this.ctx.imageSmoothingEnabled = false;
        this.resizeCanvas();
        window.addEventListener('resize', () => 
        {
            this.resizeCanvas();
        });
    }

    resizeCanvas()
    {
        const container = this.canvas.parentElement || document.body;
        const scale = Math.min(
            (container.clientWidth || window.innerWidth) / this.virtualWidth,
            (container.clientHeight || window.innerHeight) / this.virtualHeight
        );

        this.canvas.width = this.virtualWidth;
        this.canvas.height = this.virtualHeight;
        this.canvas.style.width = `${Math.floor(this.virtualWidth * scale)}px`;
        this.canvas.style.height = `${Math.floor(this.virtualHeight * scale)}px`;
        this.ctx.imageSmoothingEnabled = false;
    }

    bindDependencies(inputController, apiBridge, soundEngine)
    {
        this.input = inputController;
        this.api = apiBridge;
        this.sound = soundEngine;
    }

    setLevel(levelInstance)
    {
        this.currentLevel = levelInstance;
        if (this.currentLevel)
        {
            this.currentLevel.init(this, this.input, this.sound);
        }
    }

    setState(newState)
    {
        this.state = newState;
    }

    triggerGameOver(finalScore, levelName)
    {
        this.lastScore = finalScore;
        this.state = 'GAMEOVER';

        if (this.api)
        {
            const playerName = this.api.getPlayerNameFromUrl();
            this.api.submitScore(playerName, finalScore, levelName);
        }
    }

    restartCurrentLevel()
    {
        if (this.currentLevel)
        {
            this.currentLevel.reset();
            this.state = 'PLAYING';
        }
    }

    start()
    {
        if (this.isRunning)
        {
            return;
        }
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => 
        {
            this.loop(t);
        });
    }

    loop(timestamp)
    {
        if (!this.isRunning)
        {
            return;
        }

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (this.state === 'GAMEOVER' && this.input && this.input.justPressed.action)
        {
            this.restartCurrentLevel();
        }

        if (this.state === 'PLAYING' && this.currentLevel)
        {
            this.currentLevel.update(dt);
        }

        this.render();

        if (this.input)
        {
            this.input.update();
        }

        requestAnimationFrame((t) => 
        {
            this.loop(t);
        });
    }

    render()
    {
        this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

        if (this.currentLevel)
        {
            this.currentLevel.render(this.ctx);
        }

        if (this.state === 'GAMEOVER')
        {
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.virtualWidth / 2, this.virtualHeight / 2 - 20);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '18px sans-serif';
            this.ctx.fillText(`Score: ${this.lastScore}`, this.virtualWidth / 2, this.virtualHeight / 2 + 15);

            this.ctx.fillStyle = '#eab308';
            this.ctx.font = '14px sans-serif';
            this.ctx.fillText('Tippen oder Leertaste für Neustart', this.virtualWidth / 2, this.virtualHeight / 2 + 50);
        }
    }
}