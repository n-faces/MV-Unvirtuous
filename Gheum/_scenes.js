//=============================================================================
// _scenes.js
//=============================================================================

'use strict';

//========================================================a=====================

/**
 * The Superclass of all scene within the game.
 *
 * @class Scene_Base
 * @constructor
 * @extends Stage
 */
class Scene_Base extends Stage {
    /**
     * Create a instance of Scene_Base.
     *
     * @instance
     * @memberof Scene_Base
     */
    constructor() {
        super();
        this._active = false;
        this._reserved = false;
        this._fadeSign = 0;
        this._fadeDuration = 0;
        this._fadeSprite = null;
        this._imageReservationId = Utils.generateRuntimeId();
    }

    /**
     * Attach a reservation to the reserve queue.
     *
     * @method attachReservation
     * @instance
     * @memberof Scene_Base
     */
    attachReservation() {
        ImageManager.setDefaultReservationId(this._imageReservationId);
    };

    /**
     * Remove the reservation from the Reserve queue.
     *
     * @method detachReservation
     * @instance
     * @memberof Scene_Base
     */
    detachReservation() {
        ImageManager.releaseReservation(this._imageReservationId);
    };

    reservedForGUI() {
        this._reserved = true;
    }

    reservedUsed() {
        this._reserved = false;
    }

    /**
     * Create the components and add them to the rendering process.
     *
     * @method create
     * @instance
     * @memberof Scene_Base
     */
    create() {
    };

    createWhiteBackground() {
        this._background = new ScreenSprite();
        this._background.setWhite();
        this._background.alpha = 1;
        this.addChild(this._background);
    }

    /**
     * Returns whether the scene is active or not.
     *
     * @method isActive
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} return true if the scene is active
     */
    isActive() {
        return this._active;
    };

    /**
     * Return whether the scene is ready to start or not.
     *
     * @method isReady
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if the scene is ready to start
     */
    isReady() {
        return ImageManager.isReady();
    };

    /**
     * Return whether the scene is a pop-up or not.
     *
     * @method isGUI
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if it is a pop-up
     */
    isGUI() {
        return false;
    };

    /**
     * Return whether the scene is reserved or not.
     *
     * @method isReserved
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if it is reserved.
     */
    isReserved() {
        return this._reserved;
    }

    /**
     * Start the scene processing.
     *
     * @method start
     * @instance
     * @memberof Scene_Base
     */
    start() {
        this._active = true;
    };

    /**
     * Continue the scene processing.
     *
     * @method continue
     * @instance
     * @memberof Scene_Base
     */
    continuePrevious() {
        this._active = true;
    }

    /**
     * Update the scene processing each new frame.
     *
     * @method update
     * @instance
     * @memberof Scene_Base
     */
    update() {
        this.updateFade();
        this.updateChildren();
    };

    /**
     * Stop the scene processing.
     *
     * @method stop
     * @instance
     * @memberof Scene_Base
     */
    stop() {
        this._active = false;
    };

    /**
     * Return whether the scene is busy or not.
     *
     * @method isBusy
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if the scene is currently busy
     */
    isBusy() {
        return this._fadeDuration > 0;
    };

    /**
     * Terminate the scene before switching to a another scene.
     *
     * @method terminate
     * @instance
     * @memberof Scene_Base
     */
    terminate() {
    };

    /**
     * Create the layer for the windows children
     * and add it to the rendering process.
     *
     * @method createWindowLayer
     * @instance
     * @memberof Scene_Base
     */
    createWindowLayer() {
        var width = Graphics.boxWidth;
        var height = Graphics.boxHeight;
        var x = (Graphics.width - width) / 2;
        var y = (Graphics.height - height) / 2;
        this._windowLayer = new WindowLayer();
        this._windowLayer.move(x, y, width, height);
        this.addChild(this._windowLayer);
    };

    /**
     * Add the children window to the windowLayer processing.
     *
     * @method addWindow
     * @instance
     * @memberof Scene_Base
     */
    addWindow(window) {
        this._windowLayer.addChild(window);
    };

    /**
     * Request a fadeIn screen process.
     *
     * @method startFadeIn
     * @param {Number} [duration=30] The time the process will take for fadeIn the screen
     * @param {Boolean} [white=false] If true the fadein will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Scene_Base
     */
    startFadeIn(duration, white) {
        this.createFadeSprite(white);
        this._fadeSign = 1;
        this._fadeDuration = duration || 30;
        this._fadeSprite.opacity = 255;
    };

    /**
     * Request a fadeOut screen process.
     *
     * @method startFadeOut
     * @param {Number} [duration=30] The time the process will take for fadeOut the screen
     * @param {Boolean} [white=false] If true the fadeOut will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Scene_Base
     */
    startFadeOut(duration, white) {
        this.createFadeSprite(white);
        this._fadeSign = -1;
        this._fadeDuration = duration || 30;
        this._fadeSprite.opacity = 0;
    };

    /**
     * Create a Screen sprite for the fadein and fadeOut purpose and
     * add it to the rendering process.
     *
     * @method createFadeSprite
     * @instance
     * @memberof Scene_Base
     */
    createFadeSprite(white) {
        if (!this._fadeSprite) {
            this._fadeSprite = new ScreenSprite();
            this.addChild(this._fadeSprite);
        }
        if (white) {
            this._fadeSprite.setWhite();
        } else {
            this._fadeSprite.setBlack();
        }
    };

    /**
     * Update the screen fade processing.
     *
     * @method updateFade
     * @instance
     * @memberof Scene_Base
     */
    updateFade() {
        if (this._fadeDuration > 0) {
            var d = this._fadeDuration;
            if (this._fadeSign > 0) {
                this._fadeSprite.opacity -= this._fadeSprite.opacity / d;
            } else {
                this._fadeSprite.opacity += (255 - this._fadeSprite.opacity) / d;
            }
            this._fadeDuration--;
        }
    };

    /**
     * Update the children of the scene EACH frame.
     *
     * @method updateChildren
     * @instance
     * @memberof Scene_Base
     */
    updateChildren() {
        this.children.forEach(function (child) {
            if (child.update) {
                child.update();
            }
        });
    };

    /**
     * Pop the scene from the stack array and switch to the
     * previous scene.
     *
     * @method popScene
     * @instance
     * @memberof Scene_Base
     */
    popScene() {
        SceneManager.pop();
    };

    /**
     * Check whether the game should be triggering a gameover.
     *
     * @method checkGameover
     * @instance
     * @memberof Scene_Base
     */
    checkGameover() {
        if ($gameParty.isAllDead()) {
            SceneManager.goto(Scene_Gameover);
        }
    };

    /**
     * Slowly fade out all the visual and audio of the scene.
     *
     * @method fadeOutAll
     * @instance
     * @memberof Scene_Base
     */
    fadeOutAll() {
        var time = this.slowFadeSpeed() / 60;
        AudioManager.fadeOutBgm(time);
        AudioManager.fadeOutBgs(time);
        AudioManager.fadeOutMe(time);
        this.startFadeOut(this.slowFadeSpeed());
    };

    /**
     * Return the screen fade speed value.
     *
     * @method fadeSpeed
     * @instance
     * @memberof Scene_Base
     * @return {Number} Return the fade speed
     */
    fadeSpeed() {
        return 24;
    };

    /**
     * Return a slow screen fade speed value.
     *
     * @method slowFadeSpeed
     * @instance
     * @memberof Scene_Base
     * @return {Number} Return the fade speed
     */
    slowFadeSpeed() {
        return this.fadeSpeed() * 2;
    };
}

//-----------------------------------------------------------------------------
// Scene_Boot
//
// The scene class for initializing the entire game.

class Scene_Boot extends Scene_Base {
    constructor() {
        super();
        this._startDate = Date.now();
    }

    create() {
        super.create();
        DataManager.loadDatabase();
        ConfigManager.load();
        this.loadSystemWindowImage();
    };

    loadSystemWindowImage() {
        ImageManager.reserveSystem('Window_Gheum');
    };

    static loadSystemImages() {
        ImageManager.reserveSystem('IconSet');
        ImageManager.reserveSystem('Balloon');
        ImageManager.reserveSystem('Shadow1');
        ImageManager.reserveSystem('Shadow2');
        ImageManager.reserveSystem('Damage');
        ImageManager.reserveSystem('States');
        ImageManager.reserveSystem('Weapons1');
        ImageManager.reserveSystem('Weapons2');
        ImageManager.reserveSystem('Weapons3');
        ImageManager.reserveSystem('ButtonSet');
    };

    isReady() {
        if (super.isReady()) {
            return DataManager.isDatabaseLoaded() && this.isGameFontLoaded();
        } else {
            return false;
        }
    };

    isGameFontLoaded() {
        if (Graphics.isFontLoaded('GameFont')) {
            return true;
        } else if (!Graphics.canUseCssFontLoading()) {
            var elapsed = Date.now() - this._startDate;
            if (elapsed >= 60000) {
                throw new Error('Failed to load GameFont');
            }
        }
    };

    start() {
        super.start();
        SoundManager.preloadImportantSounds();
        if (DataManager.isBattleTest()) {
            DataManager.setupBattleTest();
            SceneManager.goto(Scene_Battle);
        } else if (DataManager.isEventTest()) {
            DataManager.setupEventTest();
            SceneManager.goto(Scene_Map);
        } else {
            this.checkPlayerLocation();
            DataManager.setupNewGame();
            SceneManager.goto(Scene_Control);
            Window_MenuBar.initCommandPosition();
        }
        this.updateDocumentTitle();
    };

    updateDocumentTitle() {
        document.title = 'Gheum';
    };

    checkPlayerLocation() {
        if ($dataSystem.startMapId === 0) {
            throw new Error('Player\'s starting position is not set');
        }
    };
}

//-----------------------------------------------------------------------------
// Scene_Control
//
// The scene class of all the controlling buttons.

class Scene_Control extends Scene_Base {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createWindowLayer();
        this.createTitleBar();
        this.createMenuBar();
    };

    start() {
        super.start();
        SceneManager.clearStack();
    };

    continuePrevious() {
        super.continuePrevious();
        this._menuBar.show();
    }

    stop() {
        super.stop();
        SceneManager.snapForBackground();
    }

    isBusy() {
        return this._menuBar.isClosing() || super.isBusy();
    };

    terminate() {
        super.terminate();
        SceneManager.snapForBackground();
    };

    createTitleBar() {
        this._titleBar = new Window_TitleBar;
        this._titleBar.setHandler('options', this.commandOptions.bind(this));
        this.addWindow(this._titleBar);
    }

    createMenuBar() {
        this._menuBar = new Window_MenuBar();
        this._menuBar.setHandler('players', this.commandPlayers.bind(this));
        this._menuBar.setHandler('classes', this.commandClasses.bind(this));
        this._menuBar.setHandler('skills', this.commandSkills.bind(this));
        this._menuBar.setHandler('items', this.commandItems.bind(this));
        this._menuBar.setHandler('weapons', this.commandWeapons.bind(this));
        this._menuBar.setHandler('armors', this.commandArmors.bind(this));
        this._menuBar.setHandler('enemies', this.commandEnemies.bind(this));
        this._menuBar.setHandler('troops', this.commandTroops.bind(this));
        this._menuBar.setHandler('states', this.commandStates.bind(this));
        this._menuBar.setHandler('animations', this.commandAnimations.bind(this));
        this._menuBar.setHandler('tilesets', this.commandTilesets.bind(this));
        this._menuBar.setHandler('commons', this.commandCommons.bind(this));
        this._menuBar.setHandler('systems', this.commandSystems.bind(this));
        this._menuBar.setHandler('types', this.commandTypes.bind(this));
        this._menuBar.setHandler('terms', this.commandTerms.bind(this));
        this.addWindow(this._menuBar);
        this._menuBar.open();
    };

    commandPlayers() {

    }

    commandClasses() {

    }

    commandSkills() {

    }

    commandItems() {

    }

    commandWeapons() {

    }

    commandArmors() {

    }

    commandEnemies() {

    }

    commandTroops() {
        this.reservedForGUI();
        SceneManager.push(Scene_Troops);
    };

    commandStates() {

    }

    commandAnimations() {

    }
    
    commandTilesets() {

    }

    commandCommons() {

    }

    commandSystems() {

    }

    commandTypes() {

    }

    commandTerms() {

    }

    commandOptions() {

    }

    mainWindowWidth() {
        return (Graphics.boxWidth - this._menuBar.width) / 2;
    }

    mainWindowHeight() {
        return Graphics.boxHeight - this._navigator.height - 80;
    }

    mainWindowY() {
        Scene_Control
        return this._navigator.y - this.mainWindowHeight();
    }
}

//-----------------------------------------------------------------------------
// Scene_Map
//
// The scene class of the map screen.

class Scene_Map extends Scene_Base {
    constructor() {
        super();
        this._waitCount = 0;
        this._encounterEffectDuration = 0;
        this._mapLoaded = false;
        this._touchCount = 0;
    }

    create() {
        super.create();
        this._transfer = $gamePlayer.isTransferring();
        var mapId = this._transfer ? $gamePlayer.newMapId() : $gameMap.mapId();
        DataManager.loadMapData(mapId);
    };

    isReady() {
        if (!this._mapLoaded && DataManager.isMapLoaded()) {
            this.onMapLoaded();
            this._mapLoaded = true;
        }
        return this._mapLoaded && super.isReady();
    };

    onMapLoaded() {
        if (this._transfer) {
            $gamePlayer.performTransfer();
        }
        this.createDisplayObjects();
    };

    start() {
        super.start();
        SceneManager.clearStack();
        if (this._transfer) {
            this.fadeInForTransfer();
            this._mapNameWindow.open();
            $gameMap.autoplay();
        } else if (this.needsFadeIn()) {
            this.startFadeIn(this.fadeSpeed(), false);
        }
    };

    update() {
        this.updateDestination();
        this.updateMainMultiply();
        if (this.isSceneChangeOk()) {
            this.updateScene();
        } else if (SceneManager.isNextScene(Scene_Battle)) {
            this.updateEncounterEffect();
        }
        this.updateWaitCount();
        super.update();
    };

    updateMainMultiply() {
        this.updateMain();
        if (this.isFastForward()) {
            this.updateMain();
        }
    };

    updateMain() {
        var active = this.isActive();
        $gameMap.update(active);
        $gamePlayer.update(active);
        $gameTimer.update(active);
        $gameScreen.update();
    };

    isFastForward() {
        return ($gameMap.isEventRunning() && !SceneManager.isSceneChanging() &&
            (Input.isLongPressed('ok') || TouchInput.isLongPressed()));
    };

    stop() {
        super.stop();
        if (SceneManager._nextScene) {
            switch (SceneManager._nextScene.constructor) {
                case Scene_Menu:
                case Scene_Character:
                case Scene_Objectives:
                    SceneManager.snapForBackground();
            }
        }
        $gamePlayer.straighten();
        this._mapNameWindow.close();
        if (this.needsSlowFadeOut()) {
            this.startFadeOut(this.slowFadeSpeed(), false);
        } else if (SceneManager.isNextScene(Scene_Map)) {
            this.fadeOutForTransfer();
        } else if (SceneManager.isNextScene(Scene_Battle)) {
            this.launchBattle();
        }
    };

    isBusy() {
        return ((this._messageWindow && this._messageWindow.isClosing()) ||
            this._waitCount > 0 || this._encounterEffectDuration > 0 ||
            super.isBusy(this));
    };

    terminate() {
        super.terminate();
        if (!SceneManager.isNextScene(Scene_Battle)) {
            this._spriteset.update();
            this._mapNameWindow.hide();
            this._windowLayer.visible = false;
            this._windowLayer.visible = true;
        } else {
            ImageManager.clearRequest();
        }

        if (SceneManager.isNextScene(Scene_Map)) {
            ImageManager.clearRequest();
        }

        $gameScreen.clearZoom();

        this.removeChild(this._fadeSprite);
        this.removeChild(this._mapNameWindow);
        this.removeChild(this._windowLayer);
        this.removeChild(this._spriteset);
    };

    needsFadeIn() {
        return (SceneManager.isPreviousScene(Scene_Battle) ||
            SceneManager.isPreviousScene(Scene_Load));
    };

    needsSlowFadeOut() {
        return (SceneManager.isNextScene(Scene_Control) ||
            SceneManager.isNextScene(Scene_Gameover));
    };

    updateWaitCount() {
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        }
        return false;
    };

    updateDestination() {
        if (this.isMapTouchOk()) {
            this.processMapTouch();
        } else {
            $gameTemp.clearDestination();
            this._touchCount = 0;
        }
    };

    isMapTouchOk() {
        return this.isActive() && $gamePlayer.canMove();
    };

    processMapTouch() {
        if (TouchInput.isTriggered() || this._touchCount > 0) {
            if (TouchInput.isPressed()) {
                if (this._touchCount === 0 || this._touchCount >= 15) {
                    var x = $gameMap.canvasToMapX(TouchInput.x);
                    var y = $gameMap.canvasToMapY(TouchInput.y);
                    $gameTemp.setDestination(x, y);
                }
                this._touchCount++;
            } else {
                this._touchCount = 0;
            }
        }
    };

    isSceneChangeOk() {
        return this.isActive() && !$gameMessage.isBusy();
    };

    updateScene() {
        this.checkGameover();
        if (!SceneManager.isSceneChanging()) {
            this.updateTransferPlayer();
        }
        if (!SceneManager.isSceneChanging()) {
            this.updateEncounter();
        }
        if (!SceneManager.isSceneChanging()) {
            this.updateCallDebug();
        }
    };

    createDisplayObjects() {
        this.createSpriteset();
        this.createMapNameWindow();
        this.createWindowLayer();
        this.createAllWindows();
    };

    createSpriteset() {
        this._spriteset = new Spriteset_Map();
        this.addChild(this._spriteset);
    };

    createAllWindows() {
        this.createNavigator();
        this.createMessageWindow();
        this.createScrollTextWindow();
    };

    createNavigator() {
        this._navigator = new Window_Navigator();
        this._navigator.setHandler('mainmenu', this.onMenuCalled.bind(this));
        this._navigator.setHandler('character', this.onCharacterCalled.bind(this));
        this._navigator.setHandler('objectives', this.onObjectivesCalled.bind(this));
        this.addWindow(this._navigator);
    };

    createMapNameWindow() {
        this._mapNameWindow = new Window_MapName();
        this.addChild(this._mapNameWindow);
    };

    createMessageWindow() {
        this._messageWindow = new Window_Message();
        this.addWindow(this._messageWindow);
        this._messageWindow.subWindows().forEach(function (window) {
            this.addWindow(window);
        }, this);
    };

    createScrollTextWindow() {
        this._scrollTextWindow = new Window_ScrollText();
        this.addWindow(this._scrollTextWindow);
    };

    updateTransferPlayer() {
        if ($gamePlayer.isTransferring()) {
            SceneManager.goto(Scene_Map);
        }
    };

    updateEncounter() {
        if ($gamePlayer.executeEncounter()) {
            SceneManager.goto(Scene_Battle);
        }
    };

    onMenuCalled() {
        if (this.isSceneChangeOk()) {
            if (!SceneManager.isSceneChanging() && !$gameMap.isEventRunning()) {
                this.reservedForGUI();
                SceneManager.push(Scene_Menu);
                Window_Menu.initCommandPosition();
                $gameTemp.clearDestination();
                this._mapNameWindow.hide();
                this._waitCount = 2;
            }
        }
    };

    onCharacterCalled() {
        if (this.isSceneChangeOk()) {
            if (!SceneManager.isSceneChanging()) {
                this.reservedForGUI();
                SceneManager.push(Scene_Character);
                $gameTemp.clearDestination();
                this._mapNameWindow.hide();
                this._waitCount = 2;
            }
        }
    }

    onObjectivesCalled() {
        if (this.isSceneChangeOk()) {
            if (!SceneManager.isSceneChanging()) {
                this.reservedForGUI();
                SceneManager.push(Scene_Objectives);
                $gameTemp.clearDestination();
                this._mapNameWindow.hide();
                this._waitCount = 2;
            }
        }
    }

    updateCallDebug() {
        if (this.isDebugCalled()) {
            SceneManager.push(Scene_Debug);
        }
    };

    isDebugCalled() {
        return Input.isTriggered('debug') && $gameTemp.isPlaytest();
    };

    fadeInForTransfer() {
        var fadeType = $gamePlayer.fadeType();
        switch (fadeType) {
            case 0:
            case 1:
                this.startFadeIn(this.fadeSpeed(), fadeType === 1);
                break;
        }
    };

    fadeOutForTransfer() {
        var fadeType = $gamePlayer.fadeType();
        switch (fadeType) {
            case 0:
            case 1:
                this.startFadeOut(this.fadeSpeed(), fadeType === 1);
                break;
        }
    };

    launchBattle() {
        BattleManager.saveBgmAndBgs();
        this.stopAudioOnBattleStart();
        SoundManager.playBattleStart();
        this.startEncounterEffect();
        this._mapNameWindow.hide();
    };

    stopAudioOnBattleStart() {
        if (!AudioManager.isCurrentBgm($gameSystem.battleBgm())) {
            AudioManager.stopBgm();
        }
        AudioManager.stopBgs();
        AudioManager.stopMe();
        AudioManager.stopSe();
    };

    startEncounterEffect() {
        this._spriteset.hideCharacters();
        this._encounterEffectDuration = this.encounterEffectSpeed();
    };

    updateEncounterEffect() {
        if (this._encounterEffectDuration > 0) {
            this._encounterEffectDuration--;
            var speed = this.encounterEffectSpeed();
            var n = speed - this._encounterEffectDuration;
            var p = n / speed;
            var q = 2* p ** 2 + 1 ;
            var zoomX = $gamePlayer.screenX();
            var zoomY = $gamePlayer.screenY() - 24;
            if (n === 2) {
                //$gameScreen.setZoom(zoomX, zoomY, 1);
                this.snapForBattleBackground();
                this.startFlashForEncounter(speed / 2);
            }
            $gameScreen.setZoom(zoomX, zoomY, q);
            if (n === Math.floor(speed / 6)) {
                this.startFlashForEncounter(speed / 2);
            }
            if (n === Math.floor(speed / 2)) {
                BattleManager.playBattleBgm();
                this.startFadeOut(this.fadeSpeed());
            }
        }
    };

    snapForBattleBackground() {
        this._windowLayer.visible = false;
        SceneManager.snapForBackground();
        this._windowLayer.visible = true;
    };

    startFlashForEncounter(duration) {
        var color = [255, 255, 255, 255];
        $gameScreen.startFlash(color, duration);
    };

    encounterEffectSpeed() {
        return 60;
    };
}

//-----------------------------------------------------------------------------
// Scene_MenuBase
//
// The superclass of all the menu-type scenes.

class Scene_MenuBase extends Scene_Base {
    constructor() {
        super()
    }

    create() {
        super.create();
        this.createBackground();
        this.updateActor();
        this.createWindowLayer();
    };

    actor() {
        return this._actor;
    };

    updateActor() {
        this._actor = $gameParty.menuActor();
    };

    createBackground() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap;
        this.addChild(this._backgroundSprite);
    };

    setBackgroundOpacity(opacity) {
        this._backgroundSprite.opacity = opacity;
    };

    createHelpWindow() {
        this._helpWindow = new Window_Help();
        this.addWindow(this._helpWindow);
    };

    nextActor() {
        $gameParty.makeMenuActorNext();
        this.updateActor();
        this.onActorChange();
    };

    previousActor() {
        $gameParty.makeMenuActorPrevious();
        this.updateActor();
        this.onActorChange();
    };

    onActorChange() {
    };

    isGUI() {
        return true;
    }
}

//-----------------------------------------------------------------------------
// Scene_Menu
//
// The scene class of the menu screen.

class Scene_Menu extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createMenuWindow();
    };

    createMenuWindow() {
        this._menuWindow = new Window_Menu(0, 0);
        this._menuWindow.setHandler('options', this.commandOptions.bind(this));
        this._menuWindow.setHandler('save', this.commandSave.bind(this));
        this._menuWindow.setHandler('toTitle', this.commandToTitle.bind(this));
        this._menuWindow.setHandler('continue', this.popScene.bind(this));
        this._menuWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._menuWindow);
    };

    commandOptions() {
        SceneManager.push(Scene_Options);
    };

    commandSave() {
        SceneManager.push(Scene_Save);
    };

    commandToTitle() {
        this.fadeOutAll();
        SceneManager.goto(Scene_Control);
    };
}

//-----------------------------------------------------------------------------
// Scene_Status
//
// The scene class of the status screen.

class Scene_Character extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createCommandWindow();
        this.createGoldWindow();
        this.createStatusWindow();
    };

    start() {
        super.start();
        this._statusWindow.refresh();
    };

    createCommandWindow() {
        this._commandWindow = new Window_Character(0, 0);
        this._commandWindow.setHandler('item', this.commandItem.bind(this));
        this._commandWindow.setHandler('skill', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('equip', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('status', this.commandPersonal.bind(this));
        this._commandWindow.setHandler('formation', this.commandFormation.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    };

    createGoldWindow() {
        this._goldWindow = new Window_Gold(0, 0);
        this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
        this.addWindow(this._goldWindow);
    };

    createStatusWindow() {
        this._statusWindow = new Window_CharacterStatus(0, this._commandWindow.height);
        this._statusWindow.height = Graphics.height - this._commandWindow.height;
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    };

    commandItem() {
        SceneManager.push(Scene_Item);
    };

    commandPersonal() {
        this._statusWindow.setFormationMode(false);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler('ok', this.onPersonalOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
    };

    commandFormation() {
        this._statusWindow.setFormationMode(true);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler('ok', this.onFormationOk.bind(this));
        this._statusWindow.setHandler('cancel', this.onFormationCancel.bind(this));
    };

    onPersonalOk() {
        switch (this._commandWindow.currentSymbol()) {
            case 'skill':
                SceneManager.push(Scene_Skill);
                break;
            case 'equip':
                SceneManager.push(Scene_Equip);
                break;
            case 'status':
                SceneManager.push(Scene_Status);
                break;
        }
    };

    onPersonalCancel() {
        this._statusWindow.deselect();
        this._commandWindow.activate();
    };

    onFormationOk() {
        var index = this._statusWindow.index;
        var actor = $gameParty.members()[index];
        var pendingIndex = this._statusWindow.pendingIndex();
        if (pendingIndex >= 0) {
            $gameParty.swapOrder(index, pendingIndex);
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.redrawItem(index);
        } else {
            this._statusWindow.setPendingIndex(index);
        }
        this._statusWindow.activate();
    };

    onFormationCancel() {
        if (this._statusWindow.pendingIndex() >= 0) {
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.activate();
        } else {
            this._statusWindow.deselect();
            this._commandWindow.activate();
        }
    };
}

//-----------------------------------------------------------------------------
// Scene_Status
//
// The scene class of the status screen.

class Scene_Objectives extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createObjectivesWindow();
        this.createHelpWindow();
    };

    start() {
        super.start();
        //this._objectivesWindow.refresh();
    };

    createObjectivesWindow() {
        this._objectivesWindow = new Window_Objectives(0, 0);
        this._objectivesWindow.x = (Graphics.boxWidth - this._objectivesWindow.width)/2;
        this._objectivesWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._objectivesWindow);
    };

    createHelpWindow() {
        var wx = this._objectivesWindow.x;
        var wy = this._objectivesWindow.y + this._objectivesWindow.height;
        var ww = this._objectivesWindow.width;
        var wh = Graphics._boxHeight - wy;
        this._helpWindow = new Window_Help();
        this._helpWindow.x = wx;
        this._helpWindow.y = wy;
        this._helpWindow.width = ww;
        this._helpWindow.height = wh;
        this._objectivesWindow.setHelpWindow(this._helpWindow);
        this.addWindow(this._helpWindow);
    };

}

//-----------------------------------------------------------------------------
// Scene_ItemBase
//
// The superclass of Scene_Item and Scene_Skill.

class Scene_ItemBase extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
    };

    createActorWindow() {
        this._actorWindow = new Window_CharacterActor();
        this._actorWindow.setHandler('ok', this.onActorOk.bind(this));
        this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
        this.addWindow(this._actorWindow);
    };

    item() {
        return this._itemWindow.item();
    };

    user() {
        return null;
    };

    isCursorLeft() {
        return this._itemWindow.index % 2 === 0;
    };

    showSubWindow(window) {
        window.x = this.isCursorLeft() ? Graphics.boxWidth - window.width : 0;
        window.show();
        window.activate();
    };

    hideSubWindow(window) {
        window.hide();
        window.deactivate();
        this.activateItemWindow();
    };

    onActorOk() {
        if (this.canUse()) {
            this.useItem();
        } else {
            SoundManager.playBuzzer();
        }
    };

    onActorCancel() {
        this.hideSubWindow(this._actorWindow);
    };

    determineItem() {
        var action = new Game_Action(this.user());
        var item = this.item();
        action.setItemObject(item);
        if (action.isForFriend()) {
            this.showSubWindow(this._actorWindow);
            this._actorWindow.selectForItem(this.item());
        } else {
            this.useItem();
            this.activateItemWindow();
        }
    };

    useItem() {
        this.playSeForItem();
        this.user().useItem(this.item());
        this.applyItem();
        this.checkCommonEvent();
        this.checkGameover();
        this._actorWindow.refresh();
    };

    activateItemWindow() {
        this._itemWindow.refresh();
        this._itemWindow.activate();
    };

    itemTargetActors() {
        var action = new Game_Action(this.user());
        action.setItemObject(this.item());
        if (!action.isForFriend()) {
            return [];
        } else if (action.isForAll()) {
            return $gameParty.members();
        } else {
            return [$gameParty.members()[this._actorWindow.index]];
        }
    };

    canUse() {
        return this.user().canUse(this.item()) && this.isItemEffectsValid();
    };

    isItemEffectsValid() {
        var action = new Game_Action(this.user());
        action.setItemObject(this.item());
        return this.itemTargetActors().some(function (target) {
            return action.testApply(target);
        }, this);
    };

    applyItem() {
        var action = new Game_Action(this.user());
        action.setItemObject(this.item());
        this.itemTargetActors().forEach(function (target) {
            for (var i = 0; i < action.numRepeats(); i++) {
                action.apply(target);
            }
        }, this);
        action.applyGlobal();
    };

    checkCommonEvent() {
        if ($gameTemp.isCommonEventReserved()) {
            SceneManager.goto(Scene_Map);
        }
    };
}

//-----------------------------------------------------------------------------
// Scene_Item
//
// The scene class of the item screen.

class Scene_Item extends Scene_ItemBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createHelpWindow();
        this.createCategoryWindow();
        this.createItemWindow();
        this.createActorWindow();
    };

    createCategoryWindow() {
        this._categoryWindow = new Window_ItemCategory();
        this._categoryWindow.setHelpWindow(this._helpWindow);
        this._categoryWindow.y = this._helpWindow.height;
        this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._categoryWindow);
    };

    createItemWindow() {
        var wy = this._categoryWindow.y + this._categoryWindow.height;
        var wh = Graphics.boxHeight - wy;
        this._itemWindow = new Window_ItemList(0, wy, Graphics.boxWidth, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
        this._categoryWindow.setItemWindow(this._itemWindow);
    };

    user() {
        var members = $gameParty.movableMembers();
        var bestActor = members[0];
        var bestPha = 0;
        for (var i = 0; i < members.length; i++) {
            if (members[i].pha > bestPha) {
                bestPha = members[i].pha;
                bestActor = members[i];
            }
        }
        return bestActor;
    };

    onCategoryOk() {
        this._itemWindow.activate();
        this._itemWindow.selectLast();
    };

    onItemOk() {
        $gameParty.setLastItem(this.item());
        this.determineItem();
    };

    onItemCancel() {
        this._itemWindow.deselect();
        this._categoryWindow.activate();
    };

    playSeForItem() {
        SoundManager.playUseItem();
    };

    useItem() {
        super.useItem();
        this._itemWindow.redrawCurrentItem();
    };
}

//-----------------------------------------------------------------------------
// Scene_Skill
//
// The scene class of the skill screen.

class Scene_Skill extends Scene_ItemBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createHelpWindow();
        this.createSkillTypeWindow();
        this.createStatusWindow();
        this.createItemWindow();
        this.createActorWindow();
    };

    start() {
        super.start();
        this.refreshActor();
    };

    createSkillTypeWindow() {
        var wy = this._helpWindow.height;
        this._skillTypeWindow = new Window_SkillType(0, wy);
        this._skillTypeWindow.setHelpWindow(this._helpWindow);
        this._skillTypeWindow.setHandler('skill', this.commandSkill.bind(this));
        this._skillTypeWindow.setHandler('cancel', this.popScene.bind(this));
        this._skillTypeWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._skillTypeWindow.setHandler('pageup', this.previousActor.bind(this));
        this.addWindow(this._skillTypeWindow);
    };

    createStatusWindow() {
        var wx = this._skillTypeWindow.width;
        var wy = this._helpWindow.height;
        var ww = Graphics.boxWidth - wx;
        var wh = this._skillTypeWindow.height;
        this._statusWindow = new Window_SkillStatus(wx, wy, ww, wh);
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    };

    createItemWindow() {
        var wx = 0;
        var wy = this._statusWindow.y + this._statusWindow.height;
        var ww = Graphics.boxWidth;
        var wh = Graphics.boxHeight - wy;
        this._itemWindow = new Window_SkillList(wx, wy, ww, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this._skillTypeWindow.setSkillWindow(this._itemWindow);
        this.addWindow(this._itemWindow);
    };

    refreshActor() {
        var actor = this.actor();
        this._skillTypeWindow.setActor(actor);
        this._statusWindow.setActor(actor);
        this._itemWindow.setActor(actor);
    };

    user() {
        return this.actor();
    };

    commandSkill() {
        this._itemWindow.activate();
        this._itemWindow.selectLast();
    };

    onItemOk() {
        this.actor().setLastMenuSkill(this.item());
        this.determineItem();
    };

    onItemCancel() {
        this._itemWindow.deselect();
        this._skillTypeWindow.activate();
    };

    playSeForItem() {
        SoundManager.playUseSkill();
    };

    useItem() {
        super.useItem();
        this._statusWindow.refresh();
        this._itemWindow.refresh();
    };

    onActorChange() {
        this.refreshActor();
        this._skillTypeWindow.activate();
    };
}

//-----------------------------------------------------------------------------
// Scene_Skill
//
// The scene class of the skill screen.

class Scene_SkillTree extends Scene_ItemBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createHelpWindow();
        this.createSkillWindow();
        this.createActorWindow();
    };

    start() {
        super.start();
        this.refreshActor();
    };

    createSkillWindow() {
        var wy = this._helpWindow.height;
        this._skillTypeWindow = new Window_SkillTree(0, wy);
        this._skillTypeWindow.setHelpWindow(this._helpWindow);
        this._skillTypeWindow.setHandler('skill', this.commandSkill.bind(this));
        this._skillTypeWindow.setHandler('cancel', this.popScene.bind(this));
        this._skillTypeWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._skillTypeWindow.setHandler('pageup', this.previousActor.bind(this));
        this.addWindow(this._skillTypeWindow);
    };

    refreshActor() {
        var actor = this.actor();
        this._skillTypeWindow.setActor(actor);
        this._statusWindow.setActor(actor);
        this._itemWindow.setActor(actor);
    };

    user() {
        return this.actor();
    };

    commandSkill() {
        this._itemWindow.activate();
        this._itemWindow.selectLast();
    };

    onItemOk() {
        this.actor().setLastMenuSkill(this.item());
        this.determineItem();
    };

    onItemCancel() {
        this._itemWindow.deselect();
        this._skillTypeWindow.activate();
    };

    playSeForItem() {
        SoundManager.playUseSkill();
    };

    useItem() {
        super.useItem();
        this._statusWindow.refresh();
        this._itemWindow.refresh();
    };

    onActorChange() {
        this.refreshActor();
        this._skillTypeWindow.activate();
    };
}

//-----------------------------------------------------------------------------
// Scene_Equip
//
// The scene class of the equipment screen.

class Scene_Equip extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createHelpWindow();
        this.createStatusWindow();
        this.createCommandWindow();
        this.createSlotWindow();
        this.createItemWindow();
        this.refreshActor();
    };

    createStatusWindow() {
        this._statusWindow = new Window_EquipStatus(0, this._helpWindow.height);
        this.addWindow(this._statusWindow);
    };

    createCommandWindow() {
        var wx = this._statusWindow.width;
        var wy = this._helpWindow.height;
        var ww = Graphics.boxWidth - this._statusWindow.width;
        this._commandWindow = new Window_EquipCommand(wx, wy, ww);
        this._commandWindow.setHelpWindow(this._helpWindow);
        this._commandWindow.setHandler('equip', this.commandEquip.bind(this));
        this._commandWindow.setHandler('optimize', this.commandOptimize.bind(this));
        this._commandWindow.setHandler('clear', this.commandClear.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this._commandWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._commandWindow.setHandler('pageup', this.previousActor.bind(this));
        this.addWindow(this._commandWindow);
    };

    createSlotWindow() {
        var wx = this._statusWindow.width;
        var wy = this._commandWindow.y + this._commandWindow.height;
        var ww = Graphics.boxWidth - this._statusWindow.width;
        var wh = this._statusWindow.height - this._commandWindow.height;
        this._slotWindow = new Window_EquipSlot(wx, wy, ww, wh);
        this._slotWindow.setHelpWindow(this._helpWindow);
        this._slotWindow.setStatusWindow(this._statusWindow);
        this._slotWindow.setHandler('ok', this.onSlotOk.bind(this));
        this._slotWindow.setHandler('cancel', this.onSlotCancel.bind(this));
        this.addWindow(this._slotWindow);
    };

    createItemWindow() {
        var wx = 0;
        var wy = this._statusWindow.y + this._statusWindow.height;
        var ww = Graphics.boxWidth;
        var wh = Graphics.boxHeight - wy;
        this._itemWindow = new Window_EquipItem(wx, wy, ww, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setStatusWindow(this._statusWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this._slotWindow.setItemWindow(this._itemWindow);
        this.addWindow(this._itemWindow);
    };

    refreshActor() {
        var actor = this.actor();
        this._statusWindow.setActor(actor);
        this._slotWindow.setActor(actor);
        this._itemWindow.setActor(actor);
    };

    commandEquip() {
        this._slotWindow.activate();
        this._slotWindow.select(0);
    };

    commandOptimize() {
        SoundManager.playEquip();
        this.actor().optimizeEquipments();
        this._statusWindow.refresh();
        this._slotWindow.refresh();
        this._commandWindow.activate();
    };

    commandClear() {
        SoundManager.playEquip();
        this.actor().clearEquipments();
        this._statusWindow.refresh();
        this._slotWindow.refresh();
        this._commandWindow.activate();
    };

    onSlotOk() {
        this._itemWindow.activate();
        this._itemWindow.select(0);
    };

    onSlotCancel() {
        this._slotWindow.deselect();
        this._commandWindow.activate();
    };

    onItemOk() {
        SoundManager.playEquip();
        this.actor().changeEquip(this._slotWindow.index, this._itemWindow.item());
        this._slotWindow.activate();
        this._slotWindow.refresh();
        this._itemWindow.deselect();
        this._itemWindow.refresh();
        this._statusWindow.refresh();
    };

    onItemCancel() {
        this._slotWindow.activate();
        this._itemWindow.deselect();
    };

    onActorChange() {
        this.refreshActor();
        this._commandWindow.activate();
    };
}

//-----------------------------------------------------------------------------
// Scene_Status
//
// The scene class of the status screen.

class Scene_Status extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this._statusWindow = new Window_Status();
        this._statusWindow.setHandler('cancel', this.popScene.bind(this));
        this._statusWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._statusWindow.setHandler('pageup', this.previousActor.bind(this));
        this._statusWindow.reserveFaceImages();
        this.addWindow(this._statusWindow);
    };

    start() {
        super.start();
        this.refreshActor();
    };

    refreshActor() {
        var actor = this.actor();
        this._statusWindow.setActor(actor);
    };

    onActorChange() {
        this.refreshActor();
        this._statusWindow.activate();
    };

}

//-----------------------------------------------------------------------------
// Scene_Options
//
// The scene class of the options screen.

class Scene_Options extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createOptionsWindow();
    };

    terminate() {
        super.terminate();
        ConfigManager.save();
    };

    createOptionsWindow() {
        this._optionsWindow = new Window_Options();
        this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._optionsWindow);
    };
}

//-----------------------------------------------------------------------------
// Scene_File
//
// The superclass of Scene_Save and Scene_Load.

class Scene_File extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        DataManager.loadAllSavefileImages();
        this.createHelpWindow();
        this.createListWindow();
    };

    start() {
        super.start();
        this._listWindow.refresh();
    };

    savefileId() {
        return this._listWindow.index + 1;
    };

    createHelpWindow() {
        this._helpWindow = new Window_Help(1);
        this._helpWindow.setText(this.helpWindowText());
        this.addWindow(this._helpWindow);
    };

    createListWindow() {
        var x = 0;
        var y = this._helpWindow.height;
        var width = Graphics.boxWidth;
        var height = Graphics.boxHeight - y;
        this._listWindow = new Window_SavefileList(x, y, width, height);
        this._listWindow.setHandler('ok', this.onSavefileOk.bind(this));
        this._listWindow.setHandler('cancel', this.popScene.bind(this));
        this._listWindow.select(this.firstSavefileIndex());
        this._listWindow.setTopRow(this.firstSavefileIndex() - 2);
        this._listWindow.setMode(this.mode());
        this._listWindow.refresh();
        this.addWindow(this._listWindow);
    };

    mode() {
        return null;
    };

    activateListWindow() {
        this._listWindow.activate();
    };

    helpWindowText() {
        return '';
    };

    firstSavefileIndex() {
        return 0;
    };

    onSavefileOk() {
    };
}

//-----------------------------------------------------------------------------
// Scene_Save
//
// The scene class of the save screen.

class Scene_Save extends Scene_File {
    constructor() {
        super();
    }

    mode() {
        return 'save';
    };

    helpWindowText() {
        return TextManager.saveMessage;
    };

    firstSavefileIndex() {
        return DataManager.lastAccessedSavefileId() - 1;
    };

    onSavefileOk() {
        super.onSavefileOk();
        $gameSystem.onBeforeSave();
        if (DataManager.saveGame(this.savefileId())) {
            this.onSaveSuccess();
        } else {
            this.onSaveFailure();
        }
    };

    onSaveSuccess() {
        SoundManager.playSave();
        StorageManager.cleanBackup(this.savefileId());
        this.popScene();
    };

    onSaveFailure() {
        SoundManager.playBuzzer();
        this.activateListWindow();
    };
}

//-----------------------------------------------------------------------------
// Scene_Load
//
// The scene class of the load screen.

class Scene_Load extends Scene_File {
    constructor() {
        super();
        this._loadSuccess = false;
    }

    terminate() {
        super.terminate();
        if (this._loadSuccess) {
            $gameSystem.onAfterLoad();
        }
    };

    mode() {
        return 'load';
    };

    helpWindowText() {
        return TextManager.loadMessage;
    };

    firstSavefileIndex() {
        return DataManager.latestSavefileId() - 1;
    };

    onSavefileOk() {
        super.onSavefileOk();
        if (DataManager.loadGame(this.savefileId())) {
            this.onLoadSuccess();
        } else {
            this.onLoadFailure();
        }
    };

    onLoadSuccess() {
        SoundManager.playLoad();
        this.fadeOutAll();
        this.reloadMapIfUpdated();
        SceneManager.goto(Scene_Map);
        this._loadSuccess = true;
    };

    onLoadFailure() {
        SoundManager.playBuzzer();
        this.activateListWindow();
    };

    reloadMapIfUpdated() {
        if ($gameSystem.versionId() !== $dataSystem.versionId) {
            $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
            $gamePlayer.requestMapReload();
        }
    };
}

//-----------------------------------------------------------------------------
// Scene_Shop
//
// The scene class of the shop screen.

class Scene_Shop extends Scene_MenuBase {
    constructor() {
        super();
    }

    prepare(goods, purchaseOnly) {
        this._goods = goods;
        this._purchaseOnly = purchaseOnly;
        this._item = null;
    };

    create() {
        super.create();
        this.createHelpWindow();
        this.createGoldWindow();
        this.createCommandWindow();
        this.createDummyWindow();
        this.createNumberWindow();
        this.createStatusWindow();
        this.createBuyWindow();
        this.createCategoryWindow();
        this.createSellWindow();
    };

    createGoldWindow() {
        this._goldWindow = new Window_Gold(0, this._helpWindow.height);
        this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
        this.addWindow(this._goldWindow);
    };

    createCommandWindow() {
        this._commandWindow = new Window_ShopCommand(this._goldWindow.x, this._purchaseOnly);
        this._commandWindow.y = this._helpWindow.height;
        this._commandWindow.setHandler('buy', this.commandBuy.bind(this));
        this._commandWindow.setHandler('sell', this.commandSell.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    };

    createDummyWindow() {
        var wy = this._commandWindow.y + this._commandWindow.height;
        var wh = Graphics.boxHeight - wy;
        this._dummyWindow = new Window_Base(0, wy, Graphics.boxWidth, wh);
        this.addWindow(this._dummyWindow);
    };

    createNumberWindow() {
        var wy = this._dummyWindow.y;
        var wh = this._dummyWindow.height;
        this._numberWindow = new Window_ShopNumber(0, wy, wh);
        this._numberWindow.hide();
        this._numberWindow.setHandler('ok', this.onNumberOk.bind(this));
        this._numberWindow.setHandler('cancel', this.onNumberCancel.bind(this));
        this.addWindow(this._numberWindow);
    };

    createStatusWindow() {
        var wx = this._numberWindow.width;
        var wy = this._dummyWindow.y;
        var ww = Graphics.boxWidth - wx;
        var wh = this._dummyWindow.height;
        this._statusWindow = new Window_ShopStatus(wx, wy, ww, wh);
        this._statusWindow.hide();
        this.addWindow(this._statusWindow);
    };

    createBuyWindow() {
        var wy = this._dummyWindow.y;
        var wh = this._dummyWindow.height;
        this._buyWindow = new Window_ShopBuy(0, wy, wh, this._goods);
        this._buyWindow.setHelpWindow(this._helpWindow);
        this._buyWindow.setStatusWindow(this._statusWindow);
        this._buyWindow.hide();
        this._buyWindow.setHandler('ok', this.onBuyOk.bind(this));
        this._buyWindow.setHandler('cancel', this.onBuyCancel.bind(this));
        this.addWindow(this._buyWindow);
    };

    createCategoryWindow() {
        this._categoryWindow = new Window_ItemCategory();
        this._categoryWindow.setHelpWindow(this._helpWindow);
        this._categoryWindow.y = this._dummyWindow.y;
        this._categoryWindow.hide();
        this._categoryWindow.deactivate();
        this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
        this.addWindow(this._categoryWindow);
    };

    createSellWindow() {
        var wy = this._categoryWindow.y + this._categoryWindow.height;
        var wh = Graphics.boxHeight - wy;
        this._sellWindow = new Window_ShopSell(0, wy, Graphics.boxWidth, wh);
        this._sellWindow.setHelpWindow(this._helpWindow);
        this._sellWindow.hide();
        this._sellWindow.setHandler('ok', this.onSellOk.bind(this));
        this._sellWindow.setHandler('cancel', this.onSellCancel.bind(this));
        this._categoryWindow.setItemWindow(this._sellWindow);
        this.addWindow(this._sellWindow);
    };

    activateBuyWindow() {
        this._buyWindow.setMoney(this.money());
        this._buyWindow.show();
        this._buyWindow.activate();
        this._statusWindow.show();
    };

    activateSellWindow() {
        this._categoryWindow.show();
        this._sellWindow.refresh();
        this._sellWindow.show();
        this._sellWindow.activate();
        this._statusWindow.hide();
    };

    commandBuy() {
        this._dummyWindow.hide();
        this.activateBuyWindow();
    };

    commandSell() {
        this._dummyWindow.hide();
        this._categoryWindow.show();
        this._categoryWindow.activate();
        this._sellWindow.show();
        this._sellWindow.deselect();
        this._sellWindow.refresh();
    };

    onBuyOk() {
        this._item = this._buyWindow.item();
        this._buyWindow.hide();
        this._numberWindow.setup(this._item, this.maxBuy(), this.buyingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
    };

    onBuyCancel() {
        this._commandWindow.activate();
        this._dummyWindow.show();
        this._buyWindow.hide();
        this._statusWindow.hide();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
    };

    onCategoryOk() {
        this.activateSellWindow();
        this._sellWindow.select(0);
    };

    onCategoryCancel() {
        this._commandWindow.activate();
        this._dummyWindow.show();
        this._categoryWindow.hide();
        this._sellWindow.hide();
    };

    onSellOk() {
        this._item = this._sellWindow.item();
        this._categoryWindow.hide();
        this._sellWindow.hide();
        this._numberWindow.setup(this._item, this.maxSell(), this.sellingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
        this._statusWindow.setItem(this._item);
        this._statusWindow.show();
    };

    onSellCancel() {
        this._sellWindow.deselect();
        this._categoryWindow.activate();
        this._statusWindow.setItem(null);
        this._helpWindow.clear();
    };

    onNumberOk() {
        SoundManager.playShop();
        switch (this._commandWindow.currentSymbol()) {
            case 'buy':
                this.doBuy(this._numberWindow.number());
                break;
            case 'sell':
                this.doSell(this._numberWindow.number());
                break;
        }
        this.endNumberInput();
        this._goldWindow.refresh();
        this._statusWindow.refresh();
    };

    onNumberCancel() {
        SoundManager.playCancel();
        this.endNumberInput();
    };

    doBuy(number) {
        $gameParty.loseGold(number * this.buyingPrice());
        $gameParty.gainItem(this._item, number);
    };

    doSell(number) {
        $gameParty.gainGold(number * this.sellingPrice());
        $gameParty.loseItem(this._item, number);
    };

    endNumberInput() {
        this._numberWindow.hide();
        switch (this._commandWindow.currentSymbol()) {
            case 'buy':
                this.activateBuyWindow();
                break;
            case 'sell':
                this.activateSellWindow();
                break;
        }
    };

    maxBuy() {
        var max = $gameParty.maxItems(this._item) - $gameParty.numItems(this._item);
        var price = this.buyingPrice();
        if (price > 0) {
            return Math.min(max, Math.floor(this.money() / price));
        } else {
            return max;
        }
    };

    maxSell() {
        return $gameParty.numItems(this._item);
    };

    money() {
        return this._goldWindow.value();
    };

    currencyUnit() {
        return this._goldWindow.currencyUnit();
    };

    buyingPrice() {
        return this._buyWindow.price(this._item);
    };

    sellingPrice() {
        return Math.floor(this._item.price / 2);
    };
}

//-----------------------------------------------------------------------------
// Scene_Name
//
// The scene class of the name input screen.

class Scene_Name extends Scene_MenuBase {
    constructor() {
        super();
    }

    prepare(actorId, maxLength) {
        this._actorId = actorId;
        this._maxLength = maxLength;
    };

    create() {
        super.create();
        this._actor = $gameActors.actor(this._actorId);
        this.createEditWindow();
        this.createInputWindow();
    };

    start() {
        super.start();
        this._editWindow.refresh();
    };

    createEditWindow() {
        this._editWindow = new Window_NameEdit(this._actor, this._maxLength);
        this.addWindow(this._editWindow);
    };

    createInputWindow() {
        this._inputWindow = new Window_NameInput(this._editWindow);
        this._inputWindow.setHandler('ok', this.onInputOk.bind(this));
        this.addWindow(this._inputWindow);
    };

    onInputOk() {
        this._actor.setName(this._editWindow.name());
        this.popScene();
    };
}

//-----------------------------------------------------------------------------
// Scene_Debug
//
// The scene class of the debug screen.

class Scene_Debug extends Scene_MenuBase {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createRangeWindow();
        this.createEditWindow();
        this.createDebugHelpWindow();
    };

    createRangeWindow() {
        this._rangeWindow = new Window_DebugRange(0, 0);
        this._rangeWindow.setHandler('ok', this.onRangeOk.bind(this));
        this._rangeWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._rangeWindow);
    };

    createEditWindow() {
        var wx = this._rangeWindow.width;
        var ww = Graphics.boxWidth - wx;
        this._editWindow = new Window_DebugEdit(wx, 0, ww);
        this._editWindow.setHandler('cancel', this.onEditCancel.bind(this));
        this._rangeWindow.setEditWindow(this._editWindow);
        this.addWindow(this._editWindow);
    };

    createDebugHelpWindow() {
        var wx = this._editWindow.x;
        var wy = this._editWindow.height;
        var ww = this._editWindow.width;
        var wh = Graphics.boxHeight - wy;
        this._debugHelpWindow = new Window_Base(wx, wy, ww, wh);
        this.addWindow(this._debugHelpWindow);
    };

    onRangeOk() {
        this._editWindow.activate();
        this._editWindow.select(0);
        this.refreshHelpWindow();
    };

    onEditCancel() {
        this._rangeWindow.activate();
        this._editWindow.deselect();
        this.refreshHelpWindow();
    };

    refreshHelpWindow() {
        this._debugHelpWindow.contents.clear();
        if (this._editWindow.active) {
            this._debugHelpWindow.drawTextEx(this.helpText(), 4, 0);
        }
    };

    helpText() {
        if (this._rangeWindow.mode() === 'switch') {
            return 'Enter : ON / OFF';
        } else {
            return ('Left     :  -1\n' +
                'Right    :  +1\n' +
                'Pageup   : -10\n' +
                'Pagedown : +10');
        }
    };
}

//-----------------------------------------------------------------------------
// Scene_Battle
//
// The scene class of the battle screen.

class Scene_Battle extends Scene_Base {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.createDisplayObjects();
    };

    start() {
        super.start();
        this.startFadeIn(this.fadeSpeed(), false);
        BattleManager.playBattleBgm();
        BattleManager.startBattle();
    };

    update() {
        var active = this.isActive();
        $gameTimer.update(active);
        $gameScreen.update();
        this.updateStatusWindow();
        if (active && !this.isBusy()) {
            this.updateBattleProcess();
        }
        super.update();
    };

    updateBattleProcess() {
        if (!this.isAnyInputWindowActive() || BattleManager.isAborting() ||
            BattleManager.isBattleEnd()) {
            BattleManager.update();
            this.changeInputWindow();
        }
    };

    isAnyInputWindowActive() {
        return (this._skillBar.active ||
            this._skillWindow.active ||
            this._itemWindow.active ||
            this._actorWindow.active ||
            this._enemyWindow.active);
    };

    changeInputWindow() {
        if (BattleManager.isInputting()) {
            if (BattleManager.actor()) {
                this.startSkillBarSelection();
            } else {
                this.selectNextCommand();
            }
        } else {
            this.endCommandSelection();
        }
    };

    stop() {
        super.stop();
        this._windowLayer.visible = false;
        if (SceneManager._nextScene) {
            switch (SceneManager._nextScene.constructor) {
                case Scene_Menu:
                case Scene_Character:
                case Scene_Objectives:
                    SceneManager.snapForBackground();
            }
        }
        if (this.needsSlowFadeOut()) {
            this.startFadeOut(this.slowFadeSpeed(), false);
        }
        this._windowLayer.visible = true;
    };

    terminate() {
        super.terminate();
        $gameParty.onBattleEnd();
        $gameTroop.onBattleEnd();
        AudioManager.stopMe();
        ImageManager.clearRequest();
    };

    needsSlowFadeOut() {
        return (SceneManager.isNextScene(Scene_Control) ||
            SceneManager.isNextScene(Scene_Gameover) ||
            SceneManager.isNextScene(Scene_Map));
    };

    updateStatusWindow() {
        if ($gameMessage.isBusy()) {
            this._playerBars.close();
            this._enemyBars.close();
            this._skillBar.close();
            this._navigator.close();
        } else if (this.isActive() && !this._messageWindow.isClosing()) {
            this._playerBars.open();
            this._enemyBars.open();
            this._navigator.open();
        }
    };

    isSceneChangeOk() {
        return this.isActive() && !$gameMessage.isBusy();
    };

    createDisplayObjects() {
        this.createSpriteset();
        this.createWindowLayer();
        this.createAllWindows();
        BattleManager.setLogWindow(this._logWindow);
        BattleManager.setPlayerBars(this._playerBars);
        BattleManager.setEnemyBars(this._enemyBars);
        BattleManager.setSpriteset(this._spriteset);
        this._logWindow.setSpriteset(this._spriteset);
    };

    createSpriteset() {
        this._spriteset = new Spriteset_Battle();
        this.addChild(this._spriteset);
    };

    createAllWindows() {
        this.createNavigator();
        this.createLogWindow();
        this.createPlayerBars();
        this.createEnemyBars();
        this.createSkillBar();
        this.createHelpWindow();
        this.createSkillWindow();
        this.createItemWindow();
        this.createActorWindow();
        this.createEnemyWindow();
        this.createMessageWindow();
        this.createScrollTextWindow();
    };

    createNavigator() {
        this._navigator = new Window_Navigator();
        this._navigator.setHandler('mainmenu', this.onMenuCalled.bind(this));
        this._navigator.setHandler('character', this.onCharacterCalled.bind(this));
        this._navigator.setHandler('objectives', this.onObjectivesCalled.bind(this));
        this.addWindow(this._navigator);
    };

    createLogWindow() {
        this._logWindow = new Window_BattleLog();
        this.addWindow(this._logWindow);
    };

    createPlayerBars() {
        this._playerBars = new Window_PlayerBars();
        this._playerBars.y += this._navigator.height;
        this.addWindow(this._playerBars);
    };

    createEnemyBars() {
        this._enemyBars = new Window_EnemyBars();
        this._enemyBars.y += this._navigator.height;
        this.addWindow(this._enemyBars);
    };

    createSkillBar() {
        this._skillBar = new Window_SkillBar();
        this._skillBar.setHandler('attack', this.commandAttack.bind(this));
        this._skillBar.setHandler('skill',  this.commandSkill.bind(this));
        this._skillBar.setHandler('guard',  this.commandGuard.bind(this));
        this._skillBar.setHandler('item',   this.commandItem.bind(this));
        this._skillBar.setHandler('escape', this.commandEscape.bind(this));
        this._skillBar.setHandler('cancel', this.selectPreviousCommand.bind(this));
        this._skillBar.deselect();
        this.addWindow(this._skillBar);
    };

    createHelpWindow() {
        this._helpWindow = new Window_Help();
        this._helpWindow.y = this._playerBars.y + this._playerBars.height;
        this._helpWindow.visible = false;
        this.addWindow(this._helpWindow);
    };

    createSkillWindow() {
        var wy = this._helpWindow.y + this._helpWindow.height;
        var wh = Graphics._boxHeight - wy;
        this._skillWindow = new Window_BattleSkill(0, wy, Graphics.boxWidth, wh);
        this._skillWindow.setHelpWindow(this._helpWindow);
        this._skillWindow.setHandler('ok',     this.onSkillOk.bind(this));
        this._skillWindow.setHandler('cancel', this.onSkillCancel.bind(this));
        this.addWindow(this._skillWindow);
    };

    createItemWindow() {
        var wy = this._helpWindow.y + this._helpWindow.height;
        var wh = Graphics._boxHeight - wy;
        this._itemWindow = new Window_BattleItem(0, wy, Graphics.boxWidth, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
    };

    createActorWindow() {
        this._actorWindow = new Window_BattleActor(0, 0);
        this._actorWindow.x = this._playerBars.x;
        this._actorWindow.setHandler('ok',     this.onActorOk.bind(this));
        this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
        this.addWindow(this._actorWindow);
    };

    createEnemyWindow() {
        this._enemyWindow = new Window_BattleEnemy(0, this._playerBars.y);
        this._enemyWindow.x = this._playerBars.x;
        this._enemyWindow.setHandler('ok',     this.onEnemyOk.bind(this));
        this._enemyWindow.setHandler('cancel', this.onEnemyCancel.bind(this));
        this.addWindow(this._enemyWindow);
    };

    createMessageWindow() {
        this._messageWindow = new Window_Message();
        this.addWindow(this._messageWindow);
        this._messageWindow.subWindows().forEach(function(window) {
            this.addWindow(window);
        }, this);
    };

    createScrollTextWindow() {
        this._scrollTextWindow = new Window_ScrollText();
        this.addWindow(this._scrollTextWindow);
    };

    refreshStatus() {
        this._playerBars.refresh();
        this._enemyBars.refresh();
    };

    commandEscape() {
        BattleManager.processEscape();
        this.changeInputWindow();
    };

    startSkillBarSelection() {
        this._skillBar.setup(BattleManager.actor());
        this._skillBar.show();
        this._skillBar.activate();
        this._skillBar.open();
    };

    commandAttack() {
        this._skillBar.hide();
        BattleManager.inputtingAction().setAttack();
        this.selectEnemySelection();
    };

    commandSkill() {
        this._skillBar.hide();
        this._skillWindow.setActor(BattleManager.actor());
        this._skillWindow.setStypeId(this._skillBar.currentExt());
        this._skillWindow.refresh();
        this._skillWindow.show();
        this._skillWindow.activate();
    };

    commandGuard() {
        this._skillBar.hide();
        BattleManager.inputtingAction().setGuard();
        this.selectNextCommand();
    };

    commandItem() {
        this._skillBar.hide();
        this._itemWindow.refresh();
        this._itemWindow.show();
        this._itemWindow.activate();
    };

    selectNextCommand() {
        BattleManager.selectNextCommand();
        this.changeInputWindow();
    };

    selectPreviousCommand() {
        BattleManager.selectPreviousCommand();
        this.changeInputWindow();
    };

    selectActorSelection() {
        this._actorWindow.refresh();
        this._actorWindow.show();
        this._actorWindow.activate();
    };

    onMenuCalled() {
        if (this.isSceneChangeOk()) {
            if (!SceneManager.isSceneChanging()) {
                this.reservedForGUI();
                SceneManager.push(Scene_Menu);
                Window_Menu.initCommandPosition();
            }
        }
    };

    onCharacterCalled() {
        if (this.isSceneChangeOk()) {
            if (!SceneManager.isSceneChanging()) {
                this.reservedForGUI();
                SceneManager.push(Scene_Character);
            }
        }
    }

    onObjectivesCalled() {
        if (this.isSceneChangeOk()) {
            if (!SceneManager.isSceneChanging()) {
                this.reservedForGUI();
                SceneManager.push(Scene_Objectives);
            }
        }
    }

    onActorOk() {
        var action = BattleManager.inputtingAction();
        action.setTarget(this._actorWindow.index);
        this._actorWindow.hide();
        this._skillWindow.hide();
        this._itemWindow.hide();
        this.selectNextCommand();
    };

    onActorCancel() {
        this._actorWindow.hide();
        switch (this._skillBar.currentSymbol()) {
            case 'skill':
                this._skillWindow.show();
                this._skillWindow.activate();
                break;
            case 'item':
                this._itemWindow.show();
                this._itemWindow.activate();
                break;
        }
    };

    selectEnemySelection() {
        this._enemyWindow.refresh();
        this._enemyWindow.show();
        this._enemyWindow.select(0);
        this._enemyWindow.activate();
    };

    onEnemyOk() {
        var action = BattleManager.inputtingAction();
        action.setTarget(this._enemyWindow.enemyIndex());
        this._enemyWindow.hide();
        this._skillWindow.hide();
        this._itemWindow.hide();
        this.selectNextCommand();
    };

    onEnemyCancel() {
        this._enemyWindow.hide();
        switch (this._skillBar.currentSymbol()) {
            case 'attack':
                this._skillBar.show();
                break;
            case 'skill':
                this._skillWindow.show();
                this._skillWindow.activate();
                break;
            case 'item':
                this._itemWindow.show();
                this._itemWindow.activate();
                break;
        }
    };

    onSkillOk() {
        var skill = this._skillWindow.item();
        var action = BattleManager.inputtingAction();
        action.setSkill(skill.id);
        BattleManager.actor().setLastBattleSkill(skill);
        this.onSelectAction();
    };

    onSkillCancel() {
        this._skillWindow.hide();
        this._skillBar.show();
    };

    onItemOk() {
        var item = this._itemWindow.item();
        var action = BattleManager.inputtingAction();
        action.setItem(item.id);
        $gameParty.setLastItem(item);
        this.onSelectAction();
    };

    onItemCancel() {
        this._itemWindow.hide();
        this._skillBar.show();
    };

    onSelectAction() {
        var action = BattleManager.inputtingAction();
        this._skillWindow.hide();
        this._itemWindow.hide();
        if (!action.needsSelection()) {
            this.selectNextCommand();
        } else if (action.isForOpponent()) {
            this.selectEnemySelection();
        } else {
            this.selectActorSelection();
        }
    };

    endCommandSelection() {
        this._skillBar.deactivate();
        this._skillBar.close();
    };
}

//-----------------------------------------------------------------------------
// Scene_Gameover
//
// The scene class of the game over screen.

class Scene_Gameover extends Scene_Base {
    constructor() {
        super();
    }

    create() {
        super.create();
        this.playGameoverMusic();
        this.createBackground();
    };

    start() {
        super.start();
        this.startFadeIn(this.slowFadeSpeed(), false);
    };

    update() {
        if (this.isActive() && !this.isBusy() && this.isTriggered()) {
            this.gotoTitle();
        }
        super.update();
    };

    stop() {
        super.stop();
        this.fadeOutAll();
    };

    terminate() {
        super.terminate();
        AudioManager.stopAll();
    };

    playGameoverMusic() {
        AudioManager.stopBgm();
        AudioManager.stopBgs();
        AudioManager.playMe($dataSystem.gameoverMe);
    };

    createBackground() {
        this._backSprite = new Sprite();
        this._backSprite.bitmap = ImageManager.loadSystem('GameOver');
        this.addChild(this._backSprite);
    };

    isTriggered() {
        return Input.isTriggered('ok') || TouchInput.isTriggered();
    };

    gotoTitle() {
        SceneManager.goto(Scene_Control);
    };
}

/*
PIXI.utils.TextureCache['source'];
renderer.view === canvas;

PIXI.loader
  .add("images/anyImage.png")
  .load(setup);
 */

class Scene_Troops extends Scene_Base {
    constructor() {
        super();
    }

    create() {
        this.createWindowLayer();
        this.createAllWindows();
    }

    createAllWindows() {
        this.createButtonWindow();
        this.createTroopNameWindow();
        this.createPreviewWindow();
    }

    createButtonWindow() {
        this._buttonWindow = new Window_TroopButton();
        this.addWindow(this._buttonWindow);
    }

    createTroopNameWindow() {
        this._troopNameWindow = new Window_TroopName();
        this._troopNameWindow.x = this._buttonWindow.width;
        this.addWindow(this._troopNameWindow);
    }

    createPreviewWindow() {
        this._previewWindow = new Window_TroopPreview();
        this._previewWindow.x = this._buttonWindow.width;
        this._previewWindow.y = this._troopNameWindow.height;
        this.addWindow(this._previewWindow);
    }

}