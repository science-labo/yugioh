// カードデータ (画像ファイル名を画像に合わせて変更してください)
const cardDB = [
    { name: "テスラ", atk: 2500, def: 2000, img: "tesla.jpg" },
    { name: "フック", atk: 1200, def: 2400, img: "hooke.jpg" },
    { name: "ニュートン", atk: 3000, def: 2500, img: "newton.jpg" },
    { name: "エジソン", atk: 2100, def: 1800, img: "edison.jpg" },
    { name: "ダーウィン", atk: 1800, def: 2000, img: "darwin.jpg" }
];

let pLP = 4000;
let eLP = 4000;
let pHand = [];
let pField = [];
let eField = [];
let turn = "player";

function draw() {
    if (turn !== "player" || pHand.length >= 5) return;
    const card = {...cardDB[Math.floor(Math.random() * cardDB.length)], pos: "atk"};
    pHand.push(card);
    render();
}

function summon(index, pos) {
    if (pField.length >= 3) return;
    const card = pHand.splice(index, 1)[0];
    card.pos = pos; // "atk" or "def"
    pField.push(card);
    render();
}

function attack(pIndex) {
    if (turn !== "player") return;
    const pCard = pField[pIndex];
    if (pCard.pos === "def") {
        alert("守備表示では攻撃できません！");
        return;
    }

    if (eField.length === 0) {
        eLP -= pCard.atk;
        document.getElementById("msg").innerText = `${pCard.name}の直接攻撃！`;
    } else {
        const eCard = eField[0]; // 簡易的に一番左の敵と戦闘
        if (eCard.pos === "atk") {
            if (pCard.atk > eCard.atk) {
                eLP -= (pCard.atk - eCard.atk);
                eField.splice(0, 1);
                document.getElementById("msg").innerText = "敵モンスターを破壊！";
            } else if (pCard.atk < eCard.atk) {
                pLP -= (eCard.atk - pCard.atk);
                pField.splice(pIndex, 1);
                document.getElementById("msg").innerText = "返り討ちに遭った！";
            }
        } else { // 守備相手
            if (pCard.atk > eCard.def) {
                eField.splice(0, 1);
                document.getElementById("msg").innerText = "守備モンスターを粉砕！";
            } else if (pCard.atk < eCard.def) {
                pLP -= (eCard.def - pCard.atk);
                document.getElementById("msg").innerText = "守備が固くてダメージを受けた！";
            }
        }
    }
    checkWin();
    render();
}

function endTurn() {
    turn = "enemy";
    document.getElementById("msg").innerText = "相手のターン...";
    setTimeout(enemyAction, 1000);
}

function enemyAction() {
    // 敵の簡易AI
    const card = {...cardDB[Math.floor(Math.random() * cardDB.length)], pos: Math.random() > 0.3 ? "atk" : "def"};
    if (eField.length < 3) eField.push(card);
    
    if (pField.length === 0 && card.pos === "atk") {
        pLP -= card.atk;
    }
    
    turn = "player";
    document.getElementById("msg").innerText = "自分のターン！";
    render();
}

function checkWin() {
    if (pLP <= 0) alert("LOSE...");
    if (eLP <= 0) alert("WIN!");
    document.getElementById("player-lp").innerText = pLP;
    document.getElementById("enemy-lp").innerText = eLP;
}

function render() {
    const pHandEl = document.getElementById("player-hand");
    const pFieldEl = document.getElementById("player-field");
    const eFieldEl = document.getElementById("enemy-field");

    pHandEl.innerHTML = pHand.map((c, i) => `
        <div class="card" onclick="summon(${i}, 'atk')">
            <img src="${c.img}">
            <div class="card-info">${c.name}<br>ATK:${c.atk}</div>
        </div>
    `).join("");

    pFieldEl.innerHTML = pField.map((c, i) => `
        <div class="card ${c.pos === 'def' ? 'defense' : ''}" onclick="attack(${i})">
            <img src="${c.img}">
            <div class="card-info">ATK:${c.atk} DEF:${c.def}</div>
        </div>
    `).join("");

    eFieldEl.innerHTML = eField.map((c) => `
        <div class="card ${c.pos === 'def' ? 'defense' : ''}">
            <img src="${c.img}">
            <div class="card-info">ATK:${c.atk} DEF:${c.def}</div>
        </div>
    `).join("");
    
    document.getElementById("player-lp").innerText = pLP;
    document.getElementById("enemy-lp").innerText = eLP;
}
