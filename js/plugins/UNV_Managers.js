//------------------------------------------------------------------
//Battle Manager

//--------------------
//Data
BattleManager.chars = [];
BattleManager.phase = null;
//--------------------
//Queue & Actions
BattleManager.queue = [];
BattleManager.damages = [];
BattleManager.bars = [];
BattleManager.parallel = [];
//--------------------
//Cache
BattleManager.buttonValue = null;
BattleManager.currentChar = null;
BattleManager.enemyChar = null;
BattleManager.currentEffect = null;
BattleManager.currentVoice = null;
BattleManager.currentSound = null;
BattleManager.currentSkill = null;
BattleManager.currentSquares = null;
BattleManager.enemySquares = null;
BattleManager.currentHover = null;
BattleManager.currentText = new PIXI.Text("", {});

//--------------------
//Core
BattleManager.start = function() {
    this.phase = "input";
    this.setSquare();
    this.currentSquares = leftSquares;
    this.enemySquares = rightSquares;
    this.currentChar = leftSquares.children[this.currentSquares.counter].char;
    this.request("changeSkillTexture")
};

BattleManager.update = function() {
    if (!this.isBusy()) {
        switch (this.phase) {
            case "input":
                this.checkButton();
                break;
            case "computer":
                this.computer();
                break;
            case "target":
                this.setTarget();
                break;
            case "queue":
                break;
            default: return true;
        }
        if (this.queue[0]) this.queue[0].call(this);
        if (this.parallel[0]) this.parallel[0].call(this);
        this.showDamage();
        this.dropHp();
        this.showText();
        this.isGameOver();
    }
};

BattleManager.resetTurn = function() {
    this.buttonValue = null;
    this.currentSkill = null;
    this.enemyChar = null;
};

BattleManager.resetSquare = function () {
    this.currentSquares.counter = 0;
};

BattleManager.isGameOver = function() {
    if (this.chars[0].bar.hp.value <= 0) {
        SceneManager.change(credit);
    }
};

BattleManager.add = function (element, type) {
    if (Array.isArray(element)) for (i = 0; i < element.length; i++) {
        this[type + "s"].push(element[i]);
    } else this[type + "s"].push(element);
};

BattleManager.request = function(req) {
    if (Array.isArray(req)) for (var i = 0; i < req.length; i++) {
        this.queue.push(this[req[i]]);
    } else this.queue.push(this[req]);
};

BattleManager.requestParallel = function(req) {
    if (Array.isArray(req)) for (var i = 0; i < req.length; i++) {
        this.parallel.push(this[req[i]]);
    } else this.parallel.push(this[req]);
};

BattleManager.shift = function () {
    this.queue.shift();
};

BattleManager.shiftParallel = function () {
    this.parallel.shift();
};
//--------------------
//Queued Methods
BattleManager.requestBuilder = function() {
    var queue = [];
    queue.push("getData");
    switch (this.currentChar.skills[this.buttonValue].type) {
        case "melee":
            queue.push("setRunDuration", "runForward", "meleeSprite", "attack", "runBack", "idleAnimation");
            break;
        case "spell":
            queue.push("castSpell", "attack", "idleAnimation");
            break;
        case "ranged":
            queue.push("rangedAttack", "moveProjectile", "idleAnimation");
            break;
        default:
            return true;
    }
    queue.push("changeSquares", "endTurn");
    return queue;
};

BattleManager.getData = function() {
    var newEffect, type = this.currentSkill.type;
    switch (type) {
        case "melee":
            newEffect = new Animation_Effect();
            if (this.currentSkill.effect != 0) newEffect.drawEffect("Melee", 1, 4, 4, 192, 192);
            else newEffect.drawEffect("Melee", 0, 4, 4, 192, 192);
            break;
        case "ranged":
            newEffect = new Sprite_Projectile();
            newEffect.drawProjectile("Arrow", 0);
            newEffect.scale.set(0.05);
            break;
        case "spell":
            newEffect = new Animation_Effect();
            newEffect.drawEffect("Spell", 0, 21, 5, 192, 192);
            break;
    }
    this.currentEffect = newEffect;
    this.currentSound = sounds[this.currentSkill.type + this.currentSkill.sound];
    this.currentVoice = sounds["voice0"];
    this.shift();
};

BattleManager.castSpell = function () {
    this.currentChar.playNonLoop("basic");
    this.currentEffect.x = this.enemyChar.battler.x;
    this.currentEffect.y = this.enemyChar.battler.y;
    this.currentEffect.gotoAndPlay(0);
    this.currentEffect.visible = true;
    this.requestParallel(["playSound", "playVoice", "computeDamage"]);
    this.shift();
};

BattleManager.rangedAttack = function () {
    this.currentChar.playNonLoop("basic");
    this.currentEffect.movementDuration = 40;
    this.currentEffect.homeX = this.currentChar.battler.homeX;
    this.currentEffect.homeY = this.currentChar.battler.homeY;
    this.currentEffect.x = this.currentEffect.homeX;
    this.currentEffect.y = this.currentEffect.homeY;
    this.currentEffect.visible = true;
    this.requestParallel("playSound");
    this.shift();
};

BattleManager.moveProjectile = function () {
    if (collisionCheck(this.currentEffect, this.enemyChar.battler)) {
        this.currentEffect.visible = false;
        this.requestParallel(["playVoice", "computeDamage"]);
        this.shift();
    } else this.moveSpriteTo(this.currentEffect, this.enemyChar.battler.homeX, this.enemyChar.battler.homeY);
};

BattleManager.moveSpriteTo = function (sprite, x, y) {
    var d = sprite.movementDuration;
    sprite.x = (sprite.x * (d - 1) + x) / d;
    sprite.y = (sprite.y * (d - 1) + y) / d;
    sprite.movementDuration--;
};

BattleManager.setRunDuration = function () {
    this.currentChar.battler.movementDuration = 50;
    this.currentChar.playNonLoop("sprint");
    this.shift();
};

BattleManager.runForward = function () {
    if (collisionCheck(this.currentChar.battler, this.enemyChar.battler)) {
        this.currentChar.battler.movementDuration = 50;
        this.shift();
    } else this.moveSpriteTo(this.currentChar.battler, this.enemyChar.battler.homeX, this.enemyChar.battler.homeY);
};

BattleManager.meleeSprite = function () {
    this.currentChar.playNonLoop("basic");
    this.currentEffect.x = this.enemyChar.battler.x;
    this.currentEffect.y = this.enemyChar.battler.y;
    this.currentEffect.gotoAndPlay(0);
    this.currentEffect.visible = true;
    this.requestParallel(["playSound", "playVoice", "computeDamage"]);
    this.shift();
};

BattleManager.runBack = function () {
    this.moveSpriteTo(this.currentChar.battler, this.currentChar.battler.homeX, this.currentChar.battler.homeY);
    if (this.currentChar.battler.movementDuration === 0) {
        this.currentChar.battler.movementDuration = null;
        this.shift();
    }
};

BattleManager.attack = function () {
    if (this.currentChar.battler.currentFrame === this.currentChar.battler.textures.length - 1) {
        if (this.currentEffect.currentFrame === this.currentEffect.textures.length - 1) {
            this.currentEffect.visible = false;
            this.currentChar.playNonLoop("back");
            this.shift();
        }
    }
};

BattleManager.idleAnimation = function () {
    this.currentChar.playLoop("idle");
    this.shift();
};

BattleManager.changeSquares = function () {
    this.currentSquares.counter++;
    var previous = this.enemySquares;
    this.enemySquares = this.currentSquares;
    this.currentSquares = previous;
    this.shift();
};

BattleManager.endTurn = function () {
    if (!this.currentSquares.children[this.currentSquares.counter].char) {
        this.currentSquares.counter++;
        if (this.currentSquares.counter > 8) this.resetSquare();
    } else {
        this.currentChar = this.currentSquares.children[this.currentSquares.counter].char;
        this.resetTurn();
        if (this.currentSquares === leftSquares && this.currentChar.ally === "player") {
            this.request("changeSkillTexture");
            this.phase = "input";
        }
        else this.phase = "computer";
        this.shift();
    }
};

BattleManager.changeSkillTexture = function () {
    for (var i = 0; i < SceneManager._scene.skillBar.array.length; i++) {
        SceneManager._scene.skillBar.array[i].changeTexture(0);
        if (i < this.currentChar.skills.length) SceneManager._scene.skillBar.array[i].changeTexture(this.currentChar.skills[i].texture);
    }
    SceneManager._scene.skillBar.visible = true;
    this.shift();
};
//--------------------
//Input Methods
BattleManager.setSquare = function() {
    for (var i = 0; i < this.chars.length; i++) {
        if (this.chars[i].ally != "enemy") this.chars[i].setSquarePosition(leftSquares);
        else this.chars[i].setSquarePosition(rightSquares);
        this.chars[i].updateDisplay();
        this.chars[i].center();
    }
};

BattleManager.checkButton = function() {
    if (this.phase === "input" && this.isButtonPressed()) {
        var currentSkill = this.currentChar.skills[this.buttonValue];
        if (currentSkill) {
            SceneManager._scene.skillBar.visible = false;
            this.currentSkill = currentSkill;
            this.phase = "target";
        }
    }
};

BattleManager.setTarget = function() {
    if (this.isTargetSelected()) {
        this.request(this.requestBuilder());
        this.phase = "queue";
    }
};

BattleManager.computer = function() {
    if (this.phase === "computer") {
        this.buttonValue = randomInt(0, this.currentChar.skills.length - 1);
        this.currentSkill = this.currentChar.skills[this.buttonValue];

        var index = randomInt(0, 8);
        if (this.currentSkill.target === "enemy") {
            while (!this.enemySquares.children[index].char)
                index = this.chars[randomInt(0, this.chars.length - 1)].square;
            this.enemyChar = this.enemySquares.children[index].char;
        } else {
            while (!this.currentSquares.children[index].char)
                index = this.chars[randomInt(0, this.chars.length - 1)].square;
            this.enemyChar = this.currentSquares.children[index].char;
        }
        this.request(this.requestBuilder());
        this.phase = "queue";
    }
};

BattleManager.isRear = function() {
    var index = this.enemyChar.square - 3;
    if (index < 0) return false;
    return this.enemySquares.children[index].char;
};
//--------------------
//Parallel Methods - Graphics && Sounds

BattleManager.showText = function() {
    var text = this.currentText;
    switch (this.phase) {
        case "input":
            text.text = "Your Turn";
            text.style = {
                fontSize: 32, fontFamily: "Arial", fill: "#ffffff",
                fontWeight: "600", strokeThickness: 2
            };
            text.anchor.set(0.5);
            text.x = SceneManager._screenWidth / 2;
            text.y = SceneManager._scene.skillBar.y - 50;
            SceneManager._scene.addChild(text);
            break;
        case "target":
            text.text = "Choose a target";
            text.style = {
                fontSize: 24, fontFamily: "Arial", fill: "#ffffff",
                fontWeight: "600", strokeThickness: 2
            };
            break;
        default:
            text.text = this.currentChar.name + " Turn";
            text.style = {
                fontSize: 24, fontFamily: "Arial", fill: "#ffffff",
                fontWeight: "600", strokeThickness: 2
            };
            text.anchor.set(0.5);
            text.x = SceneManager._screenWidth / 2;
            text.y = SceneManager._scene.skillBar.y - 40;
            SceneManager._scene.addChild(text);
            break;
    }
};

BattleManager.currentBarWidth = function (bar) {
    return bar.baseWidth * bar.hp.value / bar.hp.baseValue;
};

BattleManager.playSe = function () {
    AudioManager.playSe(se);
};

BattleManager.playVoice = function () {
    SoundManager.playActorDamage();
};

BattleManager.checkGlow = function() {
    if (this.isHovering()) {
        var hover = this.currentHover;
        if (this.phase === "target")
            if ((this.currentSkill.target === "ally" && hover.ally === "player")
                || this.currentSkill.target === hover.ally) this.glowSquare();
            else {
                hover.square.visible = false;
                this.shiftParallel();
            }
    } else this.shiftParallel();
};

BattleManager.glowSquare = function() {
    var hover = this.currentHover;
    hover.square.visible = true;
    if (hover.square.alpha >= 1 || hover.square.alpha <= 0.25)
        hover.square.glowSpeed *= -1;
    hover.square.alpha += hover.square.glowSpeed;
};

BattleManager.isTargetSelected = function() {
    return this.enemyChar;
};

BattleManager.isButtonPressed = function() {
    return this.buttonValue != 0 ? this.buttonValue : true;
};

BattleManager.isHovering = function() {
    return this.currentHover;
};

BattleManager.playBattleBgm = function() {
    AudioManager.playBgm($gameSystem.battleBgm());
    AudioManager.stopBgs();
};
