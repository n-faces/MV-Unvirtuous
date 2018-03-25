//=============================================================================
// _sprites.js
//=============================================================================

'use strict';

//-----------------------------------------------------------------------------
// Sprite_Base
//
// The sprite class with a feature which displays animations.

class Sprite_Base extends Sprite {
    constructor() {
        super();
        this._animationSprites = [];
        this._effectTarget = this;
        this._hiding = false;
    }

    update() {
        super.update();
        this.updateVisibility();
        this.updateAnimationSprites();
    };

    hide() {
        this._hiding = true;
        this.updateVisibility();
    };

    show() {
        this._hiding = false;
        this.updateVisibility();
    };

    updateVisibility() {
        this.visible = !this._hiding;
    };

    updateAnimationSprites() {
        if (this._animationSprites.length > 0) {
            let sprites = this._animationSprites.clone();
            this._animationSprites = [];
            for (let i = 0; i < sprites.length; i++) {
                let sprite = sprites[i];
                if (sprite.isPlaying()) {
                    this._animationSprites.push(sprite);
                } else {
                    sprite.remove();
                }
            }
        }
    };

    startAnimation(animation, mirror, delay) {
        let sprite = new Sprite_Animation();
        sprite.setup(this._effectTarget, animation, mirror, delay);
        this.parent.addChild(sprite);
        if (!!BattleManager._spriteset) {
            sprite.parentGroup = BattleManager._spriteset._overlayGroup;
        }
        this._animationSprites.push(sprite);
    };

    isAnimationPlaying() {
        return this._animationSprites.length > 0;
    };

    //-----------------------------------------------------------------------------
    // Added methods

    drawGraphic(type, obj) {
        let base = new PIXI.Graphics();
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

    drawComp(type, obj) {
        let base = this.drawGraphic(type, obj);
        let comp = new PIXI.Sprite(base.generateCanvasTexture());
        type === "circle" ? comp.radius = obj.radius : null;
        comp._frame = comp.getBounds();
        return comp;
    };

    drawText(text, obj) {
        return new PIXI.Text(text, obj);
    };

    makeFrames(sheet, index, frameNumber, framePerRow, width, height, offsetX, offsetY) {
        let rectangle, frame, frames = [];
        for (let i = 0; i < frameNumber; i++) {
            rectangle = new Rectangle((i % framePerRow) * width + offsetX
                , Math.floor(i / framePerRow) * height + offsetY, width, height);
            frame = new PIXI.Texture(TextureCache["img/images/" + sheet + index + ".png"], rectangle);
            frames.push(frame);
        }
        return frames;
    };

    drawInner(obj) {
        this.inner = this.drawComp("rect", {
            color: obj.color,
            width: this.widthValue,
            height: this.heightValue,
            lineWidth: obj.lineWidth, lineColor: obj.lineColor
        });
        this.addChildAt(this.inner, 0);
    };
}

//-----------------------------------------------------------------------------
// Sprite_Button
//
// The sprite for displaying a button.

class Sprite_Button extends Sprite {
    constructor() {
        super();
        this._touching = false;
        this._coldFrame = null;
        this._hotFrame = null;
        this._clickHandler = null;
    }

    update() {
        super.update();
        this.updateFrame();
        this.processTouch();
    };

    updateFrame() {
        let frame;
        if (this._touching) {
            frame = this._hotFrame;
        } else {
            frame = this._coldFrame;
        }
        if (frame) {
            this.setFrame(frame.x, frame.y, frame.width, frame.height);
        }
    };

    setColdFrame(x, y, width, height) {
        this._coldFrame = new Rectangle(x, y, width, height);
    };

    setHotFrame(x, y, width, height) {
        this._hotFrame = new Rectangle(x, y, width, height);
    };

    setClickHandler(method) {
        this._clickHandler = method;
    };

    callClickHandler() {
        if (this._clickHandler) {
            this._clickHandler();
        }
    };

    processTouch() {
        if (this.worldVisible) {
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

    isButtonTouched() {
        let x = this.globalToLocalX(TouchInput.x) + (this.anchor.x * this.width);
        let y = this.globalToLocalY(TouchInput.y) + (this.anchor.y * this.height);
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    };

    globalToLocalX(x) {
        let node = this;
        while (node) {
            x -= node.x;
            node = node.parent;
        }
        return x;
    };

    globalToLocalY(y) {
        let node = this;
        while (node) {
            y -= node.y;
            node = node.parent;
        }
        return y;
    };
}

//-----------------------------------------------------------------------------
// Sprite_Character
//
// The sprite for displaying a character.

class Sprite_Character extends Sprite_Base {
    constructor(character) {
        super();
        this.initMembers();
        this.setCharacter(character);
    }

    initMembers() {
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this._character = null;
        this._balloonDuration = 0;
        this._tilesetId = 0;
        this._upperBody = null;
        this._lowerBody = null;
    };

    setCharacter(character) {
        this._character = character;
    };

    update() {
        super.update();
        this.updateBitmap();
        this.updateFrame();
        this.updatePosition();
        this.updateAnimation();
        this.updateBalloon();
        this.updateOther();
    };

    updateVisibility() {
        super.updateVisibility();
        if (this._character.isTransparent()) {
            this.visible = false;
        }
    };

    isTile() {
        return this._character.tileId > 0;
    };

    tilesetBitmap(tileId) {
        let tileset = $gameMap.tileset();
        let setNumber = 5 + Math.floor(tileId / 256);
        return ImageManager.loadTileset(tileset.tilesetNames[setNumber]);
    };

    updateBitmap() {
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

    isImageChanged() {
        return (this._tilesetId !== $gameMap.tilesetId() ||
            this._tileId !== this._character.tileId() ||
            this._characterName !== this._character.characterName() ||
            this._characterIndex !== this._character.characterIndex());
    };

    setTileBitmap() {
        this.bitmap = this.tilesetBitmap(this._tileId);
    };

    setCharacterBitmap() {
        this.bitmap = ImageManager.loadCharacter(this._characterName);
        this._isBigCharacter = ImageManager.isBigCharacter(this._characterName);
    };

    updateFrame() {
        if (this._tileId > 0) {
            this.updateTileFrame();
        } else {
            this.updateCharacterFrame();
        }
    };

    updateTileFrame() {
        let pw = this.patternWidth();
        let ph = this.patternHeight();
        let sx = (Math.floor(this._tileId / 128) % 2 * 8 + this._tileId % 8) * pw;
        let sy = Math.floor(this._tileId % 256 / 8) % 16 * ph;
        this.setFrame(sx, sy, pw, ph);
    };

    updateCharacterFrame() {
        let pw = this.patternWidth();
        let ph = this.patternHeight();
        let sx = (this.characterBlockX() + this.characterPatternX()) * pw;
        let sy = (this.characterBlockY() + this.characterPatternY()) * ph;
        this.updateHalfBodySprites();
        if (this._bushDepth > 0) {
            let d = this._bushDepth;
            this._upperBody.setFrame(sx, sy, pw, ph - d);
            this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
            this.setFrame(sx, sy, 0, ph);
        } else {
            this.setFrame(sx, sy, pw, ph);
        }
    };

    characterBlockX() {
        if (this._isBigCharacter) {
            return 0;
        } else {
            let index = this._character.characterIndex();
            return index % 4 * 3;
        }
    };

    characterBlockY() {
        if (this._isBigCharacter) {
            return 0;
        } else {
            let index = this._character.characterIndex();
            return Math.floor(index / 4) * 4;
        }
    };

    characterPatternX() {
        return this._character.pattern();
    };

    characterPatternY() {
        return (this._character.direction() - 2) / 2;
    };

    patternWidth() {
        if (this._tileId > 0) {
            return $gameMap.tileWidth();
        } else if (this._isBigCharacter) {
            return this.bitmap.width / 3;
        } else {
            return this.bitmap.width / 12;
        }
    };

    patternHeight() {
        if (this._tileId > 0) {
            return $gameMap.tileHeight();
        } else if (this._isBigCharacter) {
            return this.bitmap.height / 4;
        } else {
            return this.bitmap.height / 8;
        }
    };

    updateHalfBodySprites() {
        if (this._bushDepth > 0) {
            this.createHalfBodySprites();
            this._upperBody.bitmap = this.bitmap;
            this._upperBody.visible = true;
            this._upperBody.y = -this._bushDepth;
            this._lowerBody.bitmap = this.bitmap;
            this._lowerBody.visible = true;
            this._upperBody.blendColor = this.blendColor;
            this._lowerBody.blendColor = this.blendColor;
            this._upperBody.colorTone = this.colorTone;
            this._lowerBody.colorTone = this.colorTone;
        } else if (this._upperBody) {
            this._upperBody.visible = false;
            this._lowerBody.visible = false;
        }
    };

    createHalfBodySprites() {
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

    updatePosition() {
        this.x = this._character.screenX();
        this.y = this._character.screenY();
        this.z = this._character.screenZ();
    };

    updateAnimation() {
        this.setupAnimation();
        if (!this.isAnimationPlaying()) {
            this._character.endAnimation();
        }
        if (!this.isBalloonPlaying()) {
            this._character.endBalloon();
        }
    };

    updateOther() {
        this.opacity = this._character.opacity();
        this.blendMode = this._character.blendMode();
        this._bushDepth = this._character.bushDepth();
    };

    setupAnimation() {
        if (this._character.animationId() > 0) {
            let animation = $dataAnimations[this._character.animationId()];
            this.startAnimation(animation, false, 0);
            this._character.startAnimation();
        }
    };

    setupBalloon() {
        if (this._character.balloonId() > 0) {
            this.startBalloon();
            this._character.startBalloon();
        }
    };

    startBalloon() {
        if (!this._balloonSprite) {
            this._balloonSprite = new Sprite_Balloon();
        }
        this._balloonSprite.setup(this._character.balloonId());
        this.parent.addChild(this._balloonSprite);
    };

    updateBalloon() {
        this.setupBalloon();
        if (this._balloonSprite) {
            this._balloonSprite.x = this.x;
            this._balloonSprite.y = this.y - this.height;
            if (!this._balloonSprite.isPlaying()) {
                this.endBalloon();
            }
        }
    };

    endBalloon() {
        if (this._balloonSprite) {
            this.parent.removeChild(this._balloonSprite);
            this._balloonSprite = null;
        }
    };

    isBalloonPlaying() {
        return !!this._balloonSprite;
    };
}

//-----------------------------------------------------------------------------
// Sprite_Battler
//
// The superclass of Sprite_Actor and Sprite_Enemy.

class Sprite_Battler extends Sprite_Base {
    constructor(battler) {
        super();
        this.initMembers();
        this.setBattler(battler);
    }

    initMembers() {
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this._battler = null;
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
        this._needsMirror = false;
        this._mirror = false;
        this._retreating = false;
        this.createShadowSprite();
        this.createWeaponSprite();
        this.createMainSprite();
        this.createStateSprite();
    };

    setBattler(battler) {
        let changed = (battler !== this._battler);
        if (changed) {
            this._battler = battler;
            this.startEntryMotion();
            this._stateSprite.setup(battler);
        }
    };

    setHome(x, y) {
        this._homeX = x;
        this._homeY = y;
        this.updatePosition();
    };

    createMainSprite() {
        this._mainSprite = new Sprite_Base();
        this._mainSprite.anchor.x = 0.5;
        this._mainSprite.anchor.y = 1;
        this.addChild(this._mainSprite);
        this._effectTarget = this._mainSprite;
    };

    createShadowSprite() {
        this._shadowSprite = new Sprite();
        this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow2');
        this._shadowSprite.anchor.x = 0.5;
        this._shadowSprite.anchor.y = 0.5;
        this._shadowSprite.y = -2;
        this.addChild(this._shadowSprite);
    };

    createWeaponSprite() {
        this._weaponSprite = new Sprite_Weapon();
        this.addChild(this._weaponSprite);
    };

    createStateSprite() {
        this._stateSprite = new Sprite_StateOverlay();
        this.addChild(this._stateSprite);
    };

    damageOffsetX() {
        return 0;
    };

    damageOffsetY() {
        return 0;
    };

    globalToLocalX(x) {
        let node = this;
        while (node) {
            x -= node.x;
            node = node.parent;
        }
        return x;
    };

    globalToLocalY(y) {
        let node = this;
        while (node) {
            y -= node.y;
            node = node.parent;
        }
        return y;
    };

    update() {
        super.update();
        if (this._battler) {
            this.updateMain();
            this.updateAnimation();
            this.updateDamagePopup();
            this.updateSelectionEffect();
            // Reserved: this.updateMotion();
            this.updateEffect();
        } else {
            this.bitmap = null;
        }
        this.updateShadow();
    };

    isSpriteTouched() {
        let width = this.cellWidth,
            height = this.cellHeight,
            x = this.globalToLocalX(TouchInput.x) + (this.anchor.x * width),
            y = this.globalToLocalY(TouchInput.y) + (this.anchor.y * height);
        return x >= 0 && y >= 0 && x < width && y < height;
    };

    get sheetData() {
        if (this._battler) {
            return this._battler._sheetData;
        } else {
            return null;
        }
    }

    get cellWidth() {
        return this.sheetData.frames[0].frame.w;
    }

    get cellHeight() {
        if (this._battler) {
            return this.sheetData.frames[0].frame.h;
        }
    }

    updateVisibility() {
        super.updateVisibility();
        if (!this._battler || !this._battler.isSpriteVisible()) {
            this.visible = false;
        }
    };

    updateMain() {
        if (this._battler.isSpriteVisible()) {
            if (!this.isMoving()) this.updateTargetPosition();
            this.updateBitmap();
            this.updateFrame();
        }
        this.updateMovement();
        this.updatePosition();
    };

    updateMovement() {
        this.updateCharacterMovement();
    };

    updateCharacterMovement() {
        let bitmap = this._mainSprite.bitmap;
        if (!bitmap || bitmap.isReady()) {
            if (this._movementDuration > 0) {
                let v = Math.smoothStep(1 / this._movementDuration);
                this._offsetX = (this._offsetX * (1 - v) + this._targetOffsetX * v);
                this._offsetY = (this._offsetY * (1 - v) + this._targetOffsetY * v);
                this._movementDuration--;
                if (this._movementDuration === 0) {
                    this.onMoveEnd();
                }

                if (this.isTargetCollided()) {
                    this.stopMovement();
                }
            }
        }
    }

    updatePosition() {
        this.x = this._homeX + this._offsetX;
        this.y = this._homeY + this._offsetY;
    };

    updateAnimation() {
        this.setupAnimation();
    };

    updateDamagePopup() {
        this.setupDamagePopup();
        if (this._damages.length > 0) {
            for (let i = 0; i < this._damages.length; i++) {
                this._damages[i].update();
            }
            if (!this._damages[0].isPlaying()) {
                this.parent.removeChild(this._damages[0]);
                this._damages.shift();
            }
        }
    };

    updateSelectionEffect() {
        let target = this._effectTarget;
        if (this._battler.isSelected()) {
            this._selectionEffectCount++;
            if (this._selectionEffectCount % 30 < 15) {
                target.blendColor = [255, 255, 255, 64];
            } else {
                target.blendColor = [0, 0, 0, 0];
            }
        } else if (this._selectionEffectCount > 0) {
            this._selectionEffectCount = 0;
            target.blendColor = [0, 0, 0, 0];
        }
    };

    updateShadow() {
        this._shadowSprite.visible = !!this._battler;
    };

    updateTargetPosition() {
        // Character methods
        let escaped = BattleManager.isEscaped() && !this._battler.isEnemy();
        if (this._battler.isMoving()) {
            if (escaped) {
                if (!this._retreating) this.retreat();
            } else {
                this.stepForward();
            }
        } else if (escaped) {
            if (!this._retreating) this.retreat();
        } else if (this._battler.isProjecting()) {
            if (this._battler.isProjectileRequested()) this.startProjectileMovement(90);
        } else if (this._battler.isDone() && !this.inHomePosition()) {
            this.stepBack();
        }
    };

    updateBitmap() {
        let name = this._battler.battlerName();
        if (this._battlerName !== name) {
            this._battlerName = name;
            this._mainSprite.bitmap = ImageManager.loadSvActor(name);
            this.initVisibility();
        }
    };

    updateFrame() {
        let bitmap = this._mainSprite.bitmap;
        if (bitmap) {
            this.updateMirror();
            let motionIndex = this._motion ? this._motion.index : 0;
            let j = this.sheetData.motions[motionIndex];
            let pattern = (this._motion ? this._pattern < this._motion.patterns : false) ? this._pattern : 0;
            let frame = this.sheetData.frames[j + pattern].frame;
            this._mainSprite.setFrame(frame.x, frame.y, frame.w, frame.h);
        }
    };

    updateMirror() {
        if (this._needsMirror) {
            this.scale.x *= -1;
            this._needsMirror = false;
            this._mirror = !this._mirror;
        }
    };

    updateMotion() {
        this.setupMotion();
        this.setupWeaponAnimation();
        if (this._battler.isMotionRefreshRequested()) {
            this.refreshMotion();
            this._battler.clearMotion();
        }
        this.updateMotionCount();
    };

    updateMotionCount() {
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

    motionSpeed() {
        return 8;
    };

    setupAnimation() {
        while (this._battler.isAnimationRequested()) {
            let data = this._battler.shiftAnimation();
            let animation = $dataAnimations[data.animationId];
            let mirror = data.mirror;
            let delay = animation.position === 3 ? 0 : data.delay;
            this.startAnimation(animation, mirror, delay);
            for (let i = 0; i < this._animationSprites.length; i++) {
                let sprite = this._animationSprites[i];
                sprite.visible = this._battler.isSpriteVisible();
            }
        }
    };

    setupDamagePopup() {
        if (this._battler.isDamagePopupRequested()) {
            if (this._battler.isSpriteVisible()) {
                let sprite = new Sprite_Damage();
                sprite.x = this.x + this.damageOffsetX();
                sprite.y = this.y + this.damageOffsetY();
                sprite.setup(this._battler);
                this._damages.push(sprite);
                sprite.parentGroup = BattleManager._spriteset._overlayGroup;
                this.parent.addChild(sprite);
            }
            this._battler.clearDamagePopup();
            this._battler.clearResult();
        }
    };

    startMovement(x, y, duration) {
        if (this._targetOffsetX !== x || this._targetOffsetY !== y) {
            this._movementDuration = this.getMovementDuration(x, y);
            this._targetOffsetX = x;
            this._targetOffsetY = y;
            if (!duration) {
                this._offsetX = x;
                this._offsetY = y;
            }
        }
    };

    startProjectileMovement(duration) {
        let position = this.getTargetHomePosition();
        let proj = new Sprite_Projectile(this._homeX, this._homeY);
        this.parent.addChild(proj);
        ProjectileManager.add(proj, position[0], position[1], duration);
        this._battler._needsProjectile = false;
    }

    getMovementDuration(x, y) {
        return Math.floor(this.getTargetDistance(x, y) / this.getMovementSpeed());
    }

    getMovementSpeed() {
        return this._battler.msp || 1;
    }

    getTargetDistance(x, y) {
        return Math.sqrt((x - this._targetOffsetX) ** 2 + (y - this._targetOffsetY) ** 2);
    }

    getTargetHomePosition() {
        return BattleManager.targetHomePosition();
    }

    getTargetMeasurements() {
        return BattleManager.targetMeasurements();
    }

    getTargetFrame() {
        let position = this.getTargetHomePosition();
        let measurements = this.getTargetMeasurements();
        if (!!position || !!measurements) {
            return {
                x: position[0],
                y: position[1],
                width: measurements[0],
                height: measurements[1]
            };
        }
    }

    isMoving() {
        return this._movementDuration > 0;
    };

    inHomePosition() {
        return this._offsetX === 0 && this._offsetY === 0;
    };

    isTargetCollided() {
        if (!!this.getTargetFrame()) {
            return Physics.isSpriteCollided(this, this.getTargetFrame());
        }
    }

    setSquare(squares, index) {
        let sx = squares.squareX(index),
            sy = squares.squareY(index);
        this.setHome(sx, sy);
        this.setBattlerHome(sx, sy);
        this.setBattlerMeasurements();
    };

    setBattlerHome(x, y) {
        this._battler._homeX = x;
        this._battler._homeY = y;
    }

    setBattlerMeasurements() {
        this._battler._width = this.cellWidth;
        this._battler._height = this.cellHeight;
    }

    setupMotion() {
        if (this._battler.isMotionRequested()) {
            this.startMotion(this._battler.motionType());
            this._battler.clearMotion();
        }
    };

    setupWeaponAnimation() {
        if (this._battler.isWeaponAnimationRequested()) {
            this._weaponSprite.setup(this._battler.weaponImageId());
            this._battler.clearWeaponAnimation();
        }
    };

    startMotion(motionType) {
        let newMotion = Sprite_Battler.MOTIONS[motionType];
        if (this._motion !== newMotion) {
            this._motion = newMotion;
            this._motionCount = 0;
            this._pattern = 0;
        }
    };

    refreshMotion() {
        let actor = this._battler;
        let motionGuard = Sprite_Battler.MOTIONS['guard'];
        if (actor) {
            if (this._motion === motionGuard && !BattleManager.isInputting()) {
                return;
            }
            let stateMotion = actor.stateMotionIndex();
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
            } else {
                this.startMotion('idle');
            }
        }
    };

    startEntryMotion() {
        if (this._battler) {
            this.refreshMotion();
            this.startMotion('idle');
            this.startMovement(0, 0, false);
        }
    };

    stepForward() {
        let position = this.getTargetHomePosition();
        let tx = position[0], ty = position[1];
        this.startMovement(tx - this._homeX, ty - this._homeY, true);
    };

    stepBack() {
        this.startMovement(0, 0, true);
    };

    stopMovement() {
        this.startMovement(this._offsetX, this._offsetY, false);
    }

    stopProjectileMovement() {
        //this._projectile.x = 0;
        //this._projectile.y = 0;
    }

    retreat() {
        this.requestMirror();
        this._retreating = true;
        this.startMovement(-400, 0, true);
    };

    requestMirror() {
        this._needsMirror = true;
    }

    onMoveEnd() {
        if (!BattleManager.isBattleEnd()) {
            this.refreshMotion();
        }
    };

    onProjectileMovementEnd() {
        this._projectile.visible = false;
        this._projectile.x = this._homeX;
        this._projectile.y = this._homeY;
    }

    initVisibility() {
        this._appeared = this._battler.isAlive();
        if (!this._appeared) {
            this.opacity = 0;
        }
    };

    setupEffect() {
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

    startEffect(effectType) {
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

    startAppear() {
        this._effectDuration = 16;
        this._appeared = true;
    };

    startDisappear() {
        this._effectDuration = 32;
        this._appeared = false;
    };

    startWhiten() {
        this._effectDuration = 16;
    };

    startBlink() {
        this._effectDuration = 20;
    };

    startCollapse() {
        this._effectDuration = 32;
        this._appeared = false;
    };

    startBossCollapse() {
        this._effectDuration = this.bitmap.height;
        this._appeared = false;
    };

    startInstantCollapse() {
        this._effectDuration = 16;
        this._appeared = false;
    };

    updateEffect() {
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

    isEffecting() {
        return this._effectType !== null;
    };

    revertToNormal() {
        this.blendMode = 0;
        this.opacity = 255;
        this.blendColor = [0, 0, 0, 0];
    };

    updateWhiten() {
        let alpha = 128 - (16 - this._effectDuration) * 10;
        this.blendColor = [255, 255, 255, alpha];
    };

    updateBlink() {
        this.opacity = (this._effectDuration % 10 < 5) ? 255 : 0;
    };

    updateAppear() {
        this.opacity = (16 - this._effectDuration) * 16;
    };

    updateDisappear() {
        this.opacity = 256 - (32 - this._effectDuration) * 10;
    };

    updateCollapse() {
        this.blendMode = Graphics.BLEND_ADD;
        this.blendColor = [255, 128, 128, 128];
        this.opacity *= this._effectDuration / (this._effectDuration + 1);
    };

    updateBossCollapse() {
        this.blendMode = Graphics.BLEND_ADD;
        this.opacity *= this._effectDuration / (this._effectDuration + 1);
        this.blendColor = [255, 255, 255, 255 - this.opacity];
        if (this._effectDuration % 20 === 19) {
            SoundManager.playBossCollapse2();
        }
    };

    updateInstantCollapse() {
        this.opacity = 0;
    };
}

Sprite_Battler.MOTIONS = {
    idle: {index: 0, patterns: 7, loop: true},
    run: {index: 1, patterns: 3, loop: false},
    melee: {index: 2, patterns: 5, loop: false},
    back: {index: 3, patterns: 3, loop: false},
    //block: {index: 4, patterns: 7, loop: false}
    guard:      {index: 4, patterns: 7, loop: false},
    /*evade:      {index: 4, patterns: 7, loop: false},
    damaged:    {index: 5, patterns: 7, loop: false},
    dying:      {index: 6, patterns: 7, loop: true},
    dead:       {index: 7, patterns: 7, loop: false},
    melee:      {index: 9, patterns: 5, loop: false},
    missile:    {index: 10, patterns: 7, loop: false},
    channel:    {index: 11, patterns: 7, loop: false},
    toss:       {index: 12, patterns: 7, loop: false},
    victory:    {index: 13, patterns: 7, loop: false},
    asleep:     {index: 14, patterns: 7, loop: true}*/
};

class Sprite_Actor extends Sprite_Battler {
    constructor(battler) {
        super(battler);
    }

    damageOffsetX() {
        return -16;
    };

    damageOffsetY() {
        return -32;
    };
}

class Sprite_Enemy extends Sprite_Battler {
    constructor(battler) {
        super(battler);
        this.requestMirror();
    }

    damageOffsetX() {
        return 16;
    };

    damageOffsetY() {
        return -32;
    };
}

//-----------------------------------------------------------------------------
// Sprite_Animation
//
// The sprite for displaying an animation.

class Sprite_Animation extends Sprite {
    constructor() {
        super();
        this._reduceArtifacts = true;
        this.initMembers();
    }

    initMembers() {
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

    setup(target, animation, mirror, delay) {
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

    remove() {
        if (this.parent && this.parent.removeChild(this)) {
            this._target.blendColor = [0, 0, 0, 0];
            this._target.show();
        }
    };

    setupRate() {
        this._rate = 4;
    };

    setupDuration() {
        this._duration = this._animation.frames.length * this._rate + 1;
    };

    update() {
        super.update();
        this.updateMain();
        this.updateFlash();
        this.updateScreenFlash();
        this.updateHiding();
        Sprite_Animation._checker1 = {};
        Sprite_Animation._checker2 = {};
    };

    updateFlash() {
        if (this._flashDuration > 0) {
            let d = this._flashDuration--;
            this._flashColor[3] *= (d - 1) / d;
            this._target.blendColor = this._flashColor;
        }
    };

    updateScreenFlash() {
        if (this._screenFlashDuration > 0) {
            let d = this._screenFlashDuration--;
            if (this._screenFlashSprite) {
                this._screenFlashSprite.x = -this.absoluteX();
                this._screenFlashSprite.y = -this.absoluteY();
                this._screenFlashSprite.opacity *= (d - 1) / d;
                this._screenFlashSprite.visible = (this._screenFlashDuration > 0);
            }
        }
    };

    absoluteX() {
        let x = 0;
        let object = this;
        while (object) {
            x += object.x;
            object = object.parent;
        }
        return x;
    };

    absoluteY() {
        let y = 0;
        let object = this;
        while (object) {
            y += object.y;
            object = object.parent;
        }
        return y;
    };

    updateHiding() {
        if (this._hidingDuration > 0) {
            this._hidingDuration--;
            if (this._hidingDuration === 0) {
                this._target.show();
            }
        }
    };

    isPlaying() {
        return this._duration > 0;
    };

    loadBitmaps() {
        let name1 = this._animation.animation1Name;
        let name2 = this._animation.animation2Name;
        let hue1 = this._animation.animation1Hue;
        let hue2 = this._animation.animation2Hue;
        this._bitmap1 = ImageManager.loadAnimation(name1, hue1);
        this._bitmap2 = ImageManager.loadAnimation(name2, hue2);
    };

    isReady() {
        return this._bitmap1 && this._bitmap1.isReady() && this._bitmap2 && this._bitmap2.isReady();
    };

    createSprites() {
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

    createCellSprites() {
        this._cellSprites = [];
        for (let i = 0; i < 16; i++) {
            let sprite = new Sprite();
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            this._cellSprites.push(sprite);
            this.addChild(sprite);
        }
    };

    createScreenFlashSprite() {
        this._screenFlashSprite = new ScreenSprite();
        this.addChild(this._screenFlashSprite);
    };

    updateMain() {
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

    updatePosition() {
        if (this._animation.position === 3) {
            this.x = this.parent.width / 2;
            this.y = this.parent.height / 2;
        } else {
            let parent = this._target.parent;
            let grandparent = parent ? parent.parent : null;
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

    updateFrame() {
        if (this._duration > 0) {
            let frameIndex = this.currentFrameIndex();
            this.updateAllCellSprites(this._animation.frames[frameIndex]);
            this._animation.timings.forEach(function (timing) {
                if (timing.frame === frameIndex) {
                    this.processTimingData(timing);
                }
            }, this);
        }
    };

    currentFrameIndex() {
        return (this._animation.frames.length -
            Math.floor((this._duration + this._rate - 1) / this._rate));
    };

    updateAllCellSprites(frame) {
        for (let i = 0; i < this._cellSprites.length; i++) {
            let sprite = this._cellSprites[i];
            if (i < frame.length) {
                this.updateCellSprite(sprite, frame[i]);
            } else {
                sprite.visible = false;
            }
        }
    };

    updateCellSprite(sprite, cell) {
        let pattern = cell[0];
        if (pattern >= 0) {
            let sx = pattern % 5 * 192;
            let sy = Math.floor(pattern % 100 / 5) * 192;
            let mirror = this._mirror;
            sprite.bitmap = pattern < 100 ? this._bitmap1 : this._bitmap2;
            sprite.setFrame(sx, sy, 192, 192);
            sprite.x = cell[1];
            sprite.y = cell[2];
            sprite.rotation = cell[4] * Math.PI / 180;
            sprite.scale.x = cell[3] / 100;

            if (cell[5]) {
                sprite.scale.x *= -1;
            }
            if (mirror) {
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

    processTimingData(timing) {
        let duration = timing.flashDuration * this._rate;
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

    startFlash(color, duration) {
        this._flashColor = color.clone();
        this._flashDuration = duration;
    };

    startScreenFlash(color, duration) {
        this._screenFlashDuration = duration;
        if (this._screenFlashSprite) {
            this._screenFlashSprite.setColor(color[0], color[1], color[2]);
            this._screenFlashSprite.opacity = color[3];
        }
    };

    startHiding(duration) {
        this._hidingDuration = duration;
        this._target.hide();
    };
}

Sprite_Animation._checker1 = {};
Sprite_Animation._checker2 = {};

//-----------------------------------------------------------------------------
// Sprite_Damage
//
// The sprite for displaying a popup damage.

class Sprite_Damage extends Sprite {
    constructor() {
        super();
        this._duration = 90;
        this._flashColor = [0, 0, 0, 0];
        this._flashDuration = 0;
        this._damageBitmap = ImageManager.loadSystem('Damage');
    }

    setup(target) {
        let result = target.result();
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

    setupCriticalEffect() {
        this._flashColor = [255, 0, 0, 160];
        this._flashDuration = 60;
    };

    digitWidth() {
        return this._damageBitmap ? this._damageBitmap.width / 10 : 0;
    };

    digitHeight() {
        return this._damageBitmap ? this._damageBitmap.height / 5 : 0;
    };

    createMiss() {
        let w = this.digitWidth();
        let h = this.digitHeight();
        let sprite = this.createChildSprite();
        sprite.setFrame(0, 4 * h, 4 * w, h);
        sprite.dy = 0;
    };

    createDigits(baseRow, value) {
        let string = Math.abs(value).toString();
        let row = baseRow + (value < 0 ? 1 : 0);
        let w = this.digitWidth();
        let h = this.digitHeight();
        for (let i = 0; i < string.length; i++) {
            let sprite = this.createChildSprite();
            let n = Number(string[i]);
            sprite.setFrame(n * w, row * h, w, h);
            sprite.x = (i - (string.length - 1) / 2) * w;
            sprite.dy = -i;
        }
    };

    createChildSprite() {
        let sprite = new Sprite();
        sprite.bitmap = this._damageBitmap;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 1;
        sprite.y = -40;
        sprite.ry = sprite.y;
        this.addChild(sprite);
        return sprite;
    };

    update() {
        super.update();
        if (this._duration > 0) {
            this._duration--;
            for (let i = 0; i < this.children.length; i++) {
                this.updateChild(this.children[i]);
            }
        }
        this.updateFlash();
        this.updateOpacity();
    };

    updateChild(sprite) {
        sprite.dy += 0.5;
        sprite.ry += sprite.dy;
        if (sprite.ry >= 0) {
            sprite.ry = 0;
            sprite.dy *= -0.6;
        }
        sprite.y = Math.round(sprite.ry);
        sprite.blendColor = this._flashColor;
    };

    updateFlash() {
        if (this._flashDuration > 0) {
            let d = this._flashDuration--;
            this._flashColor[3] *= (d - 1) / d;
        }
    };

    updateOpacity() {
        if (this._duration < 10) {
            this.opacity = 255 * this._duration / 10;
        }
    };

    isPlaying() {
        return this._duration > 0;
    };
}

//-----------------------------------------------------------------------------
// Sprite_StateIcon
//
// The sprite for displaying state icons.

class Sprite_StateIcon extends Sprite {
    constructor() {
        super();
        this.initMembers();
        this.loadBitmap();
    }

    initMembers() {
        this._battler = null;
        this._iconIndex = 0;
        this._animationCount = 0;
        this._animationIndex = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    };

    loadBitmap() {
        this.bitmap = ImageManager.loadSystem('IconSet');
        this.setFrame(0, 0, 0, 0);
    };

    setup(battler) {
        this._battler = battler;
    };

    update() {
        super.update();
        this._animationCount++;
        if (this._animationCount >= this.animationWait()) {
            this.updateIcon();
            this.updateFrame();
            this._animationCount = 0;
        }
    };

    animationWait() {
        return 40;
    };

    updateIcon() {
        let icons = [];
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

    updateFrame() {
        let pw = Sprite_StateIcon._iconWidth;
        let ph = Sprite_StateIcon._iconHeight;
        let sx = this._iconIndex % 16 * pw;
        let sy = Math.floor(this._iconIndex / 16) * ph;
        this.setFrame(sx, sy, pw, ph);
    };
}

Sprite_StateIcon._iconWidth = 32;
Sprite_StateIcon._iconHeight = 32;

//-----------------------------------------------------------------------------
// Sprite_StateOverlay
//
// The sprite for displaying an overlay image for a state.

class Sprite_StateOverlay extends Sprite_Base {
    constructor() {
        super();
        this.initMembers();
        this.loadBitmap();
    }

    initMembers() {
        this._battler = null;
        this._overlayIndex = 0;
        this._animationCount = 0;
        this._pattern = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
    };

    loadBitmap() {
        this.bitmap = ImageManager.loadSystem('States');
        this.setFrame(0, 0, 0, 0);
    };

    setup(battler) {
        this._battler = battler;
    };

    update() {
        super.update();
        this._animationCount++;
        if (this._animationCount >= this.animationWait()) {
            this.updatePattern();
            this.updateFrame();
            this._animationCount = 0;
        }
    };

    animationWait() {
        return 8;
    };

    updatePattern() {
        this._pattern++;
        this._pattern %= 8;
        if (this._battler) {
            this._overlayIndex = this._battler.stateOverlayIndex();
        }
    };

    updateFrame() {
        if (this._overlayIndex > 0) {
            let w = 96;
            let h = 96;
            let sx = this._pattern * w;
            let sy = (this._overlayIndex - 1) * h;
            this.setFrame(sx, sy, w, h);
        } else {
            this.setFrame(0, 0, 0, 0);
        }
    };
}

//-----------------------------------------------------------------------------
// Sprite_Weapon
//
// The sprite for displaying a weapon image for attacking.

class Sprite_Weapon extends Sprite_Base {
    constructor() {
        super();
        this.initMembers();
    }

    initMembers() {
        this._weaponImageId = 0;
        this._animationCount = 0;
        this._pattern = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this.x = -16;
    };

    setup(weaponImageId) {
        this._weaponImageId = weaponImageId;
        this._animationCount = 0;
        this._pattern = 0;
        this.loadBitmap();
        this.updateFrame();
    };

    update() {
        super.update();
        this._animationCount++;
        if (this._animationCount >= this.animationWait()) {
            this.updatePattern();
            this.updateFrame();
            this._animationCount = 0;
        }
    };

    animationWait() {
        return 12;
    };

    updatePattern() {
        this._pattern++;
        if (this._pattern >= 3) {
            this._weaponImageId = 0;
        }
    };

    loadBitmap() {
        let pageId = Math.floor((this._weaponImageId - 1) / 12) + 1;
        if (pageId >= 1) {
            this.bitmap = ImageManager.loadSystem('Weapons' + pageId);
        } else {
            this.bitmap = ImageManager.loadSystem('');
        }
    };

    updateFrame() {
        if (this._weaponImageId > 0) {
            let index = (this._weaponImageId - 1) % 12;
            let w = 96;
            let h = 64;
            let sx = (Math.floor(index / 6) * 3 + this._pattern) * w;
            let sy = Math.floor(index % 6) * h;
            this.setFrame(sx, sy, w, h);
        } else {
            this.setFrame(0, 0, 0, 0);
        }
    };

    isPlaying() {
        return this._weaponImageId > 0;
    };
}

//-----------------------------------------------------------------------------
// Sprite_Projectile
//
// The sprite for displaying a projectile, including bolts, arrows, bullets and energy ball.

class Sprite_Projectile extends PIXI.Sprite {
    constructor(x, y) {
        super(PIXI.Texture.fromImage('img/system/Arrow1.png'));
        this.position.set(x, y);
        this._targetX = NaN;
        this._targetY = NaN;
        this._needsGC = false;
        this.stop();
    }

    setTarget(x, y, duration) {
        this._targetX = x;
        this._targetY = y;
        this._movementDuration = duration;
    }

    start() {
        this.active = true;
        this.visible = true;
    }

    stop() {
        this.active = false;
        this.visible = false;
    }

    update() {
        if (this.active) {
            this.updateMovement();
        }
    }

    updateMovement() {
        if (this._movementDuration > 0) {
            let v = 1 / this._movementDuration;
            this.visible = true;
            this.x = (this.x * (1 - v) + this._targetX * v) | 0;
            this.y = (this.y * (1 - v) + this._targetY * v) | 0;
            this._movementDuration--;

            if (this._movementDuration === 0) {
                this.stop();
                this.onMovementEnd();
            }
        }
    }

    onMovementEnd() {
        this._needsGC = true;

    }

    terminate() {
        this.parent.removeChild(this);
    }

    static _createBaseTexture() {
        if (!this._texture) {
            let base = new PIXI.Graphics();
            base.beginFill(0xffffff);
            base.drawRect(0, 0, 64, 16);
            base.endFill();
            this._texture = base.generateCanvasTexture();
        }
    }
}
Sprite_Projectile._texture = null;

//-----------------------------------------------------------------------------
// Sprite_Balloon
//
// The sprite for displaying a balloon icon.

class Sprite_Balloon extends Sprite_Base {
    constructor() {
        super();
        this.initMembers();
        this.loadBitmap();
    }

    initMembers() {
        this._balloonId = 0;
        this._duration = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this.z = 7;
    };

    loadBitmap() {
        this.bitmap = ImageManager.loadSystem('Balloon');
        this.setFrame(0, 0, 0, 0);
    };

    setup(balloonId) {
        this._balloonId = balloonId;
        this._duration = 8 * this.speed() + this.waitTime();
    };

    update() {
        super.update();
        if (this._duration > 0) {
            this._duration--;
            if (this._duration > 0) {
                this.updateFrame();
            }
        }
    };

    updateFrame() {
        let w = 48;
        let h = 48;
        let sx = this.frameIndex() * w;
        let sy = (this._balloonId - 1) * h;
        this.setFrame(sx, sy, w, h);
    };

    speed() {
        return 8;
    };

    waitTime() {
        return 12;
    };

    frameIndex() {
        let index = (this._duration - this.waitTime()) / this.speed();
        return 7 - Math.max(Math.floor(index), 0);
    };

    isPlaying() {
        return this._duration > 0;
    };
}

//-----------------------------------------------------------------------------
// Sprite_Picture
//
// The sprite for displaying a picture.

class Sprite_Picture extends Sprite {
    constructor(pictureId) {
        super();
        this._pictureId = pictureId;
        this._pictureName = '';
        this._isPicture = true;
        this.update();
    }

    picture() {
        return $gameScreen.picture(this._pictureId);
    };

    update() {
        super.update();
        this.updateBitmap();
        if (this.visible) {
            this.updateOrigin();
            this.updatePosition();
            this.updateScale();
            this.updateTone();
            this.updateOther();
        }
    };

    updateBitmap() {
        let picture = this.picture();
        if (picture) {
            let pictureName = picture.name();
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

    updateOrigin() {
        let picture = this.picture();
        if (picture.origin() === 0) {
            this.anchor.x = 0;
            this.anchor.y = 0;
        } else {
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
        }
    };

    updatePosition() {
        let picture = this.picture();
        this.x = Math.floor(picture.x());
        this.y = Math.floor(picture.y());
    };

    updateScale() {
        let picture = this.picture();
        this.scale.x = picture.scaleX() / 100;
        this.scale.y = picture.scaleY() / 100;
    };

    updateTone() {
        let picture = this.picture();
        if (picture.tone()) {
            this.setColorTone(picture.tone());
        } else {
            this.setColorTone([0, 0, 0, 0]);
        }
    };

    updateOther() {
        let picture = this.picture();
        this.opacity = picture.opacity();
        this.blendMode = picture.blendMode();
        this.rotation = picture.angle() * Math.PI / 180;
    };

    loadBitmap() {
        this.bitmap = ImageManager.loadPicture(this._pictureName);
    };
}

//-----------------------------------------------------------------------------
// Sprite_Timer
//
// The sprite for displaying the timer.

class Sprite_Timer extends Sprite {
    constructor() {
        super();
        this._seconds = 0;
        this.createBitmap();
        this.update();
    }

    createBitmap() {
        this.bitmap = new Bitmap(96, 48);
        this.bitmap.fontSize = 32;
    };

    update() {
        super.update();
        this.updateBitmap();
        this.updatePosition();
        this.updateVisibility();
    };

    updateBitmap() {
        if (this._seconds !== $gameTimer.seconds()) {
            this._seconds = $gameTimer.seconds();
            this.redraw();
        }
    };

    redraw() {
        let text = this.timerText();
        let width = this.bitmap.width;
        let height = this.bitmap.height;
        this.bitmap.clear();
        this.bitmap.drawText(text, 0, 0, width, height, 'center');
    };

    timerText() {
        let min = Math.floor(this._seconds / 60) % 60;
        let sec = this._seconds % 60;
        return min.padZero(2) + ':' + sec.padZero(2);
    };

    updatePosition() {
        this.x = Graphics.width - this.bitmap.width;
        this.y = 0;
    };

    updateVisibility() {
        this.visible = $gameTimer.isWorking();
    };
}

//-----------------------------------------------------------------------------
// Sprite_Destination
//
// The sprite for displaying the destination place of the touch input.

class Sprite_Destination extends Sprite {
    constructor() {
        super()
        this.createBitmap();
        this._frameCount = 0;
    }

    update() {
        super.update();
        if ($gameTemp.isDestinationValid()) {
            this.updatePosition();
            this.updateAnimation();
            this.visible = true;
        } else {
            this._frameCount = 0;
            this.visible = false;
        }
    };

    createBitmap() {
        let tileWidth = $gameMap.tileWidth();
        let tileHeight = $gameMap.tileHeight();
        this.bitmap = new Bitmap(tileWidth, tileHeight);
        this.bitmap.fillAll('white');
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = Graphics.BLEND_ADD;
    };

    updatePosition() {
        let tileWidth = $gameMap.tileWidth();
        let tileHeight = $gameMap.tileHeight();
        let x = $gameTemp.destinationX();
        let y = $gameTemp.destinationY();
        this.x = ($gameMap.adjustX(x) + 0.5) * tileWidth;
        this.y = ($gameMap.adjustY(y) + 0.5) * tileHeight;
    };

    updateAnimation() {
        this._frameCount++;
        this._frameCount %= 20;
        this.opacity = (20 - this._frameCount) * 6;
        this.scale.x = 1 + this._frameCount / 20;
        this.scale.y = this.scale.x;
    };

}

//-----------------------------------------------------------------------------
// Sprite_Square
//
// The sprite for displaying the battle square.

class Sprite_BaseSquare extends PIXI.Sprite {
    constructor() {
        if (!Sprite_BaseSquare._texture) {
            let bitmap = new PIXI.Graphics();
            bitmap.lineStyle(3, 0xffffff, 1);
            bitmap.beginFill(0xccb347);
            bitmap.drawRoundedRect(0, 0, Sprite_BaseSquare._squareSide, Sprite_BaseSquare._squareSide * 0.75, 10);
            bitmap.endFill();
            Sprite_BaseSquare._texture = bitmap.generateCanvasTexture();
        }
        super(Sprite_BaseSquare._texture);
        this._animationCount = 0;
        this._battler = null;
        this.visible = false;
    }

    update() {
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

    updateCursor() {
        let blinkCount = this._animationCount;
        let opacity = this.opacity;
        if (blinkCount < 20) {
            opacity -= blinkCount * 4;
        } else {
            opacity -= (blinkCount - 39) * 4;
        }
        this.alpha = opacity / 255;
        this.visible = true;
    };

    resetSquare() {
        this.alpha = 1;
        this.visible = false;
        this._animationCount = 0;
    };

    setBattler(battler) {
        this._battler = battler;
    };

    static destroyBaseTexture() {
        this._texture.baseTexture.destroy();
    }
}

Sprite_BaseSquare._squareSide = 64;
Sprite_BaseSquare._texture = null;

Object.defineProperty(Sprite_BaseSquare.prototype, 'opacity', {
    get: function () {
        return this.alpha * 255;
    },
    set: function (value) {
        this.alpha = value.clamp(0, 255) / 255;
    },
    configurable: true
});

//-----------------------------------------------------------------------------
// Sprite_Square
//
// The sprite for displaying all battle squares.

class Sprite_Squares extends Sprite_Base {
    constructor() {
        super();
        this._spacing = 40;
        this._offset = 10;
        this._counter = 0;
    }

    update() {
        Sprite.prototype.update.call(this);
    };

    createSquares(index) {
        let square,
            d = this._spacing,
            dy = this._offset;

        for (let i = 0; i < 5; i++) {
            square = new Sprite_BaseSquare();
            square.anchor.set(0.5, 0.3);

            if (index === 1) {
                square.x = (2 - Math.floor(i / 3)) * (square.width + d);
            } else {
                square.x = (Math.floor(i / 3)) * (square.width + d);
            }
            square.y = (i % 3) * (square.width + d);

            if (i >= 3 && i <= 5) square.y += square.height;
            this.addChild(square);
        }

        this._totalWidth = square.width * 2 + d;
    };

    placeSquares(index) {
        let sw = SceneManager._screenWidth,
            sh = SceneManager._screenHeight,
            dw = 216,
            dh = sh * 0.5;
        if (index === 1) {
            this.position.set(dw, dh);
        } else {
            this.position.set(sw - dw - this._totalWidth, dh);
        }
    };

    square(index) {
        return this.children[index];
    }

    squareX(index) {
        return this.x + this.square(index).x;
    }

    squareY(index) {
        return this.y + this.square(index).y;
    }

}

class Sprite_TurnIndicator extends PIXI.Container {
    constructor() {
        super();
        this.createLine();
        this.createCircle();
    }

    createLine() {
        let base = new PIXI.Graphics();
        base.beginFill(0xffffff);
        base.drawRect(0, 0, 240, 8);
        base.endFill();
        this._line = new PIXI.Sprite(base.generateCanvasTexture());
        this._line.anchor.set(0.5);
        this.addChild(this._line);
    }

    createCircle() {
        this._circle = PIXI.Sprite.fromImage('img/system/Circle1.png');
        this._circle.anchor.set(0.5);
        this.addChild(this._circle);
    }
}

//-----------------------------------------------------------------------------
// Spriteset_Base
//
// The superclass of Spriteset_Map and Spriteset_Battle.

class Spriteset_Base extends Sprite {
    constructor() {
        super();
        this.setFrame(0, 0, Graphics.width, Graphics.height);
        this._tone = [0, 0, 0, 0];
        this.createLowerLayer();
        this.createToneChanger();
        this.createUpperLayer();
        this.update();
    }

    createLowerLayer() {
        this.createBaseSprite();
    };

    createUpperLayer() {
        this.createPictures();
        this.createTimer();
        this.createScreenSprites();
    };

    update() {
        super.update();
        this.updateScreenSprites();
        this.updateToneChanger();
        this.updatePosition();
    };

    createBaseSprite() {
        this._baseSprite = new Sprite();
        this._baseSprite.setFrame(0, 0, this.width, this.height);
        this._blackScreen = new ScreenSprite();
        this._blackScreen.opacity = 255;
        this.addChild(this._baseSprite);
        this._baseSprite.addChild(this._blackScreen);
    };

    createToneChanger() {
        if (Graphics.isWebGL()) {
            this.createWebGLToneChanger();
        } else {
            this.createCanvasToneChanger();
        }
    };

    createWebGLToneChanger() {
        let margin = 48;
        let width = Graphics.width + margin * 2;
        let height = Graphics.height + margin * 2;
        this._toneFilter = new ToneFilter();
        this._baseSprite.filters = [this._toneFilter];
        this._baseSprite.filterArea = new Rectangle(-margin, -margin, width, height);
    };

    createCanvasToneChanger() {
        this._toneSprite = new ToneSprite();
        this.addChild(this._toneSprite);
    };

    createPictures() {
        let width = Graphics.boxWidth;
        let height = Graphics.boxHeight;
        let x = (Graphics.width - width) / 2;
        let y = (Graphics.height - height) / 2;
        this._pictureContainer = new Sprite();
        this._pictureContainer.setFrame(x, y, width, height);
        for (let i = 1; i <= $gameScreen.maxPictures(); i++) {
            this._pictureContainer.addChild(new Sprite_Picture(i));
        }
        this.addChild(this._pictureContainer);
    };

    createTimer() {
        this._timerSprite = new Sprite_Timer();
        this.addChild(this._timerSprite);
    };

    createScreenSprites() {
        this._flashSprite = new ScreenSprite();
        this._fadeSprite = new ScreenSprite();
        this.addChild(this._flashSprite);
        this.addChild(this._fadeSprite);
    };

    updateScreenSprites() {
        let color = $gameScreen.flashColor();
        this._flashSprite.setColor(color[0], color[1], color[2]);
        this._flashSprite.opacity = color[3];
        this._fadeSprite.opacity = 255 - $gameScreen.brightness();
    };

    updateToneChanger() {
        let tone = $gameScreen.tone();
        if (!this._tone.equals(tone)) {
            this._tone = tone.clone();
            if (Graphics.isWebGL()) {
                this.updateWebGLToneChanger();
            } else {
                this.updateCanvasToneChanger();
            }
        }
    };

    updateWebGLToneChanger() {
        let tone = this._tone;
        this._toneFilter.reset();
        this._toneFilter.adjustTone(tone[0], tone[1], tone[2]);
        this._toneFilter.adjustSaturation(-tone[3]);
    };

    updateCanvasToneChanger() {
        let tone = this._tone;
        this._toneSprite.setTone(tone[0], tone[1], tone[2], tone[3]);
    };

    updatePosition() {
        let screen = $gameScreen;
        let scale = screen.zoomScale();
        this.scale.x = scale;
        this.scale.y = scale;
        this.x = Math.round(-screen.zoomX() * (scale - 1));
        this.y = Math.round(-screen.zoomY() * (scale - 1));
        this.x += Math.round(screen.shake());
    };

}

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

class Spriteset_Map extends Spriteset_Base {
    constructor() {
        super();
    }

    createLowerLayer() {
        super.createLowerLayer();
        this.createParallax();
        this.createTilemap();
        this.createCharacters();
        this.createShadow();
        this.createDestination();
        this.createWeather();
    };

    update() {
        super.update();
        this.updateTileset();
        this.updateParallax();
        this.updateTilemap();
        this.updateShadow();
        this.updateWeather();
    };

    hideCharacters() {
        for (let i = 0; i < this._characterSprites.length; i++) {
            let sprite = this._characterSprites[i];
            if (!sprite.isTile()) {
                sprite.hide();
            }
        }
    };

    createParallax() {
        this._parallax = new TilingSprite();
        this._parallax.move(0, 0, Graphics.width, Graphics.height);
        this._baseSprite.addChild(this._parallax);
    };

    createTilemap() {
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

    loadTileset() {
        this._tileset = $gameMap.tileset();
        if (this._tileset) {
            let tilesetNames = this._tileset.tilesetNames;
            for (let i = 0; i < tilesetNames.length; i++) {
                this._tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
            }
            let newTilesetFlags = $gameMap.tilesetFlags();
            this._tilemap.refreshTileset();
            if (!this._tilemap.flags.equals(newTilesetFlags)) {
                this._tilemap.refresh();
            }
            this._tilemap.flags = newTilesetFlags;
        }
    };

    createCharacters() {
        this._characterSprites = [];
        $gameMap.events().forEach(function (event) {
            this._characterSprites.push(new Sprite_Character(event));
        }, this);
        $gameMap.vehicles().forEach(function (vehicle) {
            this._characterSprites.push(new Sprite_Character(vehicle));
        }, this);
        $gamePlayer.followers().reverseEach(function (follower) {
            this._characterSprites.push(new Sprite_Character(follower));
        }, this);
        this._characterSprites.push(new Sprite_Character($gamePlayer));
        for (let i = 0; i < this._characterSprites.length; i++) {
            this._tilemap.addChild(this._characterSprites[i]);
        }
    };

    createShadow() {
        this._shadowSprite = new Sprite();
        this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow1');
        this._shadowSprite.anchor.x = 0.5;
        this._shadowSprite.anchor.y = 1;
        this._shadowSprite.z = 6;
        this._tilemap.addChild(this._shadowSprite);
    };

    createDestination() {
        this._destinationSprite = new Sprite_Destination();
        this._destinationSprite.z = 9;
        this._tilemap.addChild(this._destinationSprite);
    };

    createWeather() {
        this._weather = new Weather();
        this.addChild(this._weather);
    };

    updateTileset() {
        if (this._tileset !== $gameMap.tileset()) {
            this.loadTileset();
        }
    };

    /*
     * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
     */
    _canvasReAddParallax() {
        let index = this._baseSprite.children.indexOf(this._parallax);
        this._baseSprite.removeChild(this._parallax);
        this._parallax = new TilingSprite();
        this._parallax.move(0, 0, Graphics.width, Graphics.height);
        this._parallax.bitmap = ImageManager.loadParallax(this._parallaxName);
        this._baseSprite.addChildAt(this._parallax, index);
    };

    updateParallax() {
        if (this._parallaxName !== $gameMap.parallaxName()) {
            this._parallaxName = $gameMap.parallaxName();

            if (this._parallax.bitmap && !Graphics.isWebGL()) {
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

    updateTilemap() {
        this._tilemap.origin.x = $gameMap.displayX() * $gameMap.tileWidth();
        this._tilemap.origin.y = $gameMap.displayY() * $gameMap.tileHeight();
    };

    updateShadow() {
        let airship = $gameMap.airship();
        this._shadowSprite.x = airship.shadowX();
        this._shadowSprite.y = airship.shadowY();
        this._shadowSprite.opacity = airship.shadowOpacity();
    };

    updateWeather() {
        this._weather.type = $gameScreen.weatherType();
        this._weather.power = $gameScreen.weatherPower();
        this._weather.origin.x = $gameMap.displayX() * $gameMap.tileWidth();
        this._weather.origin.y = $gameMap.displayY() * $gameMap.tileHeight();
    };
}

//-----------------------------------------------------------------------------
// Spriteset_Battle
//
// The set of sprites on the battle screen.

class Spriteset_Battle extends Spriteset_Base {
    constructor() {
        super();
        this._battlebackLocated = false;
    }

    createLowerLayer() {
        Spriteset_Base.prototype.createLowerLayer.call(this);
        this.createBackground();
        this.createBattleField();
        this.createBattleback();
        this.createSquares();
        this.createAllGroups();
        this.createEnemies();
        this.createActors();
    };

    createBackground() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap;
        this._baseSprite.addChild(this._backgroundSprite);
    };

    update() {
        Spriteset_Base.prototype.update.call(this);
    };

    createBattleField() {
        let width = Graphics.boxWidth;
        let height = Graphics.boxHeight;
        let x = (Graphics.width - width) / 2;
        let y = (Graphics.height - height) / 2;
        this._battleField = new Sprite();
        this._battleField.setFrame(x, y, width, height);
        this._battleField.x = x;
        this._battleField.y = y;
        this._baseSprite.addChild(this._battleField);
    };

    createBattleback() {
        let margin = 32;
        let x = -this._battleField.x - margin;
        let y = -this._battleField.y - margin;
        let width = Graphics.width + margin * 2;
        let height = Graphics.height + margin * 2;
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

    locateBattleback() {
        if (!this._battlebackLocated) {
            let width = this._battleField.width;
            let height = this._battleField.height;
            let sprite1 = this._back1Sprite;
            let sprite2 = this._back2Sprite;
            sprite1.origin.x = sprite1.x + (sprite1.bitmap.width - width) / 2;
            sprite2.origin.x = sprite1.y + (sprite2.bitmap.width - width) / 2;
            if ($gameSystem.isSideView()) {
                sprite1.origin.y = sprite1.x + sprite1.bitmap.height - height;
                sprite2.origin.y = sprite1.y + sprite2.bitmap.height - height;
            }
            this._battlebackLocated = true;
        }
    };

    battleback1Bitmap() {
        return ImageManager.loadBattleback1(this.battleback1Name());
    };

    battleback2Bitmap() {
        return ImageManager.loadBattleback2(this.battleback2Name());
    };

    battleback1Name() {
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

    battleback2Name() {
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

    overworldBattleback1Name() {
        if ($gamePlayer.isInVehicle()) {
            return this.shipBattleback1Name();
        } else {
            return this.normalBattleback1Name();
        }
    };

    overworldBattleback2Name() {
        if ($gamePlayer.isInVehicle()) {
            return this.shipBattleback2Name();
        } else {
            return this.normalBattleback2Name();
        }
    };

    normalBattleback1Name() {
        return (this.terrainBattleback1Name(this.autotivarype(1)) ||
            this.terrainBattleback1Name(this.autotivarype(0)) ||
            this.defaultBattleback1Name());
    };

    normalBattleback2Name() {
        return (this.terrainBattleback2Name(this.autotivarype(1)) ||
            this.terrainBattleback2Name(this.autotivarype(0)) ||
            this.defaultBattleback2Name());
    };

    terrainBattleback1Name(type) {
        switch (type) {
            case 24:
            case 25:
                return 'Wasteland';
            case 26:
            case 27:
                return 'DirtField';
            case 32:
            case 33:
                return 'Desert';
            case 34:
                return 'Lava1';
            case 35:
                return 'Lava2';
            case 40:
            case 41:
                return 'Snowfield';
            case 42:
                return 'Clouds';
            case 4:
            case 5:
                return 'PoisonSwamp';
            default:
                return null;
        }
    };

    terrainBattleback2Name(type) {
        switch (type) {
            case 20:
            case 21:
                return 'Forest';
            case 22:
            case 30:
            case 38:
                return 'Cliff';
            case 24:
            case 25:
            case 26:
            case 27:
                return 'Wasteland';
            case 32:
            case 33:
                return 'Desert';
            case 34:
            case 35:
                return 'Lava';
            case 40:
            case 41:
                return 'Snowfield';
            case 42:
                return 'Clouds';
            case 4:
            case 5:
                return 'PoisonSwamp';
        }
    };

    defaultBattleback1Name() {
        return 'Grassland';
    };

    defaultBattleback2Name() {
        return 'Grassland';
    };

    shipBattleback1Name() {
        return 'Ship';
    };

    shipBattleback2Name() {
        return 'Ship';
    };

    autotivarype(z) {
        return $gameMap.autotivarype($gamePlayer.x, $gamePlayer.y, z);
    };

    createSquares() {
        this._squares1 = new Sprite_Squares();
        this._squares2 = new Sprite_Squares();
        this._squares1.createSquares(1);
        this._squares2.createSquares(2);
        this._squares1.placeSquares(1);
        this._squares2.placeSquares(2);
        this._battleField.addChild(this._squares1);
        this._battleField.addChild(this._squares2);
    };

    createAllGroups() {
        this.createShadowGroup();
        this.createMainGroup();
        this.createOverlayGroup();
        this.createUIGroup();
    }

    createShadowGroup() {
        this._mainGroup = new PIXI.display.Group(0, true);
        this._mainGroup.on('sort', function (sprite) {
            sprite.zOrder = -sprite.y;
        });
    }

    createMainGroup() {
        this._mainGroup = new PIXI.display.Group(1, true);
        this._mainGroup.on('sort', function (sprite) {
            sprite.zOrder = -sprite.y;
        });

    }

    createOverlayGroup() {
        this._overlayGroup = new PIXI.display.Group(2, true);
        this._overlayGroup.on('sort', function (sprite) {
            sprite.zOrder = -sprite.y;
        });
    }

    createUIGroup() {
        this._UIGroup = new PIXI.display.Group(3, false);
    }

    createEnemies() {
        let enemies = $gameTroop.members();
        let sprites = [];

        for (let i = 0; i < enemies.length; i++) {
            sprites[i] = new Sprite_Enemy(enemies[i], true);
        }
        sprites.sort(this.compareEnemySprite.bind(this));
        for (let i = 0; i < enemies.length; i++) {
            this._battleField.addChild(sprites[i]);
        }

        this._enemySprites = sprites;
        this.setEnemies();
    };

    compareEnemySprite(a, b) {
        if (a.y !== b.y) {
            return a.y - b.y;
        } else {
            return b.spriteId - a.spriteId;
        }
    };

    createActors() {
        this._actorSprites = [];
        for (let i = 0; i < $gameParty.maxBattleMembers(); i++) {
            this._actorSprites[i] = new Sprite_Actor();
            this._battleField.addChild(this._actorSprites[i]);
        }
        this.setActors();
    };

    setActors() {
        let members = $gameParty.battleMembers();
        let squares = this._squares1;
        for (let i = 0; i < this._actorSprites.length; i++) {
            this._actorSprites[i].setBattler(members[i]);
            if (!!members[i]) {
                let index = members[i].index();
                this._actorSprites[i].setSquare(squares, index);
                this._actorSprites[i].parentGroup = this._mainGroup;
                squares.square(index).setBattler(members[i]);
            }
        }
    };

    setEnemies() {
        let members = $gameTroop.members();
        let squares = this._squares2;
        for (let i = 0; i < this._enemySprites.length; i++) {
            this._enemySprites[i].setBattler(members[i]);
            this._enemySprites[i].setSquare(squares, i);
            squares.square(i).setBattler(members[i]);
        }
    };

    battlerSprites() {
        return this._enemySprites.concat(this._actorSprites);
    };

    isAnimationPlaying() {
        return this.battlerSprites().some(function (sprite) {
            return sprite.isAnimationPlaying();
        });
    };

    isEffecting() {
        return this.battlerSprites().some(function (sprite) {
            return sprite.isEffecting();
        });
    };

    isAnyoneMoving() {
        return this.battlerSprites().some(function (sprite) {
            return sprite.isMoving();
        });
    };

    isBusy() {
        return this.isAnimationPlaying() || this.isAnyoneMoving();
    };
}