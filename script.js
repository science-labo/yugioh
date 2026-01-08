// ゲームの状態管理
let playerLP = 4000;
let enemyLP = 4000;
let playerHand = [];
let playerField = [];
let enemyField = [];
let turn = 1; // 1: Player, 2: Enemy

// カードデータ（簡易版）
const cardDatabase = [
    { name: "戦士", atk: 1200, def: 1000 },
    { name: "ドラゴン", atk: 2000, def: 1500 },
    { name: "魔法使い", atk: 1600, def: 800 },
    { name: "スライム", atk: 500, def: 2000 },
    { name: "騎士", atk: 1800, def: 1800 }
];

// ユーティリティ: メッセージ表示
function log(msg) {
    document.getElementById('game-message').innerText = msg;
}

// ユーティリティ: LP更新
function updateLP() {
    document.getElementById('player-lp').innerText = playerLP;
    document.getElementById('enemy-lp').innerText = enemyLP;

    if (playerLP <= 0) {
        alert("あなたの負けです...");
        location.reload();
    } else if (enemyLP <= 0) {
        alert("あなたの勝ちです！");
        location.reload();
    }
}

// カード要素を作成する関数
function createCardElement(cardData, isHand = true, index) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <h3>${cardData.name}</h3>
        <div class="stats">
            ATK: ${cardData.atk}<br>
            DEF: ${cardData.def}
        </div>
    `;
    
    // 手札にある場合、クリックで召喚
    if (isHand) {
        div.onclick = () => summonCard(index);
    } 
    // フィールドにある場合、クリックで攻撃（プレイヤー側のみ）
    else if (turn === 1) {
        div.classList.add('summoned');
        div.onclick = () => attack(cardData, div);
    }
    return div;
}

// ドロー機能
function drawCard() {
    if (turn !== 1) return;
    if (playerHand.length >= 5) {
        log("手札がいっぱいです！");
        return;
    }
    
    // ランダムにカードを取得
    const randomCard = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
    playerHand.push(randomCard);
    renderHand();
    log("カードをドローしました。");
}

// 手札の描画
function renderHand() {
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = '';
    playerHand.forEach((card, index) => {
        handDiv.appendChild(createCardElement(card, true, index));
    });
}

// 召喚機能
function summonCard(index) {
    if (playerField.length >= 3) {
        log("フィールドがいっぱいです！");
        return;
    }

    const card = playerHand[index];
    playerHand.splice(index, 1); // 手札から削除
    playerField.push({ ...card, canAttack: true }); // フィールドに追加
    
    renderHand();
    renderField();
    log(`${card.name} を召喚しました！`);
}

// フィールドの描画
function renderField() {
    const pFieldDiv = document.getElementById('player-field');
    pFieldDiv.innerHTML = '';
    playerField.forEach(card => {
        pFieldDiv.appendChild(createCardElement(card, false));
    });

    const eFieldDiv = document.getElementById('enemy-field');
    eFieldDiv.innerHTML = '';
    enemyField.forEach(card => {
        const div = createCardElement(card, false);
        div.onclick = null; // 敵のカードはクリックできない
        eFieldDiv.appendChild(div);
    });
}

// 攻撃機能（シンプル化：直接攻撃か、先頭のモンスターを攻撃）
function attack(attacker, element) {
    if (!attacker.canAttack) {
        log("このモンスターはすでに攻撃しました。");
        return;
    }

    // 敵フィールドにモンスターがいない場合：ダイレクトアタック
    if (enemyField.length === 0) {
        enemyLP -= attacker.atk;
        log(`${attacker.name} のダイレクトアタック！ ${attacker.atk} ダメージ！`);
        // アニメーション用クラス
        element.style.transform = "translateY(-50px)";
        setTimeout(() => element.style.transform = "none", 300);
    } else {
        // 敵がいる場合：一番左の敵を攻撃（簡易ルール）
        const target = enemyField[0];
        log(`${attacker.name} が ${target.name} に攻撃！`);
        
        if (attacker.atk > target.atk) {
            const damage = attacker.atk - target.atk;
            enemyLP -= damage;
            enemyField.shift(); // 敵を破壊
            log(`敵を破壊！ ${damage} ダメージ！`);
        } else if (attacker.atk === target.atk) {
            enemyField.shift(); // 両方破壊
            playerField = playerField.filter(c => c !== attacker);
            log("相打ちです！");
        } else {
            const damage = target.atk - attacker.atk;
            playerLP -= damage;
            playerField = playerField.filter(c => c !== attacker); // 自分が破壊
            log(`返り討ちにあいました... ${damage} ダメージ！`);
        }
    }
    
    attacker.canAttack = false;
    updateLP();
    renderField();
}

// ターン終了
function endTurn() {
    turn = 2; // 敵のターン
    document.getElementById('enemy-message').innerText = "敵のターン...";
    
    // 1秒後に敵が行動
    setTimeout(enemyTurn, 1000);
}

// 敵のAI（簡易版）
function enemyTurn() {
    // 1. 召喚（50%の確率）
    if (enemyField.length < 3) {
        const randomCard = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
        enemyField.push(randomCard);
        renderField();
    }

    // 2. 攻撃
    enemyField.forEach(enemy => {
        // プレイヤーにモンスターがいない場合
        if (playerField.length === 0) {
            playerLP -= enemy.atk;
            log(`敵の ${enemy.name} のダイレクトアタック！`);
        } else {
            // プレイヤーの先頭モンスターを攻撃
            const target = playerField[0];
            if (enemy.atk > target.atk) {
                const damage = enemy.atk - target.atk;
                playerLP -= damage;
                playerField.shift();
                log(`敵が ${target.name} を破壊！`);
            }
        }
    });

    updateLP();
    renderField();

    // ターンをプレイヤーに戻す
    turn = 1;
    // 全モンスターの攻撃権を復活
    playerField.forEach(c => c.canAttack = true);
    document.getElementById('game-message').innerText = "あなたのターンです。";
}

// 初期化
drawCard();
drawCard();
drawCard();
