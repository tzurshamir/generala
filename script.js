// ==========================
// GLOBAL GAME STATE
// ==========================
let players = [];
let currentPlayer = 0;
let dice = [1, 1, 1, 1, 1];
let held = [false, false, false, false, false];
let rollsLeft = 3;
let rolledOnce = false;

const categories = [
    "ones", "twos", "threes", "fours", "fives", "sixes",
    "ladder", "full", "poker", "generala", "doubleGenerala"
];

// ==========================
// SETUP SCREEN
// ==========================
const playerCountSelect = document.getElementById("player-count");
const playerNamesDiv = document.getElementById("player-names");
const startGameBtn = document.getElementById("start-game-btn");

playerCountSelect.onchange = generateNameInputs;
generateNameInputs();

function generateNameInputs() {
    playerNamesDiv.innerHTML = "";
    const count = Number(playerCountSelect.value);
    for (let i = 1; i <= count; i++) {
        playerNamesDiv.innerHTML += `<input id="p${i}" placeholder="Player ${i} name">`;
    }
}

startGameBtn.onclick = () => {
    const count = Number(playerCountSelect.value);
    players = [];

    for (let i = 1; i <= count; i++) {
        const name = document.getElementById("p" + i).value.trim();
        if (!name) return showAlertModal("All players must enter a name.");
        players.push({
            name,
            scores: {
                ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
                ladder: null, full: null, poker: null, generala: null, doubleGenerala: null
            }
        });
    }

    document.getElementById("setup-screen").classList.remove("active");
    document.getElementById("game-screen").classList.add("active");

    buildScoreboard();
    updateTurnBanner();
    renderDice();
};

// ==========================
// SCOREBOARD GENERATION
// ==========================
function buildScoreboard() {
    const header = document.getElementById("score-header");
    const body = document.getElementById("score-body");

    let hRow = "<tr><th>Category</th>";
    players.forEach(p => hRow += `<th>${p.name}</th>`);
    hRow += "</tr>";
    header.innerHTML = hRow;

    body.innerHTML = "";
    categories.forEach(cat => {
        let row = `<tr><td>${formatCat(cat)}</td>`;
        players.forEach((p, i) => {
            row += `<td data-player="${i}" data-cat="${cat}" class="clickable"></td>`;
        });
        row += "</tr>";
        body.innerHTML += row;
    });

    document.querySelectorAll("#score-body td.clickable").forEach(cell => {
        cell.onclick = () => scoreCategory(cell);
    });
}

function formatCat(cat) {
    return {
        ones: "Ones",
        twos: "Twos",
        threes: "Threes",
        fours: "Fours",
        fives: "Fives",
        sixes: "Sixes",
        ladder: "ladder",
        full: "Full House",
        poker: "Poker",
        generala: "Generala",
        doubleGenerala: "Double Generala"
    }[cat];
}

// ==========================
// TURN SYSTEM
// ==========================
const turnBanner = document.getElementById("turn-banner");
function updateTurnBanner() {
    turnBanner.innerHTML = `🎲 ${players[currentPlayer].name}'s Turn`;
}

// ==========================
// DICE FUNCTIONS
// ==========================
const diceDivs = document.querySelectorAll(".die");

diceDivs.forEach(die => {
    die.onclick = () => {
        const i = Number(die.dataset.index);
        if (rollsLeft < 3) {
            held[i] = !held[i];
            renderDice();
        }
    };
});

document.getElementById("roll-btn").onclick = () => {
    if (rollsLeft === 0) return;

    dice.forEach((_, i) => {
        if (!held[i]) dice[i] = Math.floor(Math.random() * 6) + 1;
    });

    rollsLeft--;
    rolledOnce = true;
    document.getElementById("rolls-left").innerText = rollsLeft;

    renderDice(true);
};

// RENDER DICE WITH DOTS
function renderDice(animate = false) {
    const patterns = {
        1: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
        2: [[1, 0, 0], [0, 0, 0], [0, 0, 1]],
        3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        4: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
        5: [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
        6: [[1, 0, 1], [1, 0, 1], [1, 0, 1]]
    };

    diceDivs.forEach((div, i) => {
        div.innerHTML = "";
        div.classList.toggle("held", held[i]);
        div.classList.remove("roll-animate");

        const pat = patterns[dice[i]];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const dot = document.createElement("div");
                dot.classList.add("dot");
                if (pat[r][c] === 0) dot.style.visibility = "hidden";
                div.appendChild(dot);
            }
        }

        if (animate && !held[i]) {
            void div.offsetWidth;
            div.classList.add("roll-animate");
        }
    });
}

// ==========================
// SCORING LOGIC
// ==========================
function scoreCategory(cell) {
    const playerIndex = Number(cell.dataset.player);
    const cat = cell.dataset.cat;

    if (!rolledOnce) return showAlertModal("You must roll at least once before scoring.");
    if (playerIndex !== currentPlayer) return showAlertModal("It's not your turn!");
    if (players[playerIndex].scores[cat] !== null) return showAlertModal("You already scored this category.");

    const score = calculateScore(cat);

    if (score === 0) {
        showConfirmModal(`Are you sure you want to put 0 on ${formatCat(cat)}?`, () => setScore(cell, score));
    } else {
        setScore(cell, score);
    }
}

function calculateScore(cat) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);

    switch (cat) {
        case "ones": return (counts[1] || 0) * 1;
        case "twos": return (counts[2] || 0) * 2;
        case "threes": return (counts[3] || 0) * 3;
        case "fours": return (counts[4] || 0) * 4;
        case "fives": return (counts[5] || 0) * 5;
        case "sixes": return (counts[6] || 0) * 6;
        case "ladder":
            const s = [...new Set(dice)].sort((a, b) => a - b).join("");
            return (s === "12345" || s === "23456") ? 25 : 0;
        case "full":
            return Object.values(counts).includes(3) && Object.values(counts).includes(2) ? 30 : 0;
        case "poker":
            return Object.values(counts).includes(4) ? 40 : 0;
        case "generala":
            return Object.values(counts).includes(5) ? 50 : 0;
        case "doubleGenerala":
            return Object.values(counts).includes(5) ? 60 : 0;
        default: return 0;
    }
}

function setScore(cell, score) {
    const playerIndex = Number(cell.dataset.player);
    const cat = cell.dataset.cat;
    players[playerIndex].scores[cat] = score;
    cell.innerText = score;
    cell.classList.add("filled");

    nextTurn();
}

// ==========================
// TURN ADVANCING
// ==========================
function nextTurn() {
    dice = [1, 1, 1, 1, 1];
    held = [false, false, false, false, false];
    rollsLeft = 3;
    rolledOnce = false;

    currentPlayer++;
    if (currentPlayer >= players.length) currentPlayer = 0;

    if (isGameOver()) endGame();
    else {
        updateTurnBanner();
        document.getElementById("rolls-left").innerText = rollsLeft;
        renderDice();

        showNextTurnAnimation(players[currentPlayer].name);
    }
}

function isGameOver() {
    return players.every(p =>
        Object.values(p.scores).every(v => v !== null)
    );
}

// ==========================
// END GAME
// ==========================
function endGame() {
    document.getElementById("game-screen").classList.remove("active");
    document.getElementById("end-screen").classList.add("active");

    let best = null;
    let bestScore = -1;
    players.forEach(p => {
        const total = Object.values(p.scores).reduce((a, b) => a + b, 0);
        if (total > bestScore) {
            bestScore = total;
            best = p.name;
        }
    });

    document.getElementById("winner").innerHTML = `<h1>🏆 ${best} wins with ${bestScore} points!</h1>`;
}

// ==========================
// NEXT TURN ANIMATION
// ==========================
function showNextTurnAnimation(name) {
    const anim = document.createElement("div");
    anim.innerText = `${name}'s Turn!`;
    anim.style.position = "fixed";
    anim.style.top = "40%";
    anim.style.left = "50%";
    anim.style.transform = "translate(-50%, -50%)";
    anim.style.fontSize = "48px";
    anim.style.fontWeight = "bold";
    anim.style.color = "#00e676";
    anim.style.textShadow = "2px 2px 10px #000";
    anim.style.zIndex = 999;
    anim.style.opacity = 0;
    anim.style.transition = "all 1s ease";

    document.body.appendChild(anim);

    setTimeout(() => anim.style.opacity = 1, 50);
    setTimeout(() => {
        anim.style.opacity = 0;
        setTimeout(() => document.body.removeChild(anim), 1100);
    }, 2000);
}

// ==========================
// MODALS
// ==========================
function showAlertModal(msg) {
    const modal = document.getElementById("custom-modal");
    modal.querySelector("#modal-text").innerText = msg;
    modal.classList.add("show");

    const noBtn = modal.querySelector("#confirm-no");
    const yesBtn = modal.querySelector("#confirm-yes");

    // Hide the "No" button and set the "Yes" button text to "OK" for simple alerts
    noBtn.style.display = "none";
    yesBtn.innerText = "OK";

    yesBtn.onclick = () => {
        modal.classList.remove("show");
    };
}

function showConfirmModal(msg, onConfirm) {
    const modal = document.getElementById("custom-modal");
    modal.querySelector("#modal-text").innerText = msg;
    modal.classList.add("show");

    const yesBtn = modal.querySelector("#confirm-yes");
    const noBtn = modal.querySelector("#confirm-no");

    // Check if the message contains the specific prompt about putting 0 (Double Generala)
    if (msg.includes("Are you sure you want to put 0")) {
        // Show YES/NO buttons for the "0" confirmation message
        yesBtn.innerText = "Yes";
        noBtn.style.display = "inline-block"; // Show "No"

        yesBtn.onclick = () => {
            onConfirm(); // Trigger the callback function (set 0)
            modal.classList.remove("show");
        };

        noBtn.onclick = () => {
            modal.classList.remove("show");
        };
    } else {
        // For other messages, hide "No" button and show "OK" only
        noBtn.style.display = "none";
        yesBtn.innerText = "OK";
        yesBtn.onclick = () => {
            modal.classList.remove("show");
        };
    }
}
