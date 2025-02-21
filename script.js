const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

context.scale(20, 20);
nextContext.scale(20, 20);

const colors = [
    null,
    '#ff69b4', // Pink
    '#ffb6c1', // Light Pink
    '#ff1493', // Deep Pink
    '#db7093', // Pale Violet Red
    '#c71585', // Medium Violet Red
    '#ff00ff', // Magenta
    '#ff99cc'  // Pastel Pink
];

const pieces = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
];

let board = Array(20).fill().map(() => Array(12).fill(0));
let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let player = {};

function createPiece() {
    const typeId = Math.floor(Math.random() * pieces.length) + 1;
    return {
        pos: {x: 5, y: 0},
        matrix: pieces[typeId - 1],
        color: typeId
    };
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = player.color;
            }
        });
    });
}

function collide() {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide()) {
        player.pos.y--;
        merge();
        playerReset();
        sweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide()) {
        player.pos.x -= dir;
    }
}

function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir = 1) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerReset() {
    player = Object.assign({}, nextPiece);
    nextPiece = createPiece();
    if (collide()) {
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
    }
}

function sweep() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        board.splice(y, 1);
        board.unshift(Array(12).fill(0));
        rowCount++;
        y++;
    }
    score += rowCount * 10;
    updateScore();
}

function updateScore() {
    scoreElement.textContent = score;
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width/20, canvas.height/20);
    drawMatrix(board, {x: 0, y: 0}, context);
    drawMatrix(player.matrix, player.pos, context);
    nextContext.fillStyle = '#fff';
    nextContext.fillRect(0, 0, nextCanvas.width/20, nextCanvas.height/20);
    drawMatrix(nextPiece.matrix, {x: 1, y: 1}, nextContext);
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') playerMove(-1);
    else if (event.key === 'ArrowRight') playerMove(1);
    else if (event.key === 'ArrowDown') playerDrop();
    else if (event.key === 'ArrowUp') playerRotate();
});

let nextPiece = createPiece();
startBtn.addEventListener('click', () => {
    if (!player.matrix) {
        player = createPiece();
        update();
    }
});