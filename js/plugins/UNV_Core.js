//=============================================================================
// UNV_Core.js
//=============================================================================

/*:
 * @plugindesc Core functioon of Unvirtuous
*/
//=========================================================
//Default

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
//Math Helpers

function random(min, max) {
    return (min + (Math.random() * (max - min)));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(choices) {
    return choices[randomInt(0, choices.length-1)];
}

function randomBool() {
    return randomChoice([true, false]);
}

function max(x, max) {
    return x > max ? max : x;
}

function min(x, min) {
    return x < min ? min : x;
}

function limit(x, min, max) {
    return Math.max(min, Math.min(max, x));
}
//=========================================================
//Physics Simulation

function collisionCheck(r1, r2) {
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

function contain(sprite, container) {
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

function brightness(color, speed) {
    var r = parseInt(color.substr(0,2), 16);
    var g = parseInt(color.substr(2,2), 16);
    var b = parseInt(color.substr(4,2), 16);

    r += speed;
    r = limit(r, 0, 255);

    g += speed;
    g = limit(g, 0, 255);

    b += speed;
    b = limit(b, 0, 255);

    return parseInt((0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1))
}

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

function loadSounds(sounds) {
    var n,name,
        result = {};
    for (n = 0; n < sounds.length; ++n) {
        name = sounds[n];
        result[name] = document.createElement("audio");
        result[name].src = "audio/sounds/" + name + ".mp3";
    }
    if (n === sounds.length) {return result}
}
var sounds = ['hover', 'melee0', 'melee1', 'spell0', 'ranged0', 'voice0'];
//

function loadMusics(musics, options, canplay) {
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

var musics = ['credit', 'bgm'];
//musics = loadMusics(musics, {volume: 1, loop: true});

function playAudio(audio) {
    audio.pause();
    audio.startTime = 0;
    audio.play();
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

var $Skills = [];
$Skills[0] = {
    type: "melee", target: "enemy",
    effect: 0, sound: 0, texture: 1,
    formula: function (baseDam) {
        return (Math.floor(baseDam));
    },
    description: "Attack a single target"
};
$Skills[1] = {
    type: "melee", target: "enemy",
    effect: 1, sound: 1, texture: 2,
    formula: function (baseDam) {
        return (Math.floor(baseDam * 1.5));
    }
};
$Skills[2] = {
    type: "ranged", target: "enemy",
    effect: 0, sound: 0, texture: 4,
    formula: function(baseDam) {
        return (Math.floor(baseDam * 2));
    }
};
$Skills[3] = {
    type: "spell", target: "enemy",
    effect: 0, sound: 0, texture: 5,
    formula: function (baseDam) {
        return (Math.floor(baseDam * 2.5));
    }
};

$Skills[4] = {
    type: "spell", target: "ally",
    effect: 0, sound: 0, texture: 6,
    formula: function (baseDam) {
        return -(Math.floor(baseDam));
    },
    description: ""
};

//---------
var char0 = {};
char0.skills = [];
char0.skills[0] = $Skills[0];
char0.skills[1] = $Skills[1];
char0.skills[2] = $Skills[2];
char0.baseHp = 300;
char0.baseMp = 0;
char0.class = "melee";
char0.square = 0;
char0.ally = "player";
char0.name = "Zombie";
char0.voice = 0;