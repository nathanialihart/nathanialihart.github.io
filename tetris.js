class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('preview');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highscore');
        
        this.ROWS = 20;
        this.COLS = 12;
        this.BLOCK_SIZE = 20;
        
        this.grid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore') || '0');
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameOver = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.pieces = [
            {
                shape: [[1, 1, 1, 1]],
                color: '#00FFFF'
            },
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#FFFF00'
            },
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#800080'
            },
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00FF00'
            },
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#FF0000'
            },
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000FF'
            },
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#FFA500'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.highScoreElement.textContent = this.highScore;
        this.nextPiece = this.createPiece();
        this.spawnPiece();
        this.setupControls();
        this.lastTime = 0;
        this.gameLoop(0);
        this.draw();
        this.drawPreview();
    }
    
    createPiece() {
        const pieceType = Math.floor(Math.random() * this.pieces.length);
        const piece = {
            ...this.pieces[pieceType],
            x: Math.floor(this.COLS / 2) - 1,
            y: 0
        };
        return piece;
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('tetrisHighScore', this.highScore.toString());
                this.highScoreElement.textContent = this.highScore;
            }
        }
    }
    
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece || this.gameOver) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece || this.gameOver) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    
                    if (y >= 0) {
                        this.grid[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                this.grid.splice(row, 1);
                this.grid.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] || 800;
            this.scoreElement.textContent = this.score;
            this.dropInterval = Math.max(100, this.dropInterval - 10);
        }
    }
    
    drop() {
        if (!this.movePiece(0, 1)) {
            this.lockPiece();
        }
    }
    
    hardDrop() {
        if (!this.currentPiece || this.gameOver) return;
        
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
    }
    
    draw() {
        this.ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#333333' : '#cccccc';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row <= this.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= this.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(col * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.grid[row][col]) {
                    this.ctx.fillStyle = this.grid[row][col];
                    this.ctx.fillRect(
                        col * this.BLOCK_SIZE + 1,
                        row * this.BLOCK_SIZE + 1,
                        this.BLOCK_SIZE - 2,
                        this.BLOCK_SIZE - 2
                    );
                }
            }
        }
        
        if (this.currentPiece && !this.gameOver) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const x = (this.currentPiece.x + col) * this.BLOCK_SIZE;
                        const y = (this.currentPiece.y + row) * this.BLOCK_SIZE;
                        this.ctx.fillRect(x + 1, y + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
                    }
                }
            }
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
            this.ctx.font = '24px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
    
    drawPreview() {
        this.previewCtx.fillStyle = document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        if (this.nextPiece) {
            const pieceSize = 15;
            const offsetX = (this.previewCanvas.width - this.nextPiece.shape[0].length * pieceSize) / 2;
            const offsetY = (this.previewCanvas.height - this.nextPiece.shape.length * pieceSize) / 2;
            
            this.previewCtx.fillStyle = this.nextPiece.color;
            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        this.previewCtx.fillRect(
                            offsetX + col * pieceSize,
                            offsetY + row * pieceSize,
                            pieceSize - 1,
                            pieceSize - 1
                        );
                    }
                }
            }
        }
    }
    
    gameLoop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.gameOver) {
            this.dropTime += deltaTime;
            if (this.dropTime > this.dropInterval) {
                this.drop();
                this.dropTime = 0;
            }
        }
        
        this.draw();
        this.drawPreview();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    restart() {
        this.grid = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.gameOver = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.nextPiece = this.createPiece();
        this.spawnPiece();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.drop();
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });
        
        document.getElementById('left').addEventListener('click', () => {
            this.movePiece(-1, 0);
        });
        
        document.getElementById('right').addEventListener('click', () => {
            this.movePiece(1, 0);
        });
        
        document.getElementById('down').addEventListener('click', () => {
            this.drop();
        });
        
        document.getElementById('rotate').addEventListener('click', () => {
            this.rotatePiece();
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) {
                this.restart();
            }
        });
        
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameOver) {
                this.restart();
                return;
            }
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 30) {
                    this.movePiece(1, 0);
                } else if (deltaX < -30) {
                    this.movePiece(-1, 0);
                }
            } else {
                if (deltaY > 30) {
                    this.drop();
                } else if (deltaY < -30) {
                    this.rotatePiece();
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Tetris();
    });
} else {
    new Tetris();
}
