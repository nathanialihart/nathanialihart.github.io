class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('preview');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highscore');
        
        if (!this.canvas || !this.previewCanvas || !this.scoreElement || !this.highScoreElement) {
            console.error('Tetris game elements not found');
            return;
        }
        
        this.canvas.style.imageRendering = 'pixelated';
        this.previewCanvas.style.imageRendering = 'pixelated';
        
        this.BLOCK_SIZE = 20;
        this.BOARD_WIDTH = 12;
        this.BOARD_HEIGHT = 20;
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
        this.gameRunning = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.pieces = {
            I: { shape: [[1,1,1,1]], color: '#00f5ff' },
            O: { shape: [[1,1],[1,1]], color: '#ffff00' },
            T: { shape: [[0,1,0],[1,1,1]], color: '#800080' },
            S: { shape: [[0,1,1],[1,1,0]], color: '#00ff00' },
            Z: { shape: [[1,1,0],[0,1,1]], color: '#ff0000' },
            J: { shape: [[1,0,0],[1,1,1]], color: '#0000ff' },
            L: { shape: [[0,0,1],[1,1,1]], color: '#ffa500' }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.init();
    }
    
    init() {
        this.updateHighScore();
        this.spawnPiece();
        this.spawnNextPiece();
        this.addEventListeners();
        this.gameLoop();
    }
    
    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case 'Space':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
            }
        });
        
        document.getElementById('left').addEventListener('click', () => {
            if (this.gameRunning) this.movePiece(-1, 0);
        });
        
        document.getElementById('right').addEventListener('click', () => {
            if (this.gameRunning) this.movePiece(1, 0);
        });
        
        document.getElementById('down').addEventListener('click', () => {
            if (this.gameRunning) this.movePiece(0, 1);
        });
        
        document.getElementById('rotate').addEventListener('click', () => {
            if (this.gameRunning) this.rotatePiece();
        });
        
        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning) this.restart();
        });
        
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) {
                this.restart();
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 30) this.movePiece(1, 0);
                else if (deltaX < -30) this.movePiece(-1, 0);
            } else {
                if (deltaY > 30) this.movePiece(0, 1);
                else if (deltaY < -30) this.rotatePiece();
            }
        });
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
            this.currentPiece = {
                type: type,
                shape: this.pieces[type].shape,
                color: this.pieces[type].color,
                x: Math.floor(this.BOARD_WIDTH / 2) - 1,
                y: 0
            };
        }
        
        this.spawnNextPiece();
        
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver();
        } else {
            this.gameRunning = true;
        }
    }
    
    spawnNextPiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        this.nextPiece = {
            type: type,
            shape: this.pieces[type].shape,
            color: this.pieces[type].color,
            x: Math.floor(this.BOARD_WIDTH / 2) - 1,
            y: 0
        };
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    const boardX = this.currentPiece.x + col;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * linesCleared;
            this.updateScore();
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
            this.updateHighScore();
        }
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    gameOver() {
        this.gameRunning = false;
    }
    
    restart() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.updateScore();
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropTime = 0;
        this.spawnPiece();
        this.spawnNextPiece();
    }
    
    gameLoop(timestamp = 0) {
        if (this.gameRunning) {
            if (timestamp - this.dropTime > this.dropInterval) {
                this.movePiece(0, 1);
                this.dropTime = timestamp;
            }
        }
        
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    draw() {
        this.ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(col * this.BLOCK_SIZE, row * this.BLOCK_SIZE, 
                                    this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
                }
            }
        }
        
        if (this.currentPiece && this.gameRunning) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const x = (this.currentPiece.x + col) * this.BLOCK_SIZE;
                        const y = (this.currentPiece.y + row) * this.BLOCK_SIZE;
                        this.ctx.fillRect(x, y, this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
                    }
                }
            }
        }
        
        if (!this.gameRunning && this.currentPiece) {
            this.ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
            this.ctx.font = '24px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 10);
            this.ctx.font = '16px Inter';
            this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
        
        this.drawPreview();
    }
    
    drawPreview() {
        this.previewCtx.fillStyle = document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        if (this.nextPiece) {
            const pieceWidth = this.nextPiece.shape[0].length * this.BLOCK_SIZE;
            const pieceHeight = this.nextPiece.shape.length * this.BLOCK_SIZE;
            const offsetX = (this.previewCanvas.width - pieceWidth) / 2;
            const offsetY = (this.previewCanvas.height - pieceHeight) / 2;
            
            this.previewCtx.fillStyle = this.nextPiece.color;
            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        const x = offsetX + col * this.BLOCK_SIZE;
                        const y = offsetY + row * this.BLOCK_SIZE;
                        this.previewCtx.fillRect(x, y, this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
                    }
                }
            }
        }
    }
}

function initTetris() {
    const canvas = document.getElementById('tetris');
    const previewCanvas = document.getElementById('preview');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highscore');
    
    if (canvas && previewCanvas && scoreElement && highScoreElement) {
        console.log('Tetris game initializing...');
        new Tetris();
        console.log('Tetris game started successfully');
    } else {
        console.log('Waiting for Tetris elements to load...');
        setTimeout(initTetris, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTetris);
} else {
    initTetris();
}
