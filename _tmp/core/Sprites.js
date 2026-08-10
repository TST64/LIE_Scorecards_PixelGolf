/**
 * Core/Sprites.js
 * Farbpalette & Pixel-Art Rendering
 */

export const ColorPalette = {
    SKY: '#87CEEB',
    GRASS_LIGHT: '#55a846',
    GRASS_DARK: '#3e7a33',
    DIRT: '#6e4a27',
    SAND: '#e2c583',
    WATER: '#3b82f6',
    PLAYER_SHIRT: '#3b82f6',
    PLAYER_SKIN: '#ffdbac',
    PLAYER_PANTS: '#1e293b',
    ZOMBIE_SKIN: '#4d7c0f',
    ZOMBIE_SHIRT: '#7f1d1d',
    GOLD: '#eab308',
    WHITE: '#ffffff',
    BLACK: '#000000',
    RED: '#ef4444'
};

export class SpriteRenderer
{
    constructor(ctx, pixelSize = 4)
    {
        this.ctx = ctx;
        this.pixelSize = pixelSize;
    }

    drawMatrix(matrix, x, y, colorMap)
    {
        matrix.forEach((row, rowIndex) => 
        {
            row.forEach((colorKey, colIndex) => 
            {
                if (colorKey !== 0 && colorMap[colorKey])
                {
                    this.ctx.fillStyle = colorMap[colorKey];
                    this.ctx.fillRect(
                        x + colIndex * this.pixelSize,
                        y + rowIndex * this.pixelSize,
                        this.pixelSize,
                        this.pixelSize
                    );
                }
            });
        });
    }

    drawGolfer(x, y, frame = 0, facingLeft = false)
    {
        const golferMatrix = [
            [0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 2, 2, 2, 0, 0, 0],
            [0, 3, 3, 3, 3, 3, 0, 0],
            [0, 0, 3, 3, 3, 0, 0, 0],
            [0, 0, 4, 0, 4, 0, 0, 0],
            [0, 0, 4, 0, 4, 0, 0, 0]
        ];

        const colorMap = {
            1: ColorPalette.RED,
            2: ColorPalette.PLAYER_SKIN,
            3: ColorPalette.PLAYER_SHIRT,
            4: ColorPalette.PLAYER_PANTS
        };

        this.ctx.save();
        if (facingLeft)
        {
            this.ctx.translate(x + 32, y);
            this.ctx.scale(-1, 1);
            this.drawMatrix(golferMatrix, 0, 0, colorMap);
        }
        else
        {
            this.drawMatrix(golferMatrix, x, y, colorMap);
        }
        this.ctx.restore();
    }

    drawBall(x, y, radius = 3)
    {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = ColorPalette.WHITE;
        this.ctx.fill();
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.closePath();
    }
}