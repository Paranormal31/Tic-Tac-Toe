// DOM Elements
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const themeToggle = document.getElementById('themeToggle');
const player1Input = document.getElementById('player1Name');
const player2Input = document.getElementById('player2Name');
const gameModeSelect = document.getElementById('gameMode');
const historyList = document.getElementById('historyList');

const scoreXText = document.getElementById('scoreX');
const scoreOText = document.getElementById('scoreO');
const scoreDrawText = document.getElementById('scoreDraw');
const labelX = document.getElementById('labelX');
const labelO = document.getElementById('labelO');
const containerX = document.getElementById('scoreXContainer');
const containerO = document.getElementById('scoreOContainer');

// Game State
let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;
let moveHistory = [];
let scores = { X: 0, O: 0, Draw: 0 };
let playerNames = { X: "Player X", O: "Player O" };

// Audio Context for Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'win') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.5); // C6
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'draw') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

// Initialization
function init() {
    loadData();
    updateUI();
    updateTurnIndicator();
}

function loadData() {
    const savedScores = localStorage.getItem('ttt_scores');
    if (savedScores) scores = JSON.parse(savedScores);

    const savedNames = localStorage.getItem('ttt_names');
    if (savedNames) {
        playerNames = JSON.parse(savedNames);
        player1Input.value = playerNames.X;
        player2Input.value = playerNames.O;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = 'Light Mode';
    }
}

function saveData() {
    localStorage.setItem('ttt_scores', JSON.stringify(scores));
    localStorage.setItem('ttt_names', JSON.stringify(playerNames));
}

function updateUI() {
    scoreXText.textContent = scores.X;
    scoreOText.textContent = scores.O;
    scoreDrawText.textContent = scores.Draw;
    labelX.textContent = playerNames.X;
    labelO.textContent = playerNames.O;
}

function updateTurnIndicator() {
    containerX.classList.toggle('active', currentPlayer === 'X' && gameActive);
    containerO.classList.toggle('active', currentPlayer === 'O' && gameActive);
    
    if (gameActive) {
        statusText.textContent = `${playerNames[currentPlayer]}'s turn`;
    }
}

// Event Listeners
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

player1Input.addEventListener('input', (e) => {
    playerNames.X = e.target.value || "Player X";
    updateUI();
    saveData();
    updateTurnIndicator();
});

player2Input.addEventListener('input', (e) => {
    playerNames.O = e.target.value || "Player O";
    updateUI();
    saveData();
    updateTurnIndicator();
});

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== "" || !gameActive) return;

    makeMove(index);

    if (gameActive && gameModeSelect.value !== 'pvp' && currentPlayer === 'O') {
        setTimeout(aiMove, 500);
    }
}

function makeMove(index) {
    board[index] = currentPlayer;
    moveHistory.push(index);
    playSound('click');
    updateBoard();
    updateHistory();
    
    if (checkWinner(board, currentPlayer)) {
        endGame('win');
    } else if (board.every(cell => cell !== "")) {
        endGame('draw');
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateTurnIndicator();
    }
}

function updateBoard() {
    cells.forEach((cell, i) => {
        cell.textContent = board[i];
        cell.className = `cell ${board[i].toLowerCase()}`;
    });
}

function updateHistory() {
    if (moveHistory.length === 0) {
        historyList.innerHTML = '<li class="empty-history">No moves yet</li>';
        return;
    }

    historyList.innerHTML = moveHistory.map((move, i) => {
        const player = i % 2 === 0 ? 'X' : 'O';
        const row = Math.floor(move / 3) + 1;
        const col = (move % 3) + 1;
        return `<li>Move ${i + 1}: ${player} at (${row}, ${col})</li>`;
    }).join('');
    
    historyList.scrollTop = historyList.scrollHeight;
}

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function checkWinner(currentBoard, player) {
    return winningConditions.some(condition => {
        return condition.every(index => currentBoard[index] === player);
    });
}

function getWinningCondition(currentBoard, player) {
    return winningConditions.find(condition => {
        return condition.every(index => currentBoard[index] === player);
    });
}

function endGame(result) {
    gameActive = false;
    if (result === 'win') {
        scores[currentPlayer]++;
        statusText.textContent = `${playerNames[currentPlayer]} Wins!`;
        const winningLine = getWinningCondition(board, currentPlayer);
        winningLine.forEach(index => cells[index].classList.add('winner'));
        playSound('win');
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: currentPlayer === 'X' ? ['#3b82f6', '#ffffff'] : ['#10b981', '#ffffff']
        });
    } else {
        scores.Draw++;
        statusText.textContent = "It's a Draw!";
        playSound('draw');
    }
    updateUI();
    saveData();
    updateTurnIndicator();
}

function undoMove() {
    if (moveHistory.length === 0 || (!gameActive && moveHistory.length === 9 && !board.includes(""))) return;
    
    // If AI is on, undo twice to go back to player's last turn
    const isAiMode = gameModeSelect.value !== 'pvp';
    const steps = (isAiMode && currentPlayer === 'X' && moveHistory.length >= 2) ? 2 : 1;

    for(let i = 0; i < steps; i++) {
        const lastMove = moveHistory.pop();
        if (lastMove !== undefined) {
            board[lastMove] = "";
        }
    }

    currentPlayer = moveHistory.length % 2 === 0 ? "X" : "O";
    gameActive = true;
    updateBoard();
    updateHistory();
    updateTurnIndicator();
    
    // Clear winning styles if any
    cells.forEach(cell => cell.classList.remove('winner'));
}

function restartGame() {
    board = Array(9).fill("");
    currentPlayer = "X";
    gameActive = true;
    moveHistory = [];
    updateBoard();
    updateHistory();
    updateTurnIndicator();
    cells.forEach(cell => cell.classList.remove('winner'));
}

// AI Logic
function aiMove() {
    if (!gameActive) return;
    
    const mode = gameModeSelect.value;
    let move;

    if (mode === 'easy') {
        move = getRandomMove();
    } else {
        move = getBestMove();
    }

    if (move !== null) makeMove(move);
}

function getRandomMove() {
    const availableMoves = board.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            board[i] = "O";
            let score = minimax(board, 0, false);
            board[i] = "";
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

const scoresMap = { O: 10, X: -10, draw: 0 };

function minimax(currentBoard, depth, isMaximizing) {
    if (checkWinner(currentBoard, "O")) return scoresMap.O - depth;
    if (checkWinner(currentBoard, "X")) return scoresMap.X + depth;
    if (currentBoard.every(cell => cell !== "")) return scoresMap.draw;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === "") {
                currentBoard[i] = "O";
                let score = minimax(currentBoard, depth + 1, false);
                currentBoard[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === "") {
                currentBoard[i] = "X";
                let score = minimax(currentBoard, depth + 1, true);
                currentBoard[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', restartGame);
undoBtn.addEventListener('click', undoMove);

init();
