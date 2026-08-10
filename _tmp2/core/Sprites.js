/**
 * Core/Sprites.js
 * Pixel-Art Rendering & Shared Sprite Matrices
 */

export const ColorPalette = {
    1: "#ffccaa",  // Skin color
    2: "#0055aa",  // Blue (Shirt)
    3: "#222222",  // Black (Shoes/Club/Zombies)
    4: "#dddddd",  // Light Grey
    5: "#ff0000",  // Red (Flag)
    6: "#555555",  // Dark Green/Brown (Trees/Bunkers)
    7: "#ffffff",  // White (Cart, Clouds, Golfballs)
    8: "#ffaa00",  // Yellow (Beak/Accents)
    9: "#e0c068",  // Sand Yellow
    10: "#1e90ff", // Water Blue
    11: "#ffeaa7", // Star Yellow / Ball Cream
    12: "#2ecc71", // Item Green / Fairway Grass
    13: "#ff7675", // Item Red (Health Heart)
    14: "#8e44ad", // Purple/Dark Red (Clubhouse Roof)
    15: "#d35400", // Brown (Wood/Clubhouse Wall)
    16: "#f1c40f", // Yellow (Lit Windows / Powerbar)
    17: "#2c3e50", // Dark Grey (Door)
    18: "#27ae60", // Zombie Green
    19: "#c0392b", // Zombie Shirt / Blood Red
    20: "#7f8c8d", // Wall Grey
    21: "#95a5a6", // Mortar Grey
    22: "#546e7a", // Dark Wall Grey (Shadows/Cracks)
    23: "#1b5e20"  // Moss Green
};

// --- GOLFER SPRITES ---
export const golferAddressFrame = [
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,2,2,2,2,0,0],
    [0,2,2,2,2,2,0,0],
    [0,0,2,2,2,2,3,0],
    [0,0,0,2,2,0,3,0],
    [0,0,0,1,1,0,3,0],
    [0,0,3,3,3,3,3,3]
];

export const golferBackswingFrame = [
    [0,3,3,1,1,0,0,0],
    [0,0,3,1,1,0,0,0],
    [0,0,3,2,2,2,0,0],
    [0,0,3,2,2,2,0,0],
    [0,0,0,2,2,2,0,0],
    [0,0,0,2,2,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,3,3,3,3,0,0]
];

export const golferFollowThroughFrame = [
    [0,0,0,1,1,3,3,0],
    [0,0,0,1,1,3,0,0],
    [0,0,2,2,2,3,0,0],
    [0,2,2,2,2,3,0,0],
    [0,0,2,2,2,0,0,0],
    [0,0,0,2,2,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,3,3,3,3,0,0]
];

// --- ZOMBIE SPRITES ---
export const zombieFrame1 = [
    [0,0,18,18,18,18,0,0],
    [0,18,7,18,18,7,18,0],
    [0,0,18,7,7,18,0,0],
    [0,19,19,19,19,19,19,0],
    [18,18,19,19,19,19,18,18],
    [0,0,3,3,3,3,0,0],
    [0,0,3,0,0,3,0,0],
    [0,3,3,0,0,3,3,0]
];

export const zombieFrame2 = [
    [0,0,18,18,18,18,0,0],
    [0,18,7,18,18,7,18,0],
    [0,0,18,7,7,18,0,0],
    [0,19,19,19,19,19,19,0],
    [0,18,19,19,19,19,18,0],
    [0,0,3,3,3,3,0,0],
    [0,0,0,3,3,0,0,0],
    [0,0,3,3,3,3,0,0]
];

// --- WALL BLOCKS ---
export const wallBlockFrame1 = [
    [20,20,20,20,20,20,20,21],
    [20,20,20,20,20,20,20,21],
    [21,21,21,21,21,21,21,21],
    [20,20,20,21,20,20,20,20],
    [20,20,20,21,20,20,20,20],
    [21,21,21,21,21,21,21,21],
    [20,21,20,20,20,20,20,20],
    [21,21,21,21,21,21,21,21]
];

export const wallBlockFrame2 = [
    [20,20,22,20,20,20,20,21],
    [20,20,20,22,20,20,20,21],
    [21,21,21,21,22,21,21,21],
    [20,20,20,21,22,20,20,20],
    [20,22,20,21,20,22,20,20],
    [21,21,22,21,21,21,22,21],
    [20,21,20,22,20,20,20,20],
    [21,21,21,21,21,21,21,21]
];

export const wallBlockFrame3 = [
    [23,23,20,20,20,20,20,21],
    [23,20,20,20,20,20,20,21],
    [21,21,21,21,21,21,21,21],
    [20,20,20,21,20,20,20,20],
    [20,20,20,21,20,20,23,23],
    [21,21,21,21,21,23,23,21],
    [20,21,20,20,20,20,20,20],
    [21,21,21,21,21,21,21,21]
];

// --- CLUBHOUSE ---
export const clubhouseBuildingFrame = [
    [0,0,0,0,0,0,14,14,14,14,0,0,0,0,0,0],
    [0,0,0,0,0,14,14,14,14,14,14,0,0,0,0,0],
    [0,0,0,0,14,14,14,14,14,14,14,14,0,0,0,0],
    [0,0,0,14,14,14,14,14,14,14,14,14,14,0,0,0],
    [0,0,14,14,14,14,14,14,14,14,14,14,14,14,0,0],
    [0,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0],
    [0,15,16,16,15,15,15,15,15,15,15,15,16,16,15,0],
    [0,15,16,16,15,15,15,17,17,15,15,15,16,16,15,0],
    [0,15,15,15,15,15,15,17,17,15,15,15,15,15,15,0],
    [0,15,16,16,15,15,15,17,17,15,15,15,16,16,15,0],
    [0,15,16,16,15,15,15,17,17,15,15,15,16,16,15,0],
    [15,15,15,15,15,15,15,17,17,15,15,15,15,15,15,15]
];

export class SpriteRenderer
{
    constructor(ctx, pixelSize = 5)
    {
        this.ctx = ctx;
        this.pixelSize = pixelSize;
    }

    drawMatrix(matrix, x, y)
    {
        for (let row = 0; row < matrix.length; row++)
        {
            for (let col = 0; col < matrix[row].length; col++)
            {
                const colorIndex = matrix[row][col];
                if (colorIndex !== 0 && ColorPalette[colorIndex])
                {
                    this.ctx.fillStyle = ColorPalette[colorIndex];
                    this.ctx.fillRect(
                        x + (col * this.pixelSize),
                        y + (row * this.pixelSize),
                        this.pixelSize,
                        this.pixelSize
                    );
                }
            }
        }
    }

    drawGolfer(x, y, pose = "address")
    {
        let frame = golferAddressFrame;
        if (pose === "backswing") frame = golferBackswingFrame;
        if (pose === "follow") frame = golferFollowThroughFrame;

        this.drawMatrix(frame, x, y);
    }

    drawZombie(x, y, frameIndex = 0)
    {
        const frame = (frameIndex === 0) ? zombieFrame1 : zombieFrame2;
        this.drawMatrix(frame, x, y);
    }

    drawWallBlock(x, y, variant = 1)
    {
        let frame = wallBlockFrame1;
        if (variant === 2) frame = wallBlockFrame2;
        if (variant === 3) frame = wallBlockFrame3;

        this.drawMatrix(frame, x, y);
    }

    drawClubhouse(x, y)
    {
        this.drawMatrix(clubhouseBuildingFrame, x, y);
    }
}