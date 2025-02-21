const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const coinsElement = document.getElementById('coins');
const startScreen = document.getElementById('start-screen');

// Canvas setup
canvas.width = Math.min(window.innerWidth * 0.8, 800);
canvas.height = Math.min(window.innerHeight * 0.8, 600);
const scale = canvas.width / 800;

// Game state
let player = { x: 400, y: 500, width: 32, height: 32, vy: 0, speed: 200, jumping: false };
let platforms = [];
let score = 0;
let coins = 0;
let gameRunning = false;
const gravity = 800;
const jumpForce = -400;

// Platform types
const platformTypes = {
    normal: { color: '#fff', effect: null },
    spring: { color: '#00ff00', effect: () => player.vy = -600 },
    broken: { color: '#ff4500', effect: () => setTimeout(() => platforms.splice(platforms.indexOf(p), 1), 100) }
};

// Spawn platform
function spawnPlatform(y = 500) {
    const x = Math.random() * (canvas.width / scale - 100);
    const type = Math.random() < 0.2 ? 'spring' : Math.random() < 0.3 ? 'broken' : 'normal';
    platforms.push({ x, y, width: 100, height: 10, type });
}

// Initialize game
function init() {
    platforms = [];
    player = { x: 400, y: 500, width: 32, height: 32, vy: 0, speed: 200, jumping: false };
    score = 0;
    coins = 0;
    spawnPlatform(500);
    for (let i = 1; i < 5; i++) spawnPlatform(500 - i * 100);
    updateScore();
    updateCoins();
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x * scale, player.y * scale, player.width * scale, player.height * scale);
}

// Draw platform
function drawPlatform(p) {
    ctx.fillStyle = platformTypes[p.type].color;
    ctx.fillRect(p.x * scale, p.y * scale, p.width * scale, p.height * scale);
}

// Update game state
function update(dt) {
    if (!gameRunning) return;

    // Player movement
    player.vy += gravity * dt;
    player.y += player.vy * dt;
    if (keys.ArrowLeft) player.x -= player.speed * dt;
    if (keys.ArrowRight) player.x += player.speed * dt;
    player.x = clamp(player.x, 0, canvas.width / scale - player.width);

    // Platform collision
    platforms.forEach(p => {
        if (player.vy > 0 &&
            player.y + player.height > p.y &&
            player.y + player.height < p.y + p.height + 10 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.jumping = false;
            if (platformTypes[p.type].effect) platformTypes[p.type].effect();
            score += 10;
            updateScore();
        }
    });

    // Screen scrolling
    if (player.y < 200) {
        const offset = 200 - player.y;
        player.y = 200;
        platforms.forEach(p => p.y += offset);
        if (platforms[platforms.length - 1].y > 100) spawnPlatform(platforms[platforms.length - 1].y - 100);
    }

    // Game over
    if (player.y > canvas.height / scale) {
        gameRunning = false;
        startScreen.style.display = 'block';
        canvas.style.display = 'none';
        alert(`Game Over! Score: ${score} Coins: ${coins}`);
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    platforms.forEach(drawPlatform);
}

// Controls
const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
document.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'Space' && !player.jumping && gameRunning) {
        player.vy = jumpForce;
        player.jumping = true;
    }
});
document.addEventListener('keyup', e => {
    if (e.key in keys) keys[e.key] = false;
});

// Start game with mouse click
document.addEventListener('click', (e) => {
    if (!gameRunning) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const distance = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);
        if (distance < 50) { // Click within 50px of center
            startGame();
        }
    }
});

// Utility functions
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
function updateScore() { scoreElement.textContent = score; }
function updateCoins() { coinsElement.textContent = coins; }

// Start game
function startGame() {
    init();
    gameRunning = true;
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    lastTime = performance.now();
    gameLoop(lastTime);
}

// Main loop
let lastTime = 0;
function gameLoop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    update(dt);
    requestAnimationFrame(gameLoop);
}

// Window resize
window.addEventListener('resize', () => {
    canvas.width = Math.min(window.innerWidth * 0.8, 800);
    canvas.height = Math.min(window.innerHeight * 0.8, 600);
    scale = canvas.width / 800;
});