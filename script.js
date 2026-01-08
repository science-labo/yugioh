// ゲームの状態管理
let playerLP = 4000;
let enemyLP = 4000;
let playerHand = [];
let playerField = [null, null, null, null, null]; // 5スロット
let enemyField = [null, null, null, null, null]; // 5スロット
let playerDeck = [];
let enemyDeck = [];
let turn = 1; // 1: Player, 2: Enemy
let selectedPlayerCardIndex = -1; // 選択中のプレイヤーフィールドカードのインデックス
let summonedThisTurn = false; // 今ターン召喚したか

// カードデータ（画像URLを追加）
const cardDatabase = [
    { id: 1, name: "ロバート・フック", atk: 1200, def: 1000, imageUrl: "images/robert_hooke.png", effect: "生命の観察者" },
    { id: 2, name: "ニコラ・テスラ", atk: 2000, def: 1500, imageUrl: "images/nikola_tesla.png", effect: "電磁界の魔術師" },
    { id: 3, name: "ドミトリ・メンデレーエフ", atk: 1600, def: 1800, imageUrl: "images/dmitri_mendeleev.png", effect: "元素の秩序" },
    { id: 4, name: "チャールズ・ダーウィン", atk: 1500, def: 1200, imageUrl: "images/charles_darwin.png", effect: "進化論の提唱者" },
    { id: 5, name: "トーマス・エジソン", atk: 1800, def: 1300, imageUrl: "images/thomas_edison.png", effect: "発明王" },
    { id: 6, name: "アイザック・ニュートン", atk: 2200, def: 1600, imageUrl: "images/isaac_newton.png", effect: "万有引力の発見者" },
    { id: 7, name: "アンドレ・アンペール", atk: 1700, def: 1100, imageUrl: "images/andre_ampere.png", effect: "電流の法則" },
    { id: 8, name: "アメデオ・アボガドロ", atk: 1000, def: 2000, imageUrl: "images/amedeo_avogadro.png", effect: "分子論の基礎" },
    { id: 9, name: "ジョン・ドルトン", atk: 1400, def: 1700, imageUrl: "images/john_dalton.png", effect: "原子論の父" },
    { id: 10, name: "グレゴール・メンデル", atk: 1300, def: 1400, imageUrl: "images/gregor_mendel.png", effect: "遺伝学の祖" }
];

// 初期デッキ構築（全てのカードを2枚ずつ）
function initializeDecks() {
    playerDeck = [];
    enemyDeck = [];
    for (let i = 0; i < 2; i++) {
        cardDatabase.forEach(card => {
            playerDeck.push({ ...card });
            enemyDeck.push({ ...card });
        });
    }
    // デッキをシャッフル
    playerDeck = shuffleArray(playerDeck);
    enemyDeck = shuffleArray(enemyDeck);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ユーティリティ: メッセージ表示
function log(msg, isEnemy = false) {
    const targetElement = isEnemy ? document.getElementById('enemy-turn-message') : document.getElementById('game-message');
    targetElement.innerText = msg;
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
function createCardElement(cardData, isPlayer = true, fieldIndex = -1, isHand = false) {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.id = cardData.id;

    // 画像とテキストを構造化
    div.innerHTML = `
        <div class="card-name">${cardData.name}</div>
        <img src="${cardData.imageUrl}" alt="${cardData.name}">
        <div class="card-effect">${cardData.effect}</div>
        <div class="card-stats">ATK: ${cardData.atk} / DEF: ${cardData.def}</div>
    `;

    if (isPlayer) {
        if (isHand) {
            // 手札のカード
            div.onclick = () => selectCardInHand(cardData);
            div.dataset.handIndex = playerHand.indexOf(cardData);
        } else {
            // フィールドのカード
            div.dataset.fieldIndex = fieldIndex;
            div.onclick = () => selectCardOnField(fieldIndex);
            if (cardData.position === 'defense') {
                div.classList.add('defense');
            }
        }
    } else {
        // 敵のフィールドカード（反転表示）
        div.style.transform = 'rotate(180deg)';
        if (cardData.position === 'defense') {
             div.classList.add('defense');
             div.style.transform = 'rotate(90deg) scaleX(-1)'; // 敵の守備は横向きで逆
        }
    }
    return div;
}

// 手札のカード選択
let selectedCardInHand = null; // 手札から選択中のカード

function selectCardInHand(cardData) {
    if (turn !== 1) return;
    
    // 選択状態をリセット
    document.querySelectorAll('.player-hand .card').forEach(cardEl => cardEl.classList.remove('selected'));
    
    if (selectedCardInHand === cardData) {
        selectedCardInHand = null;
        document.getElementById('summon-button').disabled = true;
        document.getElementById('set-def-button').disabled = true;
        log("カード選択解除");
    } else {
        selectedCardInHand = cardData;
        document.querySelector(`.player-hand .card[data-id="${cardData.id}"][data-hand-index="${playerHand.indexOf(cardData)}"]`).classList.add('selected');
        document.getElementById('summon-button').disabled = false;
        document.getElementById('set-def-button').disabled = false; // 守備表示でのセットも可能にする
        log(`${cardData.name} を選択中。`);
    }
    selectedPlayerCardIndex = -1; // フィールドの選択を解除
    renderField(); // フィールドの選択状態もリセットするため
}


// フィールドのカード選択（攻撃用）
function selectCardOnField(index) {
    if (turn !== 1 || !playerField[index] || !playerField[index].canAttack) return;
    
    document.querySelectorAll('.player-field .card').forEach(cardEl => cardEl.classList.remove('selected'));
    
    if (selectedPlayerCardIndex === index) {
        selectedPlayerCardIndex = -1;
        log("カード選択解除");
    } else {
        selectedPlayerCardIndex = index;
        document.querySelector(`.player-field .card[data-field-index="${index}"]`).classList.add('selected');
        log(`${playerField[index].name} を選択中。攻撃対象を選択してください。`);
    }
    selectedCardInHand = null; // 手札の選択を解除
    updateControlButtons();
}


// カードを引く (ドロー)
function drawCard() {
    if (turn !== 1) return;
    if (playerHand.length >= 5) { // 手札の上限
        log("手札がいっぱいです！");
        return;
    }
    if (playerDeck.length === 0) {
        log("デッキがありません！");
        return;
    }

    const card = playerDeck.shift();
    playerHand.push(card);
    renderHand();
    log("カードをドローしました。");
    updateControlButtons();
}

// 手札の描画
function renderHand() {
    const handDiv = document.getElementById('player-hand');
    // デッキ表示を維持するために、既存のデッキ要素以外をクリア
    const deckBack = handDiv.querySelector('.deck');
    handDiv.innerHTML = '';
    handDiv.appendChild(deckBack);

    playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card, true, -1, true);
        handDiv.appendChild(cardEl);
    });
}

// フィールドの描画
function renderField() {
    const pFieldDiv = document.getElementById('player-field');
    const eFieldDiv = document.getElementById('enemy-field');

    // プレイヤーフィールド
    playerField.forEach((card, index) => {
        const slot = pFieldDiv.querySelector(`.card-slot[data-slot="${index}"]`);
        slot.innerHTML = ''; // スロットをクリア
        if (card) {
            const cardEl = createCardElement(card, true, index, false);
            if (index === selectedPlayerCardIndex) {
                cardEl.classList.add('selected');
            }
            if (card.canAttack && turn === 1) { // 攻撃可能なカードに光を
                cardEl.classList.add('can-attack');
            }
            slot.appendChild(cardEl);
        }
    });

    // 敵フィールド
    enemyField.forEach((card, index) => {
        const slot = eFieldDiv.querySelector(`.card-slot[data-slot="${index}"]`);
        slot.innerHTML = '';
        if (card) {
            const cardEl = createCardElement(card, false, index, false);
            // 敵のカードはクリックで攻撃対象になる（プレイヤーのカードが選択されている場合）
            if (selectedPlayerCardIndex !== -1 && turn === 1) {
                 cardEl.onclick = () => confirmAttack(selectedPlayerCardIndex, index);
                 cardEl.classList.add('can-be-target'); // ターゲット可能な光など
            }
            slot.appendChild(cardEl);
        }
    });
    updateControlButtons();
}

// コントロールボタンの状態更新
function updateControlButtons() {
    document.getElementById('draw-button').disabled = turn !== 1 || playerHand.length >= 5;
    document.getElementById('summon-button').disabled = turn !== 1 || !selectedCardInHand || summonedThisTurn || playerField.every(s => s !== null);
    document.getElementById('set-def-button').disabled = turn !== 1 || !selectedCardInHand || summonedThisTurn || playerField.every(s => s !== null);
    document.getElementById('end-turn-button').disabled = turn !== 1;
}

// 召喚処理
function trySummonSelectedCard() {
    if (turn !== 1 || !selectedCardInHand || summonedThisTurn) return;

    const emptySlotIndex = playerField.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
        log("フィールドがいっぱいです！");
        return;
    }
    
    // 手札からカードを削除
    const handIndex = playerHand.indexOf(selectedCardInHand);
    playerHand.splice(handIndex, 1);
    
    // フィールドにカードを配置（攻撃表示で）
    playerField[emptySlotIndex] = { ...selectedCardInHand, position: 'attack', canAttack: false }; // 召喚ターンは攻撃不可
    
    log(`${selectedCardInHand.name} を攻撃表示で召喚しました！`);
    selectedCardInHand = null; // 選択解除
    summonedThisTurn = true;
    renderHand();
    renderField();
}

// 守備表示でセット
function setDefensePosition() {
    if (turn !== 1 || !selectedCardInHand || summonedThisTurn) return;

    const emptySlotIndex = playerField.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
        log("フィールドがいっぱいです！");
        return;
    }

    const cardToSet = { ...selectedCardInHand, position: 'defense', canAttack: false }; // 守備表示は攻撃不可
    const handIndex = playerHand.indexOf(selectedCardInHand);
    playerHand.splice(handIndex, 1);
    playerField[emptySlotIndex] = cardToSet;

    log(`${cardToSet.name} を守備表示でセットしました！`);
    selectedCardInHand = null; // 選択解除
    summonedThisTurn = true;
    renderHand();
    renderField();
}


// 攻撃実行の確認（プレイヤー側）
function confirmAttack(attackerIndex, targetIndex) {
    const attacker = playerField[attackerIndex];
    const target = enemyField[targetIndex];

    if (!attacker || !attacker.canAttack) {
        log("このモンスターは攻撃できません。");
        return;
    }
    if (!target) {
        log("攻撃対象が選択されていません。");
        return;
    }

    log(`${attacker.name} が ${target.name} に攻撃！`);
    
    // 攻撃アニメーション（仮）
    const attackerEl = document.querySelector(`.player-field .card[data-field-index="${attackerIndex}"]`);
    const targetEl = document.querySelector(`.enemy-field .card[data-slot="${targetIndex}"] .card`);
    if (attackerEl && targetEl) {
        const attackerRect = attackerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const deltaX = targetRect.left - attackerRect.left;
        const deltaY = targetRect.top - attackerRect.top;

        attackerEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        setTimeout(() => {
            attackerEl.style.transform = ''; // 元に戻す
            resolveBattle(attackerIndex, targetIndex);
        }, 500);
    } else {
        resolveBattle(attackerIndex, targetIndex);
    }
}

// 戦闘解決ロジック
function resolveBattle(attackerIndex, targetIndex) {
    const attacker = playerField[attackerIndex];
    const target = enemyField[targetIndex];

    if (!attacker || !target) return;

    let damageToPlayerLP = 0;
    let damageToEnemyLP = 0;
    let attackerDestroyed = false;
    let targetDestroyed = false;

    if (target.position === 'attack') {
        // 攻撃表示の敵モンスターへの攻撃
        if (attacker.atk > target.atk) {
            damageToEnemyLP = attacker.atk - target.atk;
            targetDestroyed = true;
            log(`${attacker.name} が ${target.name} を破壊！相手に ${damageToEnemyLP} ダメージ！`);
        } else if (attacker.atk < target.atk) {
            damageToPlayerLP = target.atk - attacker.atk;
            attackerDestroyed = true;
            log(`${target.name} の反撃！ ${attacker.name} は破壊され、あなたに ${damageToPlayerLP} ダメージ！`);
        } else { // 攻撃力同じ
            attackerDestroyed = true;
            targetDestroyed = true;
            log(`${attacker.name} と ${target.name} は相打ち！`);
        }
    } else { // target.position === 'defense'
        // 守備表示の敵モンスターへの攻撃
        if (attacker.atk > target.def) {
            targetDestroyed = true;
            log(`${attacker.name} が ${target.name} (守備表示) を破壊！`);
        } else if (attacker.atk < target.def) {
            damageToPlayerLP = target.def - attacker.atk;
            log(`${target.name} (守備表示) が堅い！あなたに ${damageToPlayerLP} ダメージ！`);
        } else { // 攻撃力と守備力が同じ
            log(`${target.name} (守備表示) は耐えきった！`);
        }
    }

    if (targetDestroyed) {
        enemyField[targetIndex] = null;
        // 破壊アニメ
