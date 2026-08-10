/**
 * Core/InputController.js
 * Cross-Platform Eingaben (Keyboard & Touch/Mouse)
 */

export class InputController
{
    constructor(canvasElement)
    {
        this.canvas = canvasElement;
        
        this.actions = {
            action: false,
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.justPressed = {
            action: false
        };

        this.pointer = {
            x: 0,
            y: 0,
            isDown: false
        };

        this.bindEvents();
    }

    bindEvents()
    {
        window.addEventListener('keydown', (e) => 
        {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')
            {
                if (!this.actions.action)
                {
                    this.justPressed.action = true;
                }
                this.actions.action = true;
                this.actions.up = true;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS')
            {
                this.actions.down = true;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA')
            {
                this.actions.left = true;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD')
            {
                this.actions.right = true;
            }
        });

        window.addEventListener('keyup', (e) => 
        {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')
            {
                this.actions.action = false;
                this.actions.up = false;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS')
            {
                this.actions.down = false;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA')
            {
                this.actions.left = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD')
            {
                this.actions.right = false;
            }
        });

        const updatePointerPos = (clientX, clientY) => 
        {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.pointer.x = (clientX - rect.left) * scaleX;
            this.pointer.y = (clientY - rect.top) * scaleY;
        };

        this.canvas.addEventListener('pointerdown', (e) => 
        {
            updatePointerPos(e.clientX, e.clientY);
            this.pointer.isDown = true;
            if (!this.actions.action)
            {
                this.justPressed.action = true;
            }
            this.actions.action = true;
        });

        window.addEventListener('pointermove', (e) => 
        {
            if (this.pointer.isDown)
            {
                updatePointerPos(e.clientX, e.clientY);
            }
        });

        window.addEventListener('pointerup', () => 
        {
            this.pointer.isDown = false;
            this.actions.action = false;
        });
    }

    update()
    {
        this.justPressed.action = false;
    }
}