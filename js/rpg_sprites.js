//=============================================================================
// rpg_sprites.js v1.5.1
//=============================================================================

//-----------------------------------------------------------------------------
// Sprite_Base
//
// The sprite class with a feature which displays animations.

function Sprite_Base() {
    this.initialize.apply(this, arguments);
}

Sprite_Base.prototype = Object.create(Sprite.prototype);
Sprite_Base.prototype.constructor = Sprite_Base;

Sprite_Base.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._animationSprites = [];
    this._effectTarget = this;
    this._hiding = false;
};

Sprite_Base.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateVisibility();
    this.updateAnimationSprites();
};

Sprite_Base.prototype.hide = function() {
    this._hiding = true;
    this.updateVisibility();
};

Sprite_Base.prototype.show = function() {
    this._hiding = false;
    this.updateVisibility();
};

Sprite_Base.prototype.updateVisibility = function() {
    this.visible = !this._hiding;
};

Sprite_Base.prototype.updateAnimationSprites = function() {
    if (this._animationSprites.length > 0) {
        var sprites = this._animationSprites.clone();
        this._animationSprites = [];
        for (var i = 0; i < sprites.length; i++) {
            var sprite = sprites[i];
            if (sprite.isPlaying()) {
                this._animationSprites.push(sprite);
            } else {
                sprite.remove();
            }
        }
    }
};

Sprite_Base.prototype.startAnimation = function(animation, mirror, delay) {
    var sprite = new Sprite_Animation();
    sprite.setup(this._effectTarget, animation, mirror, delay);
    this.parent.addChild(sprite);
    this._animationSprites.push(sprite);
};

Sprite_Base.prototype.isAnimationPlaying = function() {
    return this._animationSprites.length > 0;
};

//-----------------------------------------------------------------------------
// Sprite_Button
//
// The sprite for displaying a button.

function Sprite_Button() {
    this.initialize.apply(this, arguments);
}

Sprite_Button.prototype = Object.create(Sprite.prototype);
Sprite_Button.prototype.constructor = Sprite_Button;

Sprite_Button.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._touching = false;
    this._coldFrame = null;
    this._hotFrame = null;
    this._clickHandler = null;
};

Sprite_Button.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateFrame();
    this.processTouch();
};

Sprite_Button.prototype.updateFrame = function() {
    var frame;
    if (this._touching) {
        frame = this._hotFrame;
    } else {
        frame = this._coldFrame;
    }
    if (frame) {
        this.setFrame(frame.x, frame.y, frame.width, frame.height);
    }
};

Sprite_Button.prototype.setColdFrame = function(x, y, width, height) {
    this._coldFrame = new Rectangle(x, y, width, height);
};

Sprite_Button.prototype.setHotFrame = function(x, y, width, height) {
    this._hotFrame = new Rectangle(x, y, width, height);
};

Sprite_Button.prototype.setClickHandler = function(method) {
    this._clickHandler = method;
};

Sprite_Button.prototype.callClickHandler = function() {
    if (this._clickHandler) {
        this._clickHandler();
    }
};

Sprite_Button.prototype.processTouch = function() {
    if (this.isActive()) {
        if (TouchInput.isTriggered() && this.isButtonTouched()) {
            this._touching = true;
        }
        if (this._touching) {
            if (TouchInput.isReleased() || !this.isButtonTouched()) {
                this._touching = false;
                if (TouchInput.isReleased()) {
                    this.callClickHandler();
                }
            }
        }
    } else {
        this._touching = false;
    }
};

Sprite_Button.prototype.isActive = function() {
    var node = this;
    while (node) {
        if (!node.visible) {
            return false;
        }
        node = node.parent;
    }
    return true;
};

Sprite_Button.prototype.isButtonTouched = function() {
    var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
};

Sprite_Button.prototype.canvasToLocalX = function(x) {
    var node = this;
    while (node) {
        x -= node.x;
        node = node.parent;
    }
    return x;
};

Sprite_Button.prototype.canvasToLocalY = function(y) {
    var node = this;
    while (node) {
        y -= node.y;
        node = node.parent;
    }
    return y;
};

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

function Sprite_Character() {
    this.initialize.apply(this, arguments);
}

Sprite_Character.prototype = Object.create(Sprite_Base.prototype);
Sprite_Character.prototype.constructor = Sprite_Character;

Sprite_Character.prototype.initialize = function(character) {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
    this.setCharacter(character);
};

Sprite_Character.prototype.initMembers = function() {
    this.anchor.x = 0.5;
    this.anchor.y = 1;
    this._character = null;
    this._balloonDuration = 0;
    this._tilesetId = 0;
    this._upperBody = null;
    this._lowerBody = null;
};

Sprite_Character.prototype.setCharacter = function(character) {
    this._character = character;
};

Sprite_Character.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this.updateBitmap();
    this.updateFrame();
    this.updatePosition();
    this.updateAnimation();
    this.updateBalloon();
    this.updateOther();
};

Sprite_Character.prototype.updateVisibility = function() {
    Sprite_Base.prototype.updateVisibility.call(this);
    if (this._character.isTransparent()) {
        this.visible = false;
    }
};

Sprite_Character.prototype.isTile = function() {
    return this._character.tileId > 0;
};

Sprite_Character.prototype.tilesetBitmap = function(tileId) {
    var tileset = $gameMap.tileset();
    var setNumber = 5 + Math.floor(tileId / 256);
    return ImageManager.loadTileset(tileset.tilesetNames[setNumber]);
};

Sprite_Character.prototype.updateBitmap = function() {
    if (this.isImageChanged()) {
        this._tilesetId = $gameMap.tilesetId();
        this._tileId = this._character.tileId();
        this._characterName = this._character.characterName();
        this._characterIndex = this._character.characterIndex();
        if (this._tileId > 0) {
            this.setTileBitmap();
        } else {
            this.setCharacterBitmap();
        }
    }
};

Sprite_Character.prototype.isImageChanged = function() {
    return (this._tilesetId !== $gameMap.tilesetId() ||
            this._tileId !== this._character.tileId() ||
            this._characterName !== this._character.characterName() ||
            this._characterIndex !== this._character.characterIndex());
};

Sprite_Character.prototype.setTileBitmap = function() {
    this.bitmap = this.tilesetBitmap(this._tileId);
};

Sprite_Character.prototype.setCharacterBitmap = function() {
    this.bitmap = ImageManager.loadCharacter(this._characterName);
    this._isBigCharacter = ImageManager.isBigCharacter(this._characterName);
};

Sprite_Character.prototype.updateFrame = function() {
    if (this._tileId > 0) {
        this.updateTileFrame();
    } else {
        this.updateCharacterFrame();
    }
};

Sprite_Character.prototype.updateTileFrame = function() {
    var pw = this.patternWidth();
    var ph = this.patternHeight();
    var sx = (Math.floor(this._tileId / 128) % 2 * 8 + this._tileId % 8) * pw;
    var sy = Math.floor(this._tileId % 256 / 8) % 16 * ph;
    this.setFrame(sx, sy, pw, ph);
};

Sprite_Character.prototype.updateCharacterFrame = function() {
    var pw = this.patternWidth();
    var ph = this.patternHeight();
    var sx = (this.characterBlockX() + this.characterPatternX()) * pw;
    var sy = (this.characterBlockY() + this.characterPatternY()) * ph;
    this.updateHalfBodySprites();
    if (this._bushDepth > 0) {
        var d = this._bushDepth;
        this._upperBody.setFrame(sx, sy, pw, ph - d);
        this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
        this.setFrame(sx, sy, 0, ph);
    } else {
        this.setFrame(sx, sy, pw, ph);
    }
};

Sprite_Character.prototype.characterBlockX = function() {
    if (this._isBigCharacter) {
        return 0;
    } else {
        var index = this._character.characterIndex();
        return index % 4 * 3;
    }
};

Sprite_Character.prototype.characterBlockY = function() {
    if (this._isBigCharacter) {
        return 0;
    } else {
        var index = this._character.characterIndex();
        return Math.floor(index / 4) * 4;
    }
};

Sprite_Character.prototype.characterPatternX = function() {
    return this._character.pattern();
};

Sprite_Character.prototype.characterPatternY = function() {
    return (this._character.direction() - 2) / 2;
};

Sprite_Character.prototype.patternWidth = function() {
    if (this._tileId > 0) {
        return $gameMap.tileWidth();
    } else if (this._isBigCharacter) {
        return this.bitmap.width / 3;
    } else {
        return this.bitmap.width / 12;
    }
};

Sprite_Character.prototype.patternHeight = function() {
    if (this._tileId > 0) {
        return $gameMap.tileHeight();
    } else if (this._isBigCharacter) {
        return this.bitmap.height / 4;
    } else {
        return this.bitmap.height / 8;
    }
};

Sprite_Character.prototype.updateHalfBodySprites = function() {
    if (this._bushDepth > 0) {
        this.createHalfBodySprites();
        this._upperBody.bitmap = this.bitmap;
        this._upperBody.visible = true;
        this._upperBody.y = - this._bushDepth;
        this._lowerBody.bitmap = this.bitmap;
        this._lowerBody.visible = true;
        this._upperBody.setBlendColor(this.getBlendColor());
        this._lowerBody.setBlendColor(this.getBlendColor());
        this._upperBody.setColorTone(this.getColorTone());
        this._lowerBody.setColorTone(this.getColorTone());
    } else if (this._upperBody) {
        this._upperBody.visible = false;
        this._lowerBody.visible = false;
    }
};

Sprite_Character.prototype.createHalfBodySprites = function() {
    if (!this._upperBody) {
        this._upperBody = new Sprite();
        this._upperBody.anchor.x = 0.5;
        this._upperBody.anchor.y = 1;
        this.addChild(this._upperBody);
    }
    if (!this._lowerBody) {
        this._lowerBody = new Sprite();
        this._lowerBody.anchor.x = 0.5;
        this._lowerBody.anchor.y = 1;
        this._lowerBody.opacity = 128;
        this.addChild(this._lowerBody);
    }
};

Sprite_Character.prototype.updatePosition = function() {
    this.x = this._character.screenX();
    this.y = this._character.screenY();
    this.z = this._character.screenZ();
};

Sprite_Character.prototype.updateAnimation = function() {
    this.setupAnimation();
    if (!this.isAnimationPlaying()) {
        this._character.endAnimation();
    }
    if (!this.isBalloonPlaying()) {
        this._character.endBalloon();
    }
};

Sprite_Character.prototype.updateOther = function() {
    this.opacity = this._character.opacity();
    this.blendMode = this._character.blendMode();
    this._bushDepth = this._character.bushDepth();
};

Sprite_Character.prototype.setupAnimation = function() {
    if (this._character.animationId() > 0) {
        var animation = $dataAnimations[this._character.animationId()];
        this.startAnimation(animation, false, 0);
        this._character.startAnimation();
    }
};

Sprite_Character.prototype.setupBalloon = function() {
    if (this._character.balloonId() > 0) {
        this.startBalloon();
        this._character.startBalloon();
    }
};

Sprite_Character.prototype.startBalloon = function() {
    if (!this._balloonSprite) {
        this._balloonSprite = new Sprite_Balloon();
    }
    this._balloonSprite.setup(this._character.balloonId());
    this.parent.addChild(this._balloonSprite);
};

Sprite_Character.prototype.updateBalloon = function() {
    this.setupBalloon();
    if (this._balloonSprite) {
        this._balloonSprite.x = this.x;
        this._balloonSprite.y = this.y - this.height;
        if (!this._balloonSprite.isPlaying()) {
            this.endBalloon();
        }
    }
};

Sprite_Character.prototype.endBalloon = function() {
    if (this._balloonSprite) {
        this.parent.removeChild(this._balloonSprite);
        this._balloonSprite = null;
    }
};

Sprite_Character.prototype.isBalloonPlaying = function() {
    return !!this._balloonSprite;
};

//-----------------------------------------------------------------------------
// Sprite_Battler
//
// The superclass of Sprite_Actor and Sprite_Enemy.

function Sprite_Battler() {
    this.initialize.apply(this, arguments);
}

Sprite_Battler.prototype = Object.create(Sprite_Base.prototype);
Sprite_Battler.prototype.constructor = Sprite_Battler;

//-----------------------------------------------------------------------------
//Initialize

Sprite_Battler.MOTIONS = {
    idle:       {index: 0, patterns: 7, loop: true},
    run:        {index: 1, patterns: 6, loop: false},
    back:       {index: 2, patterns: 3, loop: false},
    guard:      {index: 3, patterns: 8, loop: false},
    evade:      {index: 4, patterns: 7, loop: false},
    damaged:    {index: 5, patterns: 7, loop: false},
    dying:      {index: 6, patterns: 7, loop: true},
    dead:       {index: 7, patterns: 7, loop: false},
    melee:      {index: 9, patterns: 8, loop: false},
    missile:    {index: 10, patterns: 7, loop: false},
    channel:    {index: 11, patterns: 7, loop: false},
    toss:       {index: 12, patterns: 7, loop: false},
    victory:    {index: 13, patterns: 7, loop: false},
    asleep:     {index: 14, patterns: 7, loop: true}
};

Sprite_Battler.prototype.initialize = function(battler, enemy) {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers(enemy);
    this.setBattler(battler);
};

Sprite_Battler.prototype.initMembers = function(enemy) {
    this.anchor.x = 0.5;
    this.anchor.y = 1;
    this._battler = null;
    this._isEnemy = enemy;
    this._damages = [];
    this._homeX = 0;
    this._homeY = 0;
    this._offsetX = 0;
    this._offsetY = 0;
    this._targetOffsetX = NaN;
    this._targetOffsetY = NaN;
    this._movementDuration = 0;
    this._selectionEffectCount = 0;
    this._battlerName = '';
    this._motion = 0;
    this._motionCount = 0;
    this._pattern = 0;
    this._appeared = false;
    this._battlerHue = 0;
    this._effectType = null;
    this._effectDuration = 0;
    this._shake = 0;
    this._scaled = false;
    this._needMirror = false;
    this._retreating = false;
    this.createShadowSprite();
    this.createWeaponSprite();
    this.createMainSprite();
    this.createStateSprite();
};

Sprite_Battler.prototype.setBattler = function(battler) {
    var changed = (battler !== this._battler);
    if (changed) {
        this._battler = battler;
        this.startEntryMotion();
        this._stateSprite.setup(battler);
    }
};

Sprite_Battler.prototype.setHome = function(x, y) {
    this._homeX = x;
    this._homeY = y;
    this.updatePosition();
};
//-----------------------------------------------------------------------------
//Create

Sprite_Battler.prototype.createMainSprite = function() {
    this._mainSprite = new Sprite_Base();
    this._mainSprite.anchor.x = 0.5;
    this._mainSprite.anchor.y = 1;
    this.addChild(this._mainSprite);
    this._effectTarget = this._mainSprite;
};

Sprite_Battler.prototype.createShadowSprite = function() {
    this._shadowSprite = new Sprite();
    this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow2');
    this._shadowSprite.anchor.x = 0.5;
    this._shadowSprite.anchor.y = 0.5;
    this._shadowSprite.y = -2;
    this.addChild(this._shadowSprite);
};

Sprite_Battler.prototype.createWeaponSprite = function() {
    this._weaponSprite = new Sprite_Weapon();
    this.addChild(this._weaponSprite);
};

Sprite_Battler.prototype.createStateSprite = function() {
    this._stateSprite = new Sprite_StateOverlay();
    this.addChild(this._stateSprite);
};

Sprite_Battler.prototype.damageOffsetX = function() {
    return 0;
};

Sprite_Battler.prototype.damageOffsetY = function() {
    return -8;
};

//-----------------------------------------------------------------------------
//Update

Sprite_Battler.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    if (this._battler) {
        this.updateMain();
        this.updateAnimation();
        this.updateDamagePopup();
        this.updateSelectionEffect();
        this.updateMotion();
        if (this._isEnemy) this.updateEffect();
    } else {
        this.bitmap = null;
    }
    this.updateShadow();
};

Sprite_Battler.prototype.updateVisibility = function() {
    Sprite_Base.prototype.updateVisibility.call(this);
    if (!this._battler || !this._battler.isSpriteVisible()) {
        this.visible = false;
    }
};

Sprite_Battler.prototype.updateMain = function() {
    if (this._battler.isSpriteVisible()) {
        if (!this.isMoving()) this.updateTargetPosition();
        this.updateBitmap();
        this.updateFrame();
    }
    this.updateMove();
    this.updatePosition();
};

Sprite_Battler.prototype.updateMove = function() {
    var bitmap = this._mainSprite.bitmap;
    if (!bitmap || bitmap.isReady()) {
        if (this._movementDuration > 0) {
            var d = this._movementDuration;
            this._offsetX = (this._offsetX * (d - 1) + this._targetOffsetX) / d;
            this._offsetY = (this._offsetY * (d - 1) + this._targetOffsetY) / d;
            this._movementDuration--;
            if (this._movementDuration === 0) {
                this.onMoveEnd();
            }
        }
    }
};

Sprite_Battler.prototype.updatePosition = function() {
    this.x = this._homeX + this._offsetX;
    this.y = this._homeY + this._offsetY;
};

Sprite_Battler.prototype.updateAnimation = function() {
    this.setupAnimation();
};

Sprite_Battler.prototype.updateDamagePopup = function() {
    this.setupDamagePopup();
    if (this._damages.length > 0) {
        for (var i = 0; i < this._damages.length; i++) {
            this._damages[i].update();
        }
        if (!this._damages[0].isPlaying()) {
            this.parent.removeChild(this._damages[0]);
            this._damages.shift();
        }
    }
};

Sprite_Battler.prototype.updateSelectionEffect = function() {
    var target = this._effectTarget;
    if (this._battler.isSelected()) {
        this._selectionEffectCount++;
        if (this._selectionEffectCount % 30 < 15) {
            target.setBlendColor([255, 255, 255, 64]);
        } else {
            target.setBlendColor([0, 0, 0, 0]);
        }
    } else if (this._selectionEffectCount > 0) {
        this._selectionEffectCount = 0;
        target.setBlendColor([0, 0, 0, 0]);
    }
};

Sprite_Battler.prototype.updateShadow = function() {
    this._shadowSprite.visible = !!this._battler;
};

Sprite_Battler.prototype.updateTargetPosition = function() {
    var escaped = BattleManager.isEscaped() && !this._battler.isEnemy();
    if (this._battler.isActing()) {
        if (escaped) {
            if (!this._retreating) this.retreat();
        } else {
            this.stepForward();
        }
    } else if (escaped) {
        if (!this._retreating) this.retreat();
    } else if (!this.inHomePosition()) {
        this.stepBack();
    }
};

Sprite_Battler.prototype.updateBitmap = function() {
    var name = this._battler.battlerName();
    if (this._battlerName !== name) {
        this._battlerName = name;
        this._mainSprite.bitmap = ImageManager.loadSvActor(name);
    }
};

Sprite_Battler.prototype.updateFrame = function() {
    var bitmap = this._mainSprite.bitmap;
    if (bitmap) {
        this.updateScale();
        var motionIndex = this._motion ? this._motion.index : 0;
        var pattern = (this._motion ? this._pattern < this._motion.patterns : false) ? this._pattern : 0;

        // 9: A temporary fix for the currently not working sprite frame
        var cw = Math.floor(bitmap.width / 7) - 9;
        var ch = Math.floor(bitmap.height / 5);
        var cx = pattern;
        var cy = motionIndex % 4;
        this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch);
    }
};

Sprite_Battler.prototype.updateScale = function() {
    if (!this._scaled && this._mainSprite.bitmap.width) this.setScale();
    if (this._needMirror) {
        this.scale.x *= -1;
        this._needMirror = false;
    }
};

Sprite_Battler.prototype.setScale = function() {
    //The width of the sprite after scaled: 66
    var ratio = 66 / (this._mainSprite.bitmap.width / 7);
    this.scale.x *= ratio;
    this.scale.y *= ratio;
    this._scaled = true;
};

Sprite_Battler.prototype.updateMotion = function() {
    this.setupMotion();
    this.setupWeaponAnimation();
    if (this._battler.isMotionRefreshRequested()) {
        this.refreshMotion();
        this._battler.clearMotion();
    }
    this.updateMotionCount();
};

Sprite_Battler.prototype.updateMotionCount = function() {
    if (this._motion && ++this._motionCount >= this.motionSpeed()) {
        if (this._motion.loop) {
            this._pattern = this._pattern === this._motion.patterns ? 0 : this._pattern + 1;
        } else if (this._pattern === this._motion.patterns) {
            this.refreshMotion();
        } else {
            this._pattern++;
        }
        this._motionCount = 0;
    }
};


Sprite_Battler.prototype.motionSpeed = function() {
    return 8;
};

Sprite_Battler.prototype.updateShake = function() {
    this.x += this._shake;
};

Sprite_Battler.prototype.isMotionDone = function() {
};
//-----------------------------------------------------------------------------
//Setup

Sprite_Battler.prototype.setupAnimation = function() {
    while (this._battler.isAnimationRequested()) {
        var data = this._battler.shiftAnimation();
        var animation = $dataAnimations[data.animationId];
        var mirror = data.mirror;
        var delay = animation.position === 3 ? 0 : data.delay;
        this.startAnimation(animation, mirror, delay);
        for (var i = 0; i < this._animationSprites.length; i++) {
            var sprite = this._animationSprites[i];
            sprite.visible = this._battler.isSpriteVisible();
        }
    }
};

Sprite_Battler.prototype.setupDamagePopup = function() {
    if (this._battler.isDamagePopupRequested()) {
        if (this._battler.isSpriteVisible()) {
            var sprite = new Sprite_Damage();
            sprite.x = this.x + this.damageOffsetX();
            sprite.y = this.y + this.damageOffsetY();
            sprite.setup(this._battler);
            this._damages.push(sprite);
            this.parent.addChild(sprite);
        }
        this._battler.clearDamagePopup();
        this._battler.clearResult();
    }
};

Sprite_Battler.prototype.startMove = function(x, y, duration) {
    if (this._targetOffsetX !== x || this._targetOffsetY !== y) {
        this._targetOffsetX = x;
        this._targetOffsetY = y;
        this._movementDuration = duration;
        if (duration === 0) {
            this._offsetX = x;
            this._offsetY = y;
        }
    }
};

Sprite_Battler.prototype.isMoving = function() {
    return this._movementDuration > 0;
};

Sprite_Battler.prototype.inHomePosition = function() {
    return this._offsetX === 0 && this._offsetY === 0;
};

Sprite_Battler.prototype.setSquare = function(squares, index) {
    // The x, y position of a square.
    var sx, sy;
    sx = squares.x + squares.children[index].x;
    sy = squares.y + squares.children[index].y;
    this.setHome(sx, sy);
};

Sprite_Battler.prototype.setupMotion = function() {
    if (this._battler.isMotionRequested()) {
        this.startMotion(this._battler.motionType());
        this._battler.clearMotion();
    }
};

Sprite_Battler.prototype.setupWeaponAnimation = function() {
    if (this._battler.isWeaponAnimationRequested()) {
        this._weaponSprite.setup(this._battler.weaponImageId());
        this._battler.clearWeaponAnimation();
    }
};

Sprite_Battler.prototype.startMotion = function(motionType) {
    var newMotion = Sprite_Battler.MOTIONS[motionType];
    if (this._motion !== newMotion) {
        this._motion = newMotion;
        this._motionCount = 0;
        this._pattern = 0;
    }
};

Sprite_Battler.prototype.refreshMotion = function() {
    var actor = this._battler;
    var motionGuard = Sprite_Battler.MOTIONS['guard'];
    if (actor) {
        if (this._motion === motionGuard && !BattleManager.isInputting()) {
            return;
        }
        var stateMotion = actor.stateMotionIndex();
        if (actor.isInputting() || actor.isActing()) {
            this.startMotion('run');
        } else if (stateMotion === 3) {
            this.startMotion('dead');
        } else if (stateMotion === 2) {
            this.startMotion('sleep');
        } else if (actor.isGuard() || actor.isGuardWaiting()) {
            this.startMotion('guard');
        } else if (actor.isDying()) {
            this.startMotion('dying');
        } else if (actor.isUndecided()) {
            this.startMotion('idle');
        } else {
            this.startMotion('idle');
        }
    }
};

Sprite_Battler.prototype.startEntryMotion = function() {
    if (this._battler) {
        this.refreshMotion();
        this.startMotion('idle');
        this.startMove(0, 0, 0);
    }
};

Sprite_Battler.prototype.stepForward = function() {
    if (!this._isEnemy) {
        this.startMove(48, 0, 12)
    } else this.startMove(-48, 0, 12);
};

Sprite_Battler.prototype.stepBack = function() {
    this.startMove(0, 0, 12);
};

Sprite_Battler.prototype.retreat = function() {
    this._needMirror = true;
    this._retreating = true;
    this.startMove(-400, 0, 30);
};

Sprite_Battler.prototype.onMoveEnd = function() {
    if (!BattleManager.isBattleEnd()) {
        this.refreshMotion();
    }
};

//-----------------------------------------------------------------------------
//Special Effects

Sprite_Battler.prototype.initVisibility = function() {
    this._appeared = this._battler.isAlive();
    if (!this._appeared) {
        this.opacity = 0;
    }
};

Sprite_Battler.prototype.setupEffect = function() {
    if (this._appeared && this._battler.isEffectRequested()) {
        this.startEffect(this._battler.effectType());
        this._battler.clearEffect();
    }
    if (!this._appeared && this._battler.isAlive()) {
        this.startEffect('appear');
    } else if (this._appeared && this._battler.isHidden()) {
        this.startEffect('disappear');
    }
};

Sprite_Battler.prototype.startEffect = function(effectType) {
    this._effectType = effectType;
    switch (this._effectType) {
        case 'appear':
            this.startAppear();
            break;
        case 'disappear':
            this.startDisappear();
            break;
        case 'whiten':
            this.startWhiten();
            break;
        case 'blink':
            this.startBlink();
            break;
        case 'collapse':
            this.startCollapse();
            break;
        case 'bossCollapse':
            this.startBossCollapse();
            break;
        case 'instantCollapse':
            this.startInstantCollapse();
            break;
    }
    this.revertToNormal();
};

Sprite_Battler.prototype.startAppear = function() {
    this._effectDuration = 16;
    this._appeared = true;
};

Sprite_Battler.prototype.startDisappear = function() {
    this._effectDuration = 32;
    this._appeared = false;
};

Sprite_Battler.prototype.startWhiten = function() {
    this._effectDuration = 16;
};

Sprite_Battler.prototype.startBlink = function() {
    this._effectDuration = 20;
};

Sprite_Battler.prototype.startCollapse = function() {
    this._effectDuration = 32;
    this._appeared = false;
};

Sprite_Battler.prototype.startBossCollapse = function() {
    this._effectDuration = this.bitmap.height;
    this._appeared = false;
};

Sprite_Battler.prototype.startInstantCollapse = function() {
    this._effectDuration = 16;
    this._appeared = false;
};

Sprite_Battler.prototype.updateEffect = function() {
    this.setupEffect();
    if (this._effectDuration > 0) {
        this._effectDuration--;
        switch (this._effectType) {
            case 'whiten':
                this.updateWhiten();
                break;
            case 'blink':
                this.updateBlink();
                break;
            case 'appear':
                this.updateAppear();
                break;
            case 'disappear':
                this.updateDisappear();
                break;
            case 'collapse':
                this.updateCollapse();
                break;
            case 'bossCollapse':
                this.updateBossCollapse();
                break;
            case 'instantCollapse':
                this.updateInstantCollapse();
                break;
        }
        if (this._effectDuration === 0) {
            this._effectType = null;
        }
    }
};

Sprite_Battler.prototype.isEffecting = function() {
    return this._effectType !== null;
};

Sprite_Battler.prototype.revertToNormal = function() {
    this._shake = 0;
    this.blendMode = 0;
    this.opacity = 255;
    this.setBlendColor([0, 0, 0, 0]);
};

Sprite_Battler.prototype.updateWhiten = function() {
    var alpha = 128 - (16 - this._effectDuration) * 10;
    this.setBlendColor([255, 255, 255, alpha]);
};

Sprite_Battler.prototype.updateBlink = function() {
    this.opacity = (this._effectDuration % 10 < 5) ? 255 : 0;
};

Sprite_Battler.prototype.updateAppear = function() {
    this.opacity = (16 - this._effectDuration) * 16;
};

Sprite_Battler.prototype.updateDisappear = function() {
    this.opacity = 256 - (32 - this._effectDuration) * 10;
};

Sprite_Battler.prototype.updateCollapse = function() {
    this.blendMode = Graphics.BLEND_ADD;
    this.setBlendColor([255, 128, 128, 128]);
    this.opacity *= this._effectDuration / (this._effectDuration + 1);
};

Sprite_Battler.prototype.updateBossCollapse = function() {
    this._shake = this._effectDuration % 2 * 4 - 2;
    this.blendMode = Graphics.BLEND_ADD;
    this.opacity *= this._effectDuration / (this._effectDuration + 1);
    this.setBlendColor([255, 255, 255, 255 - this.opacity]);
    if (this._effectDuration % 20 === 19) {
        SoundManager.playBossCollapse2();
    }
};

Sprite_Battler.prototype.updateInstantCollapse = function() {
    this.opacity = 0;
};
//-----------------------------------------------------------------------------
// Sprite_Animation
//
// The sprite for displaying an animation.

function Sprite_Animation() {
    this.initialize.apply(this, arguments);
}

Sprite_Animation.prototype = Object.create(Sprite.prototype);
Sprite_Animation.prototype.constructor = Sprite_Animation;

Sprite_Animation._checker1 = {};
Sprite_Animation._checker2 = {};

Sprite_Animation.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._reduceArtifacts = true;
    this.initMembers();
};

Sprite_Animation.prototype.initMembers = function() {
    this._target = null;
    this._animation = null;
    this._mirror = false;
    this._delay = 0;
    this._rate = 4;
    this._duration = 0;
    this._flashColor = [0, 0, 0, 0];
    this._flashDuration = 0;
    this._screenFlashDuration = 0;
    this._hidingDuration = 0;
    this._bitmap1 = null;
    this._bitmap2 = null;
    this._cellSprites = [];
    this._screenFlashSprite = null;
    this._duplicated = false;
    this.z = 8;
};

Sprite_Animation.prototype.setup = function(target, animation, mirror, delay) {
    this._target = target;
    this._animation = animation;
    this._mirror = mirror;
    this._delay = delay;
    if (this._animation) {
        this.remove();
        this.setupRate();
        this.setupDuration();
        this.loadBitmaps();
        this.createSprites();
    }
};

Sprite_Animation.prototype.remove = function() {
    if (this.parent && this.parent.removeChild(this)) {
        this._target.setBlendColor([0, 0, 0, 0]);
        this._target.show();
    }
};

Sprite_Animation.prototype.setupRate = function() {
    this._rate = 4;
};

Sprite_Animation.prototype.setupDuration = function() {
    this._duration = this._animation.frames.length * this._rate + 1;
};

Sprite_Animation.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateMain();
    this.updateFlash();
    this.updateScreenFlash();
    this.updateHiding();
    Sprite_Animation._checker1 = {};
    Sprite_Animation._checker2 = {};
};

Sprite_Animation.prototype.updateFlash = function() {
    if (this._flashDuration > 0) {
        var d = this._flashDuration--;
        this._flashColor[3] *= (d - 1) / d;
        this._target.setBlendColor(this._flashColor);
    }
};

Sprite_Animation.prototype.updateScreenFlash = function() {
    if (this._screenFlashDuration > 0) {
        var d = this._screenFlashDuration--;
        if (this._screenFlashSprite) {
            this._screenFlashSprite.x = -this.absoluteX();
            this._screenFlashSprite.y = -this.absoluteY();
            this._screenFlashSprite.opacity *= (d - 1) / d;
            this._screenFlashSprite.visible = (this._screenFlashDuration > 0);
        }
    }
};

Sprite_Animation.prototype.absoluteX = function() {
    var x = 0;
    var object = this;
    while (object) {
        x += object.x;
        object = object.parent;
    }
    return x;
};

Sprite_Animation.prototype.absoluteY = function() {
    var y = 0;
    var object = this;
    while (object) {
        y += object.y;
        object = object.parent;
    }
    return y;
};

Sprite_Animation.prototype.updateHiding = function() {
    if (this._hidingDuration > 0) {
        this._hidingDuration--;
        if (this._hidingDuration === 0) {
            this._target.show();
        }
    }
};

Sprite_Animation.prototype.isPlaying = function() {
    return this._duration > 0;
};

Sprite_Animation.prototype.loadBitmaps = function() {
    var name1 = this._animation.animation1Name;
    var name2 = this._animation.animation2Name;
    var hue1 = this._animation.animation1Hue;
    var hue2 = this._animation.animation2Hue;
    this._bitmap1 = ImageManager.loadAnimation(name1, hue1);
    this._bitmap2 = ImageManager.loadAnimation(name2, hue2);
};

Sprite_Animation.prototype.isReady = function() {
    return this._bitmap1 && this._bitmap1.isReady() && this._bitmap2 && this._bitmap2.isReady();
};

Sprite_Animation.prototype.createSprites = function() {
    if (!Sprite_Animation._checker2[this._animation]) {
        this.createCellSprites();
        if (this._animation.position === 3) {
            Sprite_Animation._checker2[this._animation] = true;
        }
        this.createScreenFlashSprite();
    }
    if (Sprite_Animation._checker1[this._animation]) {
        this._duplicated = true;
    } else {
        this._duplicated = false;
        if (this._animation.position === 3) {
            Sprite_Animation._checker1[this._animation] = true;
        }
    }
};

Sprite_Animation.prototype.createCellSprites = function() {
    this._cellSprites = [];
    for (var i = 0; i < 16; i++) {
        var sprite = new Sprite();
        sprite.anchor.set(0.5);
        this._cellSprites.push(sprite);
        this.addChild(sprite);
    }
};

Sprite_Animation.prototype.createScreenFlashSprite = function() {
    this._screenFlashSprite = new ScreenSprite();
    this.addChild(this._screenFlashSprite);
};

Sprite_Animation.prototype.updateMain = function() {
    if (this.isPlaying() && this.isReady()) {
        if (this._delay > 0) {
            this._delay--;
        } else {
            this._duration--;
            this.updatePosition();
            if (this._duration % this._rate === 0) {
                this.updateFrame();
            }
        }
    }
};

Sprite_Animation.prototype.updatePosition = function() {
    if (this._animation.position === 3) {
        this.x = this.parent.width / 2;
        this.y = this.parent.height / 2;
    } else {
        var parent = this._target.parent;
        var grandparent = parent ? parent.parent : null;
        this.x = this._target.x;
        this.y = this._target.y;
        if (this.parent === grandparent) {
            this.x += parent.x;
            this.y += parent.y;
        }
        if (this._animation.position === 0) {
            this.y -= this._target.height;
        } else if (this._animation.position === 1) {
            this.y -= this._target.height / 2;
        }
    }
};

Sprite_Animation.prototype.updateFrame = function() {
    if (this._duration > 0) {
        var frameIndex = this.currentFrameIndex();
        this.updateAllCellSprites(this._animation.frames[frameIndex]);
        this._animation.timings.forEach(function(timing) {
            if (timing.frame === frameIndex) {
                this.processTimingData(timing);
            }
        }, this);
    }
};

Sprite_Animation.prototype.currentFrameIndex = function() {
    return (this._animation.frames.length -
            Math.floor((this._duration + this._rate - 1) / this._rate));
};

Sprite_Animation.prototype.updateAllCellSprites = function(frame) {
    for (var i = 0; i < this._cellSprites.length; i++) {
        var sprite = this._cellSprites[i];
        if (i < frame.length) {
            this.updateCellSprite(sprite, frame[i]);
        } else {
            sprite.visible = false;
        }
    }
};

Sprite_Animation.prototype.updateCellSprite = function(sprite, cell) {
    var pattern = cell[0];
    if (pattern >= 0) {
        var sx = pattern % 5 * 192;
        var sy = Math.floor(pattern % 100 / 5) * 192;
        var mirror = this._mirror;
        sprite.bitmap = pattern < 100 ? this._bitmap1 : this._bitmap2;
        sprite.setFrame(sx, sy, 192, 192);
        sprite.position.set(cell[1], cell[2]);
        sprite.rotation = cell[4] * Math.PI / 180;
        sprite.scale.x = cell[3] / 100;

        if(cell[5]){
            sprite.scale.x *= -1;
        }
        if(mirror){
            sprite.x *= -1;
            sprite.rotation *= -1;
            sprite.scale.x *= -1;
        }

        sprite.scale.y = cell[3] / 100;
        sprite.opacity = cell[6];
        sprite.blendMode = cell[7];
        sprite.visible = true;
    } else {
        sprite.visible = false;
    }
};

Sprite_Animation.prototype.processTimingData = function(timing) {
    var duration = timing.flashDuration * this._rate;
    switch (timing.flashScope) {
    case 1:
        this.startFlash(timing.flashColor, duration);
        break;
    case 2:
        this.startScreenFlash(timing.flashColor, duration);
        break;
    case 3:
        this.startHiding(duration);
        break;
    }
    if (!this._duplicated && timing.se) {
        AudioManager.playSe(timing.se);
    }
};

Sprite_Animation.prototype.startFlash = function(color, duration) {
    this._flashColor = color.clone();
    this._flashDuration = duration;
};

Sprite_Animation.prototype.startScreenFlash = function(color, duration) {
    this._screenFlashDuration = duration;
    if (this._screenFlashSprite) {
        this._screenFlashSprite.setColor(color[0], color[1], color[2]);
        this._screenFlashSprite.opacity = color[3];
    }
};

Sprite_Animation.prototype.startHiding = function(duration) {
    this._hidingDuration = duration;
    this._target.hide();
};

//-----------------------------------------------------------------------------
// Sprite_Damage
//
// The sprite for displaying a popup damage.

function Sprite_Damage() {
    this.initialize.apply(this, arguments);
}

Sprite_Damage.prototype = Object.create(Sprite.prototype);
Sprite_Damage.prototype.constructor = Sprite_Damage;

Sprite_Damage.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._duration = 90;
    this._flashColor = [0, 0, 0, 0];
    this._flashDuration = 0;
    this._damageBitmap = ImageManager.loadSystem('Damage');
};

Sprite_Damage.prototype.setup = function(target) {
    var result = target.result();
    if (result.missed || result.evaded) {
        this.createMiss();
    } else if (result.hpAffected) {
        this.createDigits(0, result.hpDamage);
    } else if (target.isAlive() && result.mpDamage !== 0) {
        this.createDigits(2, result.mpDamage);
    }
    if (result.critical) {
        this.setupCriticalEffect();
    }
};

Sprite_Damage.prototype.setupCriticalEffect = function() {
    this._flashColor = [255, 0, 0, 160];
    this._flashDuration = 60;
};

Sprite_Damage.prototype.digitWidth = function() {
    return this._damageBitmap ? this._damageBitmap.width / 10 : 0;
};

Sprite_Damage.prototype.digitHeight = function() {
    return this._damageBitmap ? this._damageBitmap.height / 5 : 0;
};

Sprite_Damage.prototype.createMiss = function() {
    var w = this.digitWidth();
    var h = this.digitHeight();
    var sprite = this.createChildSprite();
    sprite.setFrame(0, 4 * h, 4 * w, h);
    sprite.dy = 0;
};

Sprite_Damage.prototype.createDigits = function(baseRow, value) {
    var string = Math.abs(value).toString();
    var row = baseRow + (value < 0 ? 1 : 0);
    var w = this.digitWidth();
    var h = this.digitHeight();
    for (var i = 0; i < string.length; i++) {
        var sprite = this.createChildSprite();
        var n = Number(string[i]);
        sprite.setFrame(n * w, row * h, w, h);
        sprite.x = (i - (string.length - 1) / 2) * w;
        sprite.dy = -i;
    }
};

Sprite_Damage.prototype.createChildSprite = function() {
    var sprite = new Sprite();
    sprite.bitmap = this._damageBitmap;
    sprite.anchor.set(0.5, 1);
    sprite.y = -40;
    sprite.ry = sprite.y;
    this.addChild(sprite);
    return sprite;
};

Sprite_Damage.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (this._duration > 0) {
        this._duration--;
        for (var i = 0; i < this.children.length; i++) {
            this.updateChild(this.children[i]);
        }
    }
    this.updateFlash();
    this.updateOpacity();
};

Sprite_Damage.prototype.updateChild = function(sprite) {
    sprite.dy += 0.5;
    sprite.ry += sprite.dy;
    if (sprite.ry >= 0) {
        sprite.ry = 0;
        sprite.dy *= -0.6;
    }
    sprite.y = Math.round(sprite.ry);
    sprite.setBlendColor(this._flashColor);
};

Sprite_Damage.prototype.updateFlash = function() {
    if (this._flashDuration > 0) {
        var d = this._flashDuration--;
        this._flashColor[3] *= (d - 1) / d;
    }
};

Sprite_Damage.prototype.updateOpacity = function() {
    if (this._duration < 10) {
        this.opacity = 255 * this._duration / 10;
    }
};

Sprite_Damage.prototype.isPlaying = function() {
    return this._duration > 0;
};

//-----------------------------------------------------------------------------
// Sprite_StateIcon
//
// The sprite for displaying state icons.

function Sprite_StateIcon() {
    this.initialize.apply(this, arguments);
}

Sprite_StateIcon.prototype = Object.create(Sprite.prototype);
Sprite_StateIcon.prototype.constructor = Sprite_StateIcon;

Sprite_StateIcon.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.initMembers();
    this.loadBitmap();
};

Sprite_StateIcon._iconWidth  = 32;
Sprite_StateIcon._iconHeight = 32;

Sprite_StateIcon.prototype.initMembers = function() {
    this._battler = null;
    this._iconIndex = 0;
    this._animationCount = 0;
    this._animationIndex = 0;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
};

Sprite_StateIcon.prototype.loadBitmap = function() {
    this.bitmap = ImageManager.loadSystem('IconSet');
    this.setFrame(0, 0, 0, 0);
};

Sprite_StateIcon.prototype.setup = function(battler) {
    this._battler = battler;
};

Sprite_StateIcon.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this._animationCount++;
    if (this._animationCount >= this.animationWait()) {
        this.updateIcon();
        this.updateFrame();
        this._animationCount = 0;
    }
};

Sprite_StateIcon.prototype.animationWait = function() {
    return 40;
};

Sprite_StateIcon.prototype.updateIcon = function() {
    var icons = [];
    if (this._battler && this._battler.isAlive()) {
        icons = this._battler.allIcons();
    }
    if (icons.length > 0) {
        this._animationIndex++;
        if (this._animationIndex >= icons.length) {
            this._animationIndex = 0;
        }
        this._iconIndex = icons[this._animationIndex];
    } else {
        this._animationIndex = 0;
        this._iconIndex = 0;
    }
};

Sprite_StateIcon.prototype.updateFrame = function() {
    var pw = Sprite_StateIcon._iconWidth;
    var ph = Sprite_StateIcon._iconHeight;
    var sx = this._iconIndex % 16 * pw;
    var sy = Math.floor(this._iconIndex / 16) * ph;
    this.setFrame(sx, sy, pw, ph);
};

//-----------------------------------------------------------------------------
// Sprite_StateOverlay
//
// The sprite for displaying an overlay image for a state.

function Sprite_StateOverlay() {
    this.initialize.apply(this, arguments);
}

Sprite_StateOverlay.prototype = Object.create(Sprite_Base.prototype);
Sprite_StateOverlay.prototype.constructor = Sprite_StateOverlay;

Sprite_StateOverlay.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
    this.loadBitmap();
};

Sprite_StateOverlay.prototype.initMembers = function() {
    this._battler = null;
    this._overlayIndex = 0;
    this._animationCount = 0;
    this._pattern = 0;
    this.anchor.x = 0.5;
    this.anchor.y = 1;
};

Sprite_StateOverlay.prototype.loadBitmap = function() {
    this.bitmap = ImageManager.loadSystem('States');
    this.setFrame(0, 0, 0, 0);
};

Sprite_StateOverlay.prototype.setup = function(battler) {
    this._battler = battler;
};

Sprite_StateOverlay.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this._animationCount++;
    if (this._animationCount >= this.animationWait()) {
        this.updatePattern();
        this.updateFrame();
        this._animationCount = 0;
    }
};

Sprite_StateOverlay.prototype.animationWait = function() {
    return 8;
};

Sprite_StateOverlay.prototype.updatePattern = function() {
    this._pattern++;
    this._pattern %= 8;
    if (this._battler) {
        this._overlayIndex = this._battler.stateOverlayIndex();
    }
};

Sprite_StateOverlay.prototype.updateFrame = function() {
    if (this._overlayIndex > 0) {
        var w = 96;
        var h = 96;
        var sx = this._pattern * w;
        var sy = (this._overlayIndex - 1) * h;
        this.setFrame(sx, sy, w, h);
    } else {
        this.setFrame(0, 0, 0, 0);
    }
};

//-----------------------------------------------------------------------------
// Sprite_Weapon
//
// The sprite for displaying a weapon image for attacking.

function Sprite_Weapon() {
    this.initialize.apply(this, arguments);
}

Sprite_Weapon.prototype = Object.create(Sprite_Base.prototype);
Sprite_Weapon.prototype.constructor = Sprite_Weapon;

Sprite_Weapon.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
};

Sprite_Weapon.prototype.initMembers = function() {
    this._weaponImageId = 0;
    this._animationCount = 0;
    this._pattern = 0;
    this.anchor.x = 0.5;
    this.anchor.y = 1;
    this.x = -16;
};

Sprite_Weapon.prototype.setup = function(weaponImageId) {
    this._weaponImageId = weaponImageId;
    this._animationCount = 0;
    this._pattern = 0;
    this.loadBitmap();
    this.updateFrame();
};

Sprite_Weapon.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this._animationCount++;
    if (this._animationCount >= this.animationWait()) {
        this.updatePattern();
        this.updateFrame();
        this._animationCount = 0;
    }
};

Sprite_Weapon.prototype.animationWait = function() {
    return 12;
};

Sprite_Weapon.prototype.updatePattern = function() {
    this._pattern++;
    if (this._pattern >= 3) {
        this._weaponImageId = 0;
    }
};

Sprite_Weapon.prototype.loadBitmap = function() {
    var pageId = Math.floor((this._weaponImageId - 1) / 12) + 1;
    if (pageId >= 1) {
        this.bitmap = ImageManager.loadSystem('Weapons' + pageId);
    } else {
        this.bitmap = ImageManager.loadSystem('');
    }
};

Sprite_Weapon.prototype.updateFrame = function() {
    if (this._weaponImageId > 0) {
        var index = (this._weaponImageId - 1) % 12;
        var w = 96;
        var h = 64;
        var sx = (Math.floor(index / 6) * 3 + this._pattern) * w;
        var sy = Math.floor(index % 6) * h;
        this.setFrame(sx, sy, w, h);
    } else {
        this.setFrame(0, 0, 0, 0);
    }
};

Sprite_Weapon.prototype.isPlaying = function() {
    return this._weaponImageId > 0;
};

//-----------------------------------------------------------------------------
// Sprite_Balloon
//
// The sprite for displaying a balloon icon.

function Sprite_Balloon() {
    this.initialize.apply(this, arguments);
}

Sprite_Balloon.prototype = Object.create(Sprite_Base.prototype);
Sprite_Balloon.prototype.constructor = Sprite_Balloon;

Sprite_Balloon.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
    this.loadBitmap();
};

Sprite_Balloon.prototype.initMembers = function() {
    this._balloonId = 0;
    this._duration = 0;
    this.anchor.x = 0.5;
    this.anchor.y = 1;
    this.z = 7;
};

Sprite_Balloon.prototype.loadBitmap = function() {
    this.bitmap = ImageManager.loadSystem('Balloon');
    this.setFrame(0, 0, 0, 0);
};

Sprite_Balloon.prototype.setup = function(balloonId) {
    this._balloonId = balloonId;
    this._duration = 8 * this.speed() + this.waitTime();
};

Sprite_Balloon.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    if (this._duration > 0) {
        this._duration--;
        if (this._duration > 0) {
            this.updateFrame();
        }
    }
};

Sprite_Balloon.prototype.updateFrame = function() {
    var w = 48;
    var h = 48;
    var sx = this.frameIndex() * w;
    var sy = (this._balloonId - 1) * h;
    this.setFrame(sx, sy, w, h);
};

Sprite_Balloon.prototype.speed = function() {
    return 8;
};

Sprite_Balloon.prototype.waitTime = function() {
    return 12;
};

Sprite_Balloon.prototype.frameIndex = function() {
    var index = (this._duration - this.waitTime()) / this.speed();
    return 7 - Math.max(Math.floor(index), 0);
};

Sprite_Balloon.prototype.isPlaying = function() {
    return this._duration > 0;
};

//-----------------------------------------------------------------------------
// Sprite_Picture
//
// The sprite for displaying a picture.

function Sprite_Picture() {
    this.initialize.apply(this, arguments);
}

Sprite_Picture.prototype = Object.create(Sprite.prototype);
Sprite_Picture.prototype.constructor = Sprite_Picture;

Sprite_Picture.prototype.initialize = function(pictureId) {
    Sprite.prototype.initialize.call(this);
    this._pictureId = pictureId;
    this._pictureName = '';
    this._isPicture = true;
    this.update();
};

Sprite_Picture.prototype.picture = function() {
    return $gameScreen.picture(this._pictureId);
};

Sprite_Picture.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateBitmap();
    if (this.visible) {
        this.updateOrigin();
        this.updatePosition();
        this.updateScale();
        this.updateTone();
        this.updateOther();
    }
};

Sprite_Picture.prototype.updateBitmap = function() {
    var picture = this.picture();
    if (picture) {
        var pictureName = picture.name();
        if (this._pictureName !== pictureName) {
            this._pictureName = pictureName;
            this.loadBitmap();
        }
        this.visible = true;
    } else {
        this._pictureName = '';
        this.bitmap = null;
        this.visible = false;
    }
};

Sprite_Picture.prototype.updateOrigin = function() {
    var picture = this.picture();
    if (picture.origin() === 0) {
        this.anchor.x = 0;
        this.anchor.y = 0;
    } else {
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    }
};

Sprite_Picture.prototype.updatePosition = function() {
    var picture = this.picture();
    this.x = Math.floor(picture.x());
    this.y = Math.floor(picture.y());
};

Sprite_Picture.prototype.updateScale = function() {
    var picture = this.picture();
    this.scale.x = picture.scaleX() / 100;
    this.scale.y = picture.scaleY() / 100;
};

Sprite_Picture.prototype.updateTone = function() {
    var picture = this.picture();
    if (picture.tone()) {
        this.setColorTone(picture.tone());
    } else {
        this.setColorTone([0, 0, 0, 0]);
    }
};

Sprite_Picture.prototype.updateOther = function() {
    var picture = this.picture();
    this.opacity = picture.opacity();
    this.blendMode = picture.blendMode();
    this.rotation = picture.angle() * Math.PI / 180;
};

Sprite_Picture.prototype.loadBitmap = function() {
    this.bitmap = ImageManager.loadPicture(this._pictureName);
};

//-----------------------------------------------------------------------------
// Sprite_Timer
//
// The sprite for displaying the timer.

function Sprite_Timer() {
    this.initialize.apply(this, arguments);
}

Sprite_Timer.prototype = Object.create(Sprite.prototype);
Sprite_Timer.prototype.constructor = Sprite_Timer;

Sprite_Timer.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._seconds = 0;
    this.createBitmap();
    this.update();
};

Sprite_Timer.prototype.createBitmap = function() {
    this.bitmap = new Bitmap(96, 48);
    this.bitmap.fontSize = 32;
};

Sprite_Timer.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateBitmap();
    this.updatePosition();
    this.updateVisibility();
};

Sprite_Timer.prototype.updateBitmap = function() {
    if (this._seconds !== $gameTimer.seconds()) {
        this._seconds = $gameTimer.seconds();
        this.redraw();
    }
};

Sprite_Timer.prototype.redraw = function() {
    var text = this.timerText();
    var width = this.bitmap.width;
    var height = this.bitmap.height;
    this.bitmap.clear();
    this.bitmap.drawText(text, 0, 0, width, height, 'center');
};

Sprite_Timer.prototype.timerText = function() {
    var min = Math.floor(this._seconds / 60) % 60;
    var sec = this._seconds % 60;
    return min.padZero(2) + ':' + sec.padZero(2);
};

Sprite_Timer.prototype.updatePosition = function() {
    this.x = Graphics.width - this.bitmap.width;
    this.y = 0;
};

Sprite_Timer.prototype.updateVisibility = function() {
    this.visible = $gameTimer.isWorking();
};

//-----------------------------------------------------------------------------
// Sprite_Destination
//
// The sprite for displaying the destination place of the touch input.

function Sprite_Destination() {
    this.initialize.apply(this, arguments);
}

Sprite_Destination.prototype = Object.create(Sprite.prototype);
Sprite_Destination.prototype.constructor = Sprite_Destination;

Sprite_Destination.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.createBitmap();
    this._frameCount = 0;
};

Sprite_Destination.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if ($gameTemp.isDestinationValid()){
        this.updatePosition();
        this.updateAnimation();
        this.visible = true;
    } else {
        this._frameCount = 0;
        this.visible = false;
    }
};

Sprite_Destination.prototype.createBitmap = function() {
    var tileWidth = $gameMap.tileWidth();
    var tileHeight = $gameMap.tileHeight();
    this.bitmap = new Bitmap(tileWidth, tileHeight);
    this.bitmap.fillAll('white');
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.blendMode = Graphics.BLEND_ADD;
};

Sprite_Destination.prototype.updatePosition = function() {
    var tileWidth = $gameMap.tileWidth();
    var tileHeight = $gameMap.tileHeight();
    var x = $gameTemp.destinationX();
    var y = $gameTemp.destinationY();
    this.x = ($gameMap.adjustX(x) + 0.5) * tileWidth;
    this.y = ($gameMap.adjustY(y) + 0.5) * tileHeight;
};

Sprite_Destination.prototype.updateAnimation = function() {
    this._frameCount++;
    this._frameCount %= 20;
    this.opacity = (20 - this._frameCount) * 6;
    this.scale.x = 1 + this._frameCount / 20;
    this.scale.y = this.scale.x;
};

//-----------------------------------------------------------------------------
// Sprite_Square
//
// The sprite for displaying the battle square.

function Sprite_BaseSquare() {
    this.initialize.apply(this, arguments);
}

Sprite_BaseSquare.prototype = Object.create(PIXI.Sprite.prototype);
Sprite_BaseSquare.prototype.constructor = Sprite_BaseSquare;

Sprite_BaseSquare.prototype.initialize = function() {
    var bitmap = new PIXI.Graphics();
    bitmap.lineStyle(3, 0xffffff, 1);
    bitmap.beginFill(0xccb347);
    bitmap.drawRoundedRect(0, 0, SceneManager._screenWidth * 0.05, SceneManager._screenWidth * 0.05 * 0.75, 10);
    bitmap.endFill();
    PIXI.Sprite.call(this, bitmap.generateCanvasTexture());
    this._animationCount = 0;
    this._battler = null;
    this.visible = false;
};

Sprite_BaseSquare.prototype.update = function() {
    if (this._battler) {
        if (this._battler.isSelected() /*|| this._battler.isInputting()*/) {
            this.updateCursor();
            this._animationCount++;
            this._animationCount %= 40;
        } else {
            this.resetSquare();
        }
    }
};

Object.defineProperty(Sprite_BaseSquare.prototype, 'opacity', {
    get: function() {
        return this.alpha * 255;
    },
    set: function(value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

Sprite_BaseSquare.prototype.updateCursor = function() {
    var blinkCount = this._animationCount;
    var opacity = this.opacity;
    if (blinkCount < 20) {
        opacity -= blinkCount * 4;
    } else {
        opacity -= (blinkCount - 39) * 4;
    }
    this.alpha = opacity / 255;
    this.visible = true;
};

Sprite_BaseSquare.prototype.resetSquare = function() {
    this.alpha = 1;
    this.visible = false;
    this._animationCount = 0;
};

Sprite_BaseSquare.prototype.setBattler = function(battler) {
    this._battler = battler;
};

//-----------------------------------------------------------------------------
// Sprite_Square
//
// The sprite for displaying all battle squares.

function Sprite_Squares() {
    this.initialize.apply(this, arguments);
}

Sprite_Squares.prototype = Object.create(Sprite_Base.prototype);
Sprite_Squares.prototype.constructor = Sprite_Squares;

Sprite_Squares.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this._spacing = 40;
    this._offset = 10;
    this._counter = 0;
    this._isEnemy = null;
};

Sprite_Squares.prototype.update = function() {
    Sprite.prototype.update.call(this);
};

Sprite_Squares.prototype.createSquares = function(index) {
    var square, d, dy, totalWidth;
    d = this._spacing;
    dy = this._offset;
    totalWidth = -d;
    this._isEnemy = index === 1 ? false : true;

    for (var i = 0; i < 9; i++) {
        square = new Sprite_BaseSquare();
        square.anchor.set(0.5, 0.3);

        if (i % 3 === 0) totalWidth += square.width + d;
        if (index === 1) {
            square.x = (2- Math.floor(i / 3)) * (square.width + d);
        } else {
            square.x = (Math.floor(i / 3)) * (square.width + d);
        }
        square.y = (i % 3) * (square.width + d);

        if (i >= 3 && i <= 5) square.y -= dy;
        this.addChild(square);
    }
    this._totalWidth = totalWidth;
};

Sprite_Squares.prototype.placeSquares = function() {
    sw = SceneManager._screenWidth;
    sh = SceneManager._screenHeight;
    bw = sw * 0.1;
    bh = sh * 0.5;
    if (!this._isEnemy) {
        this.position.set(bw, bh);
    } else this.position.set(sw - bw - this._totalWidth, bh);
};
//-----------------------------------------------------------------------------
// Spriteset_Base
//
// The superclass of Spriteset_Map and Spriteset_Battle.

function Spriteset_Base() {
    this.initialize.apply(this, arguments);
}

Spriteset_Base.prototype = Object.create(Sprite.prototype);
Spriteset_Base.prototype.constructor = Spriteset_Base;

Spriteset_Base.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.setFrame(0, 0, Graphics.width, Graphics.height);
    this._tone = [0, 0, 0, 0];
    this.opaque = true;
    this.createLowerLayer();
    this.createToneChanger();
    this.createUpperLayer();
    this.update();
};

Spriteset_Base.prototype.createLowerLayer = function() {
    this.createBaseSprite();
};

Spriteset_Base.prototype.createUpperLayer = function() {
    this.createPictures();
    this.createTimer();
    this.createScreenSprites();
};

Spriteset_Base.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateScreenSprites();
    this.updateToneChanger();
    this.updatePosition();
};

Spriteset_Base.prototype.createBaseSprite = function() {
    this._baseSprite = new Sprite();
    this._baseSprite.setFrame(0, 0, this.width, this.height);
    this._blackScreen = new ScreenSprite();
    this._blackScreen.opacity = 255;
    this.addChild(this._baseSprite);
    this._baseSprite.addChild(this._blackScreen);
};

Spriteset_Base.prototype.createToneChanger = function() {
    if (Graphics.isWebGL()) {
        this.createWebGLToneChanger();
    } else {
        this.createCanvasToneChanger();
    }
};

Spriteset_Base.prototype.createWebGLToneChanger = function() {
    var margin = 48;
    var width = Graphics.width + margin * 2;
    var height = Graphics.height + margin * 2;
    this._toneFilter = new ToneFilter();
    this._baseSprite.filters = [this._toneFilter];
    this._baseSprite.filterArea = new Rectangle(-margin, -margin, width, height);
};

Spriteset_Base.prototype.createCanvasToneChanger = function() {
    this._toneSprite = new ToneSprite();
    this.addChild(this._toneSprite);
};

Spriteset_Base.prototype.createPictures = function() {
    var width = Graphics.boxWidth;
    var height = Graphics.boxHeight;
    var x = (Graphics.width - width) / 2;
    var y = (Graphics.height - height) / 2;
    this._pictureContainer = new Sprite();
    this._pictureContainer.setFrame(x, y, width, height);
    for (var i = 1; i <= $gameScreen.maxPictures(); i++) {
        this._pictureContainer.addChild(new Sprite_Picture(i));
    }
    this.addChild(this._pictureContainer);
};

Spriteset_Base.prototype.createTimer = function() {
    this._timerSprite = new Sprite_Timer();
    this.addChild(this._timerSprite);
};

Spriteset_Base.prototype.createScreenSprites = function() {
    this._flashSprite = new ScreenSprite();
    this._fadeSprite = new ScreenSprite();
    this.addChild(this._flashSprite);
    this.addChild(this._fadeSprite);
};

Spriteset_Base.prototype.updateScreenSprites = function() {
    var color = $gameScreen.flashColor();
    this._flashSprite.setColor(color[0], color[1], color[2]);
    this._flashSprite.opacity = color[3];
    this._fadeSprite.opacity = 255 - $gameScreen.brightness();
};

Spriteset_Base.prototype.updateToneChanger = function() {
    var tone = $gameScreen.tone();
    if (!this._tone.equals(tone)) {
        this._tone = tone.clone();
        if (Graphics.isWebGL()) {
            this.updateWebGLToneChanger();
        } else {
            this.updateCanvasToneChanger();
        }
    }
};

Spriteset_Base.prototype.updateWebGLToneChanger = function() {
    var tone = this._tone;
    this._toneFilter.reset();
    this._toneFilter.adjustTone(tone[0], tone[1], tone[2]);
    this._toneFilter.adjustSaturation(-tone[3]);
};

Spriteset_Base.prototype.updateCanvasToneChanger = function() {
    var tone = this._tone;
    this._toneSprite.setTone(tone[0], tone[1], tone[2], tone[3]);
};

Spriteset_Base.prototype.updatePosition = function() {
    var screen = $gameScreen;
    var scale = screen.zoomScale();
    this.scale.x = scale;
    this.scale.y = scale;
    this.x = Math.round(-screen.zoomX() * (scale - 1));
    this.y = Math.round(-screen.zoomY() * (scale - 1));
    this.x += Math.round(screen.shake());
};

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

function Spriteset_Map() {
    this.initialize.apply(this, arguments);
}

Spriteset_Map.prototype = Object.create(Spriteset_Base.prototype);
Spriteset_Map.prototype.constructor = Spriteset_Map;

Spriteset_Map.prototype.initialize = function() {
    Spriteset_Base.prototype.initialize.call(this);
};

Spriteset_Map.prototype.createLowerLayer = function() {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this.createParallax();
    this.createTilemap();
    this.createCharacters();
    this.createShadow();
    this.createDestination();
    this.createWeather();
};

Spriteset_Map.prototype.update = function() {
    Spriteset_Base.prototype.update.call(this);
    this.updateTileset();
    this.updateParallax();
    this.updateTilemap();
    this.updateShadow();
    this.updateWeather();
};

Spriteset_Map.prototype.hideCharacters = function() {
    for (var i = 0; i < this._characterSprites.length; i++) {
        var sprite = this._characterSprites[i];
        if (!sprite.isTile()) {
            sprite.hide();
        }
    }
};

Spriteset_Map.prototype.createParallax = function() {
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._baseSprite.addChild(this._parallax);
};

Spriteset_Map.prototype.createTilemap = function() {
    if (Graphics.isWebGL()) {
        this._tilemap = new ShaderTilemap();
    } else {
        this._tilemap = new Tilemap();
    }
    this._tilemap.tileWidth = $gameMap.tileWidth();
    this._tilemap.tileHeight = $gameMap.tileHeight();
    this._tilemap.setData($gameMap.width(), $gameMap.height(), $gameMap.data());
    this._tilemap.horizontalWrap = $gameMap.isLoopHorizontal();
    this._tilemap.verticalWrap = $gameMap.isLoopVertical();
    this.loadTileset();
    this._baseSprite.addChild(this._tilemap);
};

Spriteset_Map.prototype.loadTileset = function() {
    this._tileset = $gameMap.tileset();
    if (this._tileset) {
        var tilesetNames = this._tileset.tilesetNames;
        for (var i = 0; i < tilesetNames.length; i++) {
            this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
        }
        var newTilesetFlags = $gameMap.tilesetFlags();
        this._tilemap.refreshTileset();
        if (!this._tilemap.flags.equals(newTilesetFlags)) {
            this._tilemap.refresh();
        }
        this._tilemap.flags = newTilesetFlags;
    }
};

Spriteset_Map.prototype.createCharacters = function() {
    this._characterSprites = [];
    $gameMap.events().forEach(function(event) {
        this._characterSprites.push(new Sprite_Character(event));
    }, this);
    $gameMap.vehicles().forEach(function(vehicle) {
        this._characterSprites.push(new Sprite_Character(vehicle));
    }, this);
    $gamePlayer.followers().reverseEach(function(follower) {
        this._characterSprites.push(new Sprite_Character(follower));
    }, this);
    this._characterSprites.push(new Sprite_Character($gamePlayer));
    for (var i = 0; i < this._characterSprites.length; i++) {
        this._tilemap.addChild(this._characterSprites[i]);
    }
};

Spriteset_Map.prototype.createShadow = function() {
    this._shadowSprite = new Sprite();
    this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow1');
    this._shadowSprite.anchor.x = 0.5;
    this._shadowSprite.anchor.y = 1;
    this._shadowSprite.z = 6;
    this._tilemap.addChild(this._shadowSprite);
};

Spriteset_Map.prototype.createDestination = function() {
    this._destinationSprite = new Sprite_Destination();
    this._destinationSprite.z = 9;
    this._tilemap.addChild(this._destinationSprite);
};

Spriteset_Map.prototype.createWeather = function() {
    this._weather = new Weather();
    this.addChild(this._weather);
};

Spriteset_Map.prototype.updateTileset = function() {
    if (this._tileset !== $gameMap.tileset()) {
        this.loadTileset();
    }
};

/*
 * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
 */
Spriteset_Map.prototype._canvasReAddParallax = function() {
    var index = this._baseSprite.children.indexOf(this._parallax);
    this._baseSprite.removeChild(this._parallax);
    this._parallax = new TilingSprite();
    this._parallax.move(0, 0, Graphics.width, Graphics.height);
    this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
    this._baseSprite.addChildAt(this._parallax,index);
};

Spriteset_Map.prototype.updateParallax = function() {
    if (this._parallaxName !== $gameMap.parallaxName()) {
        this._parallaxName = $gameMap.parallaxName();

        if (this._parallax.bitmap && Graphics.isWebGL() != true) {
            this._canvasReAddParallax();
        } else {
            this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        }
    }
    if (this._parallax.bitmap) {
        this._parallax.origin.x = $gameMap.parallaxOx();
        this._parallax.origin.y = $gameMap.parallaxOy();
    }
};

Spriteset_Map.prototype.updateTilemap = function() {
    this._tilemap.origin.x = $gameMap.displayX() * $gameMap.tileWidth();
    this._tilemap.origin.y = $gameMap.displayY() * $gameMap.tileHeight();
};

Spriteset_Map.prototype.updateShadow = function() {
    var airship = $gameMap.airship();
    this._shadowSprite.x = airship.shadowX();
    this._shadowSprite.y = airship.shadowY();
    this._shadowSprite.opacity = airship.shadowOpacity();
};

Spriteset_Map.prototype.updateWeather = function() {
    this._weather.type = $gameScreen.weatherType();
    this._weather.power = $gameScreen.weatherPower();
    this._weather.origin.x = $gameMap.displayX() * $gameMap.tileWidth();
    this._weather.origin.y = $gameMap.displayY() * $gameMap.tileHeight();
};

//-----------------------------------------------------------------------------
// Spriteset_Battle
//
// The set of sprites on the battle screen.

function Spriteset_Battle() {
    this.initialize.apply(this, arguments);
}

Spriteset_Battle.prototype = Object.create(Spriteset_Base.prototype);
Spriteset_Battle.prototype.constructor = Spriteset_Battle;

Spriteset_Battle.prototype.initialize = function() {
    Spriteset_Base.prototype.initialize.call(this);
    this._battlebackLocated = false;
};

Spriteset_Battle.prototype.createLowerLayer = function() {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this.createBackground();
    this.createBattleField();
    this.createBattleback();
    this.createSquares();
    this.createEnemies();
    this.createActors();
};

Spriteset_Battle.prototype.createBackground = function() {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._baseSprite.addChild(this._backgroundSprite);
};

Spriteset_Battle.prototype.update = function() {
    Spriteset_Base.prototype.update.call(this);
};

Spriteset_Battle.prototype.createBattleField = function() {
    var width = Graphics.boxWidth;
    var height = Graphics.boxHeight;
    var x = (Graphics.width - width) / 2;
    var y = (Graphics.height - height) / 2;
    this._battleField = new Sprite();
    this._battleField.setFrame(x, y, width, height);
    this._battleField.x = x;
    this._battleField.y = y;
    this._baseSprite.addChild(this._battleField);
};

Spriteset_Battle.prototype.createBattleback = function() {
    var margin = 32;
    var x = -this._battleField.x - margin;
    var y = -this._battleField.y - margin;
    var width = Graphics.width + margin * 2;
    var height = Graphics.height + margin * 2;
    this._back1Sprite = new TilingSprite();
    this._back2Sprite = new TilingSprite();
    this._back1Sprite.bitmap = this.battleback1Bitmap();
    this._back2Sprite.bitmap = this.battleback2Bitmap();
    this._back1Sprite.move(x, y, width, height);
    this._back2Sprite.move(x, y, width, height);
    this._battleField.addChild(this._back1Sprite);
    this._battleField.addChild(this._back2Sprite);
    this.locateBattleback();
};

Spriteset_Battle.prototype.locateBattleback = function() {
    if (!this._battlebackLocated) {
        var width = this._battleField.width;
        var height = this._battleField.height;
        var sprite1 = this._back1Sprite;
        var sprite2 = this._back2Sprite;
        sprite1.origin.x = sprite1.x + (sprite1.bitmap.width - width) / 2;
        sprite2.origin.x = sprite1.y + (sprite2.bitmap.width - width) / 2;
        if ($gameSystem.isSideView()) {
            sprite1.origin.y = sprite1.x + sprite1.bitmap.height - height;
            sprite2.origin.y = sprite1.y + sprite2.bitmap.height - height;
        }
        this._battlebackLocated = true;
    }
};

Spriteset_Battle.prototype.battleback1Bitmap = function() {
    return ImageManager.loadBattleback1(this.battleback1Name());
};

Spriteset_Battle.prototype.battleback2Bitmap = function() {
    return ImageManager.loadBattleback2(this.battleback2Name());
};

Spriteset_Battle.prototype.battleback1Name = function() {
    if (BattleManager.isBattleTest()) {
        return $dataSystem.battleback1Name;
    } else if ($gameMap.battleback1Name()) {
        return $gameMap.battleback1Name();
    } else if ($gameMap.isOverworld()) {
        return this.overworldBattleback1Name();
    } else {
        return '';
    }
};

Spriteset_Battle.prototype.battleback2Name = function() {
    if (BattleManager.isBattleTest()) {
        return $dataSystem.battleback2Name;
    } else if ($gameMap.battleback2Name()) {
        return $gameMap.battleback2Name();
    } else if ($gameMap.isOverworld()) {
        return this.overworldBattleback2Name();
    } else {
        return '';
    }
};

Spriteset_Battle.prototype.overworldBattleback1Name = function() {
    if ($gamePlayer.isInVehicle()) {
        return this.shipBattleback1Name();
    } else {
        return this.normalBattleback1Name();
    }
};

Spriteset_Battle.prototype.overworldBattleback2Name = function() {
    if ($gamePlayer.isInVehicle()) {
        return this.shipBattleback2Name();
    } else {
        return this.normalBattleback2Name();
    }
};

Spriteset_Battle.prototype.normalBattleback1Name = function() {
    return (this.terrainBattleback1Name(this.autotivarype(1)) ||
            this.terrainBattleback1Name(this.autotivarype(0)) ||
            this.defaultBattleback1Name());
};

Spriteset_Battle.prototype.normalBattleback2Name = function() {
    return (this.terrainBattleback2Name(this.autotivarype(1)) ||
            this.terrainBattleback2Name(this.autotivarype(0)) ||
            this.defaultBattleback2Name());
};

Spriteset_Battle.prototype.terrainBattleback1Name = function(type) {
    switch (type) {
    case 24: case 25:
        return 'Wasteland';
    case 26: case 27:
        return 'DirtField';
    case 32: case 33:
        return 'Desert';
    case 34:
        return 'Lava1';
    case 35:
        return 'Lava2';
    case 40: case 41:
        return 'Snowfield';
    case 42:
        return 'Clouds';
    case 4: case 5:
        return 'PoisonSwamp';
    default:
        return null;
    }
};

Spriteset_Battle.prototype.terrainBattleback2Name = function(type) {
    switch (type) {
    case 20: case 21:
        return 'Forest';
    case 22: case 30: case 38:
        return 'Cliff';
    case 24: case 25: case 26: case 27:
        return 'Wasteland';
    case 32: case 33:
        return 'Desert';
    case 34: case 35:
        return 'Lava';
    case 40: case 41:
        return 'Snowfield';
    case 42:
        return 'Clouds';
    case 4: case 5:
        return 'PoisonSwamp';
    }
};

Spriteset_Battle.prototype.defaultBattleback1Name = function() {
    return 'Grassland';
};

Spriteset_Battle.prototype.defaultBattleback2Name = function() {
    return 'Grassland';
};

Spriteset_Battle.prototype.shipBattleback1Name = function() {
    return 'Ship';
};

Spriteset_Battle.prototype.shipBattleback2Name = function() {
    return 'Ship';
};

Spriteset_Battle.prototype.autotivarype = function(z) {
    return $gameMap.autotivarype($gamePlayer.x, $gamePlayer.y, z);
};

Spriteset_Battle.prototype.createSquares = function() {
    this._squaresSprite1 = new Sprite_Squares();
    this._squaresSprite2 = new Sprite_Squares();
    this._squaresSprite1.createSquares(1);
    this._squaresSprite2.createSquares(2);
    this._squaresSprite1.placeSquares();
    this._squaresSprite2.placeSquares();
    this._battleField.addChild(this._squaresSprite1);
    this._battleField.addChild(this._squaresSprite2);
};

Spriteset_Battle.prototype.createEnemies = function() {
    var enemies = $gameTroop.members();
    var sprites = [];

    for (var i = 0; i < enemies.length; i++) {
        sprites[i] = new Sprite_Battler(enemies[i], true);
    }
    sprites.sort(this.compareEnemySprite.bind(this));
    for (var i = 0; i < enemies.length; i++) {
        this._battleField.addChild(sprites[i]);
    }

    this._enemySprites = sprites;
    this.setEnemies();
};

Spriteset_Battle.prototype.compareEnemySprite = function(a, b) {
    if (a.y !== b.y) {
        return a.y - b.y;
    } else {
        return b.spriteId - a.spriteId;
    }
};


Spriteset_Battle.prototype.createActors = function() {
    this._actorSprites = [];
    for (var i = 0; i < $gameParty.maxBattleMembers(); i++) {
        this._actorSprites[i] = new Sprite_Battler();
        this._battleField.addChild(this._actorSprites[i]);
    }
    this.setActors();
};

Spriteset_Battle.prototype.setActors = function() {
    var members = $gameParty.battleMembers();
    var squares = this._squaresSprite1;
    for (var i = 0; i < this._actorSprites.length; i++) {
        this._actorSprites[i].setBattler(members[i]);
        this._actorSprites[i].setSquare(squares, members[i].index());
        squares.children[members[i].index()].setBattler(members[i]);
    }
};

Spriteset_Battle.prototype.setEnemies = function() {
    var members = $gameTroop.members();
    var squares = this._squaresSprite2;
    for (var i = 0; i < this._enemySprites.length; i++) {
        this._enemySprites[i].setBattler(members[i]);
        this._enemySprites[i].setSquare(squares, i);
        squares.children[i].setBattler(members[i]);
    }
};

Spriteset_Battle.prototype.battlerSprites = function() {
    return this._enemySprites.concat(this._actorSprites);
};

Spriteset_Battle.prototype.isAnimationPlaying = function() {
    return this.battlerSprites().some(function(sprite) {
        return sprite.isAnimationPlaying();
    });
};

Spriteset_Battle.prototype.isEffecting = function() {
    return this.battlerSprites().some(function(sprite) {
        return sprite.isEffecting();
    });
};

Spriteset_Battle.prototype.isAnyoneMoving = function() {
    return this.battlerSprites().some(function(sprite) {
        return sprite.isMoving();
    });
};

Spriteset_Battle.prototype.isBusy = function() {
    return this.isAnimationPlaying() || this.isAnyoneMoving();
};

//=============================================================================================
//The superclass for all sprites

Sprite_Base.prototype.drawGraphic = function(type, obj) {
    var base = new PIXI.Graphics();
    switch (type) {
        case "circle":
            base.lineStyle(obj.lineWidth, obj.lineColor, obj.lineAlpha);
            base.beginFill(obj.color);
            base.drawCircle(0, 0, obj.radius);
            base.endFill();
            break;
        case "roundedRect":
            base.lineStyle(obj.lineWidth, obj.lineColor, obj.lineAlpha);
            base.beginFill(obj.color);
            base.drawRoundedRect(0, 0, obj.width, obj.height, obj.radius);
            base.endFill();
            break;
        default:
            base.lineStyle(obj.lineWidth, obj.lineColor, obj.lineAlpha);
            base.beginFill(obj.color);
            base.drawRect(0, 0, obj.width, obj.height);
            base.endFill();
            break;
    }
    return base;
};

Sprite_Base.prototype.drawComp = function(type, obj) {
    var base = this.drawGraphic(type, obj);
    var comp = new PIXI.Sprite(base.generateCanvasTexture());
    type === "circle" ? comp.radius = obj.radius : null;
    comp._frame = comp.getBounds();
    return comp;
};

Sprite_Base.prototype.drawText = function(text, obj) {
    return new PIXI.Text(text, obj);
};

Sprite_Base.prototype.makeFrames = function(sheet, index, frameNumber, framePerRow, width, height, offsetX, offsetY){
    var rectangle, frame, frames = [];
    for (var i = 0; i < frameNumber; i++) {
        rectangle = new Rectangle((i % framePerRow) * width + offsetX
            , Math.floor(i / framePerRow) * height + offsetY, width, height);
        frame = new PIXI.Texture(TextureCache["img/images/" + sheet + index + ".png"], rectangle);
        frames.push(frame);
    }
    return frames;
};

Sprite_Base.prototype.drawInner = function(obj) {
    this.inner = this.drawComp("rect", {
        color: obj.color,
        width: this.widthValue,
        height: this.heightValue,
        lineWidth: obj.lineWidth, lineColor: obj.lineColor
    });
    this.addChildAt(this.inner, 0);
};

//=============================================================================================
//Projectile
function Sprite_Projectile() {
}

Sprite_Projectile.prototype = Object.create(Sprite_Base.prototype);
Sprite_Projectile.prototype.constructor = Sprite_Projectile;

Sprite_Projectile.prototype.drawProjectile = function(filename) {
    var texture = this.loadProjectile(filename);
    PIXI.Sprite.call(this, texture);
    this.position.set(0, 0);
    this.anchor.set(0.5);
    SceneManager._scene.addChild(this);
};

//=============================================================================================
//Button

function Sprite_Button1() {
    this.initialize.apply(this, arguments);
}

Sprite_Button1.prototype = Object.create(Sprite_Base.prototype);
Sprite_Button1.prototype.constructor = Sprite_Button1;

Sprite_Button1.SIZES = {
    skill: {width: 0.05 * SceneManager._screenWidth, height: 0.5 * SceneManager._screenWidth},
    title: {width: 0.22 * SceneManager._screenWidth, height: 0.11 * SceneManager._screenHeight},
    navigator: {width: 0.12 * SceneManager._screenWidth, height: 0.5 * SceneManager._screenHeight},
    gold: {width: 0.5 * SceneManager._screenWidth, height: 0.5 * SceneManager._screenHeight},
};

Sprite_Button1.prototype.drawButton = function(name) {
    var bitmap = ImageManager.loadSystem('Button');
    Sprite_Base.prototype.initialize.call(bitmap);
    this._bitmap = bitmap;
    this.width = Sprite_Button1.SIZES[name].width;
    this.height = Sprite_Button1.SIZES[name].height;
    this.interactive = true;
    this.buttonMode = true;
};

Sprite_Button1.prototype.drawDescription = function() {
    this.description = new PIXI.Container();
    this.description.window = Sprite_Base.prototype.drawComp("roundedRect", {
        color: 0x333333, width: 200, height: 200,
        radius: 3, lineWidth: 3, lineColor: 0xcccccc
    });
    this.description.text = new PIXI.Text("", {fontSize: 16, fill: "white", fontFamily: "Arial"});
    this.description.addChild(this.description.window);
    this.description.addChild(this.description.text);
    this.description.visible = false;
};

Sprite_Button1.prototype.showDescription = function() {
    this.description.visible = true;
    if (BattleManager.currentChar.skills[this.value]) {
        this.description.text.text = BattleManager.currentChar.skills[this.value].description;
    } else {
        this.description.window.visible = false;
    }
    this.description.window.width = this.description.text.width;
    this.description.window.height = this.description.text.height;
    this.description.x = this.x;
    this.description.y = this.y - 0.05 * SceneManager._screenHeight
};

Sprite_Button1.prototype.hideDescription = function() {
    this.description.visible = false;
};

Sprite_Button1.prototype.drawText = function(text, style) {
    this.text = new PIXI.Text(text, style);
};

Sprite_Button1.prototype.changeTexture = function(index) {
    var rectangle = new Rectangle(288 * (index % 8), Math.floor(index / 8) * 288, 288, 288);
    this.texture = new PIXI.Texture(TextureCache["img/images/Skill0.png"], rectangle);
};

//=============================================================================================
//The superclass for all animation

function Animation_Base() {
}

Animation_Base.prototype = Object.create(PIXI.extras.AnimatedSprite.prototype);
Animation_Base.prototype.constructor = Animation_Base;

Animation_Base.prototype.makeFrames = function(sheet, index, frameNumber, framePerRow, width, height, offsetX, offsetY){
    var rectangle, frame, frames = [];
    for (var i = 0; i < frameNumber; i++) {
        rectangle = new Rectangle((i % framePerRow) * width + offsetX
            , Math.floor(i / framePerRow) * height + offsetY, width, height);
        frame = new PIXI.Texture(TextureCache["img/images/" + sheet + index + ".png"], rectangle);
        frames.push(frame);
    }
    return frames;
};

function Animation_Effect() {
}

Animation_Effect.prototype = Object.create(Animation_Base.prototype);
Animation_Effect.prototype.constructor = Animation_Effect;

Animation_Effect.prototype.drawEffect = function(sheet, index, frameNumber, framePerRow, width, height) {
    var textures = this.makeFrames(sheet, index, frameNumber, framePerRow, width, height, 0, 0);
    AnimatedSprite.call(this, textures);
    this.loop = false;
    this.position.set(0, 0);
    this.anchor.set(0.5);
    this.animationSpeed = 0.2;
    this.visible = false;
    SceneManager._scene.addChild(this);
};