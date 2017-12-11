//=============================================================================
// UNV_Core.js
//=============================================================================

/*:
 * @plugindesc Some helper functions
*/

PIXI.Text.prototype.center = function(container) {
    this.anchor.set(0.5);
    this.x = container.x + container.width / 2 ;
    this.y = container.y + container.height / 2;
};

PIXI.Text.prototype.right = function(container, padding) {
    var p = padding ? padding : 0;
    this.anchor.set(1, 0.5);
    this.x = container.x + container.width - pct(p, container.width);
    this.y = container.y  + container.height/2;
};

PIXI.Text.prototype.rightCorner = function(container, padding) {
    var p = padding ? padding : 0;
    this.anchor.set(1, 0);
    this.x = container.x + container.width - p;
    this.y = container.height - p;
};

PIXI.Text.prototype.leftCorner = function(container, padding) {
    var p = padding ? padding : 0;
    this.anchor.set(0, 0);
    this.x = container.x + p;
    this.y = container.y + p;
};

PIXI.Container.prototype.center = function (container) {
    this.pivot.set(this.width/2, this.height/2);
    this.x = container.width / 2;
    this.y = container.height /2;
};

PIXI.Container.prototype.setWidth = function (value) {
    this.widthValue = value;
};

PIXI.Container.prototype.setHeight = function (value) {
    this.heightValue = value;
};

//=========================================================
//Physics Simulation

class Physic {
    constructor() {
        throw new Error('This is a static class');
    };

    static collisionCheck(r1, r2) {
        var hit, touchRangeX, touchRangeY, dx, dy;

        r1.centerX = r1.x + r1.width / 2;
        r1.centerY = r1.y + r1.height / 2;
        r2.centerX = r2.x + r2.width / 2;
        r2.centerY = r2.y + r2.height / 2;

        r1.halfWidth = r1.width / 2;
        r1.halfHeight = r1.height / 2;
        r2.halfWidth = r2.width / 2;
        r2.halfHeight = r2.height / 2;

        dx = r1.centerX - r2.centerX;
        dy = r1.centerY - r2.centerY;

        touchRangeX = r1.halfWidth + r2.halfWidth;
        touchRangeY = r1.halfHeight + r2.halfHeight;

        hit = Math.abs(dx) < touchRangeX && Math.abs(dy) < touchRangeY;
        return hit;
    }

    static contain(sprite, container) {
        var collision;

        if (sprite.x < container.x) {
            sprite.x = container.x;
            collision = "left";
        }

        if (sprite.y < container.y) {
            sprite.y = container.y;
            collision = "top";
        }

        if (sprite.x + sprite.width > container.width) {
            sprite.x = container.width - sprite.width;
            collision = "right";
        }

        if (sprite.y + sprite.height > container.height) {
            sprite.y = container.height - sprite.height;
            collision = "bottom";
        }

        return collision;
    }
}

class AudioLoader {
    static  loadAudio(musics, options, canplay) {
        var n,name,
            result = {};
        for (n = 0; n < musics.length; ++n) {
            name = musics[n];
            result[name] = document.createElement("audio");
            result[name].addEventListener("canplay", canplay, false);
            result[name].volume = options.volume || 0.1;
            result[name].loop = options.loop || false;
            result[name].src = "audio/sounds/" + name + ".mp3";
        }
        if (n === musics.length) {return result}
    }

    static  playAudio(audio) {
        audio.pause();
        audio.startTime = 0;
        audio.play();
    }

}

AudioLoader.bgm = ['credit', 'battle'];
AudioLoader.se = ['hover', 'melee0', 'melee1', 'spell0', 'ranged0', 'voice0'];
//AudioLoader.bgm = loadAudio(musics, {volume: 1, loop: true});
//AudioLoader.se = loadAudio(musics, {volume: 1, loop: true});


function sendToBack(sprite, parent) {
    var sprite = (typeof sprite != "undefined") ? sprite.target || sprite : this;
    var parent = parent || sprite.parent || {"children": false};
    if (parent.children) {
        for (var keyIndex in sprite.parent.children) {
            if (sprite.parent.children[keyIndex] === sprite) {
                sprite.parent.children.splice(keyIndex, 1);
                break;
            }
        }
        parent.children.splice(0,0,sprite);
    }
}

//------------------------------------------------------------------
//Frame Size
var $SpriteSheet = {
    animationSpeed: 0.15,
    battler: {
        numOfFrames: 28,
        framesPerRow: 7,
        framesPerCol: 4
    },

    weapon: {
        numOfFrames: 28,
        framesPerRow: 7,
        framesPerCol: 4
    },

    face: {
        numOfFrames: 8,
        framesPerRow: 4,
        framesPerCol: 2
    },

    skills: {
    }
};

//--------------------------------------------
//Characters

var $Skills = [
    {
        type: "melee", target: "enemy",
        effect: 0, sound: 0, texture: 1,
        formula: function (baseDam) {
            return (Math.floor(baseDam));
        },
        description: "Attack a single target"
    }, {
        type: "melee", target: "enemy",
        effect: 1, sound: 1, texture: 2,
        formula: function (baseDam) {
            return (Math.floor(baseDam * 1.5));
        }
    }, {
        type: "spell", target: "enemy",
        effect: 0, sound: 0, texture: 5,
        formula: function (baseDam) {
            return (Math.floor(baseDam * 2.5));
        }
    }, {
        type: "ranged", target: "enemy",
        effect: 0, sound: 0, texture: 4,
        formula: function(baseDam) {
            return (Math.floor(baseDam * 2));
        }
    }, {
        type: "spell", target: "ally",
        effect: 0, sound: 0, texture: 6,
        formula: function (baseDam) {
            return -(Math.floor(baseDam));
        },
        description: ""
    }
];

//---------
var char0 = {
    skills: [$Skills[0], $Skills[1], $Skills[2]],
    baseHp: 300,
    baseMp: 0,
    class: "melee",
    square: 0,
    ally: "player",
    name: "Zombie",
    voice: 0,
};

//------------------------------------------------------------------
//Battle Manager

//--------------------
//Core

class UNV_BattleManager {
    constructor() {
        throw new Error('This is a static class')
    }

    static start() {
        this.phase = "input";
        this.setSquare();
        this.currentSquares = leftSquares;
        this.enemySquares = rightSquares;
        this.currentChar = leftSquares.children[this.currentSquares.counter].char;
        this.request("changeSkillTexture")
    };

    static update() {
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

    static resetTurn() {
        this.buttonValue = null;
        this.currentSkill = null;
        this.enemyChar = null;
    };

    static resetSquare = function () {
        this.currentSquares.counter = 0;
    };

    static isGameOver() {
        if (this.chars[0].bar.hp.value <= 0) {
            SceneManager.change(credit);
        }
    };

    static add = function (element, type) {
        if (Array.isArray(element)) for (i = 0; i < element.length; i++) {
            this[type + "s"].push(element[i]);
        } else this[type + "s"].push(element);
    };

    static request(req) {
        if (Array.isArray(req)) for (var i = 0; i < req.length; i++) {
            this.queue.push(this[req[i]]);
        } else this.queue.push(this[req]);
    };

    static requestParallel(req) {
        if (Array.isArray(req)) for (var i = 0; i < req.length; i++) {
            this.parallel.push(this[req[i]]);
        } else this.parallel.push(this[req]);
    };

    static shift = function () {
        this.queue.shift();
    };

    static shiftParallel = function () {
        this.parallel.shift();
    };
//--------------------
//Queued Methods
    static requestBuilder() {
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

    static getData() {
        var newEffect, type = this.currentSkill.type;
        switch (type) {
            case "melee":
                newEffect = new Animation_Effect();
                if (this.currentSkill.effect !== 0) newEffect.drawEffect("Melee", 1, 4, 4, 192, 192);
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

    static castSpell = function () {
        this.currentChar.playNonLoop("basic");
        this.currentEffect.x = this.enemyChar.battler.x;
        this.currentEffect.y = this.enemyChar.battler.y;
        this.currentEffect.gotoAndPlay(0);
        this.currentEffect.visible = true;
        this.requestParallel(["playSound", "playVoice", "computeDamage"]);
        this.shift();
    };

    static rangedAttack = function () {
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

    static moveProjectile = function () {
        if (collisionCheck(this.currentEffect, this.enemyChar.battler)) {
            this.currentEffect.visible = false;
            this.requestParallel(["playVoice", "computeDamage"]);
            this.shift();
        } else this.moveSpriteTo(this.currentEffect, this.enemyChar.battler.homeX, this.enemyChar.battler.homeY);
    };

    static moveSpriteTo = function (sprite, x, y) {
        var d = sprite.movementDuration;
        sprite.x = (sprite.x * (d - 1) + x) / d;
        sprite.y = (sprite.y * (d - 1) + y) / d;
        sprite.movementDuration--;
    };

    static setRunDuration = function () {
        this.currentChar.battler.movementDuration = 50;
        this.currentChar.playNonLoop("sprint");
        this.shift();
    };

    static runForward = function () {
        if (collisionCheck(this.currentChar.battler, this.enemyChar.battler)) {
            this.currentChar.battler.movementDuration = 50;
            this.shift();
        } else this.moveSpriteTo(this.currentChar.battler, this.enemyChar.battler.homeX, this.enemyChar.battler.homeY);
    };

    static meleeSprite = function () {
        this.currentChar.playNonLoop("basic");
        this.currentEffect.x = this.enemyChar.battler.x;
        this.currentEffect.y = this.enemyChar.battler.y;
        this.currentEffect.gotoAndPlay(0);
        this.currentEffect.visible = true;
        this.requestParallel(["playSound", "playVoice", "computeDamage"]);
        this.shift();
    };

    static runBack = function () {
        this.moveSpriteTo(this.currentChar.battler, this.currentChar.battler.homeX, this.currentChar.battler.homeY);
        if (this.currentChar.battler.movementDuration === 0) {
            this.currentChar.battler.movementDuration = null;
            this.shift();
        }
    };

    static attack = function () {
        if (this.currentChar.battler.currentFrame === this.currentChar.battler.textures.length - 1) {
            if (this.currentEffect.currentFrame === this.currentEffect.textures.length - 1) {
                this.currentEffect.visible = false;
                this.currentChar.playNonLoop("back");
                this.shift();
            }
        }
    };

    static idleAnimation = function () {
        this.currentChar.playLoop("idle");
        this.shift();
    };

    static changeSquares = function () {
        this.currentSquares.counter++;
        var previous = this.enemySquares;
        this.enemySquares = this.currentSquares;
        this.currentSquares = previous;
        this.shift();
    };

    static endTurn = function () {
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

    static changeSkillTexture = function () {
        for (var i = 0; i < SceneManager._scene.skillBar.array.length; i++) {
            SceneManager._scene.skillBar.array[i].changeTexture(0);
            if (i < this.currentChar.skills.length) SceneManager._scene.skillBar.array[i].changeTexture(this.currentChar.skills[i].texture);
        }
        SceneManager._scene.skillBar.visible = true;
        this.shift();
    };
//--------------------
//Input Methods
    static setSquare() {
        for (var i = 0; i < this.chars.length; i++) {
            if (this.chars[i].ally != "enemy") this.chars[i].setSquarePosition(leftSquares);
            else this.chars[i].setSquarePosition(rightSquares);
            this.chars[i].updateDisplay();
            this.chars[i].center();
        }
    };

    static checkButton() {
        if (this.phase === "input" && this.isButtonPressed()) {
            var currentSkill = this.currentChar.skills[this.buttonValue];
            if (currentSkill) {
                SceneManager._scene.skillBar.visible = false;
                this.currentSkill = currentSkill;
                this.phase = "target";
            }
        }
    };

    static setTarget() {
        if (this.isTargetSelected()) {
            this.request(this.requestBuilder());
            this.phase = "queue";
        }
    };

    static computer() {
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

    static isRear() {
        var index = this.enemyChar.square - 3;
        if (index < 0) return false;
        return this.enemySquares.children[index].char;
    };
//--------------------
//Parallel Methods - Graphics && Sounds

    static showText() {
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

    static currentBarWidth = function (bar) {
        return bar.baseWidth * bar.hp.value / bar.hp.baseValue;
    };

    static playBattleBgm() {
        AudioManager.playBgm($gameSystem.battleBgm());
        AudioManager.stopBgs();
    };

}

//--------------------
//Data

UNV_BattleManager.chars = [];
UNV_BattleManager.phase = null;
//--------------------
//Queue & Actions

UNV_BattleManager.queue = [];
UNV_BattleManager.damages = [];
UNV_BattleManager.bars = [];
UNV_BattleManager.parallel = [];
//--------------------
//Cache

UNV_BattleManager.buttonValue = null;
UNV_BattleManager.currentChar = null;
UNV_BattleManager.enemyChar = null;
UNV_BattleManager.currentEffect = null;
UNV_BattleManager.currentVoice = null;
UNV_BattleManager.currentSound = null;
UNV_BattleManager.currentSkill = null;
UNV_BattleManager.currentSquares = null;
UNV_BattleManager.enemySquares = null;
UNV_BattleManager.currentHover = null;
UNV_BattleManager.currentText = new PIXI.Text("", {});