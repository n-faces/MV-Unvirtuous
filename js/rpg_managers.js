//=============================================================================
// rpg_managers.js v1.5.1
//=============================================================================

//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.

class DataManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static loadDatabase() {
        var test = this.isBattleTest() || this.isEventTest();
        var prefix = test ? 'Test_' : '';
        for (var i = 0; i < this._databaseFiles.length; i++) {
            var name = this._databaseFiles[i].name;
            var src = this._databaseFiles[i].src;
            this.loadDataFile(name, prefix + src);
        }
        if (this.isEventTest()) {
            this.loadDataFile('$testEvent', prefix + 'Event.json');
        }
    };

    static loadDataFile(name, src) {
        var xhr = new XMLHttpRequest();
        var url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function () {
            if (xhr.status < 400) {
                window[name] = JSON.parse(xhr.responseText);
                DataManager.onLoad(window[name]);
            }
        };
        xhr.onerror = this._mapLoader || function () {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        window[name] = null;
        xhr.send();
    };

    static isDatabaseLoaded() {
        this.checkError();
        for (var i = 0; i < this._databaseFiles.length; i++) {
            if (!window[this._databaseFiles[i].name]) {
                return false;
            }
        }
        return true;
    };

    static loadMapData(mapId) {
        if (mapId > 0) {
            var filename = 'Map%1.json'.format(mapId.padZero(3));
            this._mapLoader = ResourceHandler.createLoader('data/' + filename, this.loadDataFile.bind(this, '$dataMap', filename));
            this.loadDataFile('$dataMap', filename);
        } else {
            this.makeEmptyMap();
        }
    };

    static makeEmptyMap() {
        $dataMap = {};
        $dataMap.data = [];
        $dataMap.events = [];
        $dataMap.width = 100;
        $dataMap.height = 100;
        $dataMap.scrollType = 3;
    };

    static isMapLoaded() {
        this.checkError();
        return !!$dataMap;
    };

    static onLoad(object) {
        var array;
        if (object === $dataMap) {
            this.extractMetadata(object);
            array = object.events;
        } else {
            array = object;
        }
        if (Array.isArray(array)) {
            for (var i = 0; i < array.length; i++) {
                var data = array[i];
                if (data && data.note !== undefined) {
                    this.extractMetadata(data);
                }
            }
        }
        if (object === $dataSystem) {
            Decrypter.hasEncryptedImages = !!object.hasEncryptedImages;
            Decrypter.hasEncryptedAudio = !!object.hasEncryptedAudio;
            Scene_Boot.loadSystemImages();
        }
    };

    static extractMetadata(data) {
        var re = /<([^<>:]+)(:?)([^>]*)>/g;
        data.meta = {};
        for (; ;) {
            var match = re.exec(data.note);
            if (match) {
                if (match[2] === ':') {
                    data.meta[match[1]] = match[3];
                } else {
                    data.meta[match[1]] = true;
                }
            } else {
                break;
            }
        }
    };

    static checkError() {
        if (DataManager._errorUrl) {
            throw new Error('Failed to load: ' + DataManager._errorUrl);
        }
    };

    static isBattleTest() {
        return Utils.isOptionValid('btest');
    };

    static isEventTest() {
        return Utils.isOptionValid('etest');
    };

    static isSkill(item) {
        return item && $dataSkills.contains(item);
    };

    static isItem(item) {
        return item && $dataItems.contains(item);
    };

    static isWeapon(item) {
        return item && $dataWeapons.contains(item);
    };

    static isArmor(item) {
        return item && $dataArmors.contains(item);
    };

    static createGameObjects() {
        $gameTemp = new Game_Temp();
        $gameSystem = new Game_System();
        $gameScreen = new Game_Screen();
        $gameTimer = new Game_Timer();
        $gameMessage = new Game_Message();
        $gameSwitches = new Game_Switches();
        $gameVariables = new Game_Variables();
        $gameSelfSwitches = new Game_SelfSwitches();
        $gameActors = new Game_Actors();
        $gameParty = new Game_Party();
        $gameTroop = new Game_Troop();
        $gameMap = new Game_Map();
        $gamePlayer = new Game_Player();
    };

    static setupNewGame() {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        $gameParty.setupStartingMembers();
        $gamePlayer.reserveTransfer($dataSystem.startMapId,
            $dataSystem.startX, $dataSystem.startY);
        Graphics.frameCount = 0;
    };

    static setupBattleTest() {
        this.createGameObjects();
        $gameParty.setupBattleTest();
        BattleManager.setup($dataSystem.testTroopId, true, false);
        BattleManager.setBattleTest(true);
        BattleManager.playBattleBgm();
    };

    static setupEventTest() {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        $gameParty.setupStartingMembers();
        $gamePlayer.reserveTransfer(-1, 8, 6);
        $gamePlayer.setTransparent(false);
    };

    static loadGlobalInfo() {
        var json;
        try {
            json = StorageManager.load(0);
        } catch (e) {
            console.error(e);
            return [];
        }
        if (json) {
            var globalInfo = JSON.parse(json);
            for (var i = 1; i <= this.maxSavefiles(); i++) {
                if (StorageManager.exists(i)) {
                    delete globalInfo[i];
                }
            }
            return globalInfo;
        } else {
            return [];
        }
    };

    static saveGlobalInfo(info) {
        StorageManager.save(0, JSON.stringify(info));
    };

    static isThisGameFile(savefileId) {
        var globalInfo = this.loadGlobalInfo();
        if (globalInfo && globalInfo[savefileId]) {
            if (StorageManager.isLocalMode()
            )
            {
                return true;
            }
            else
            {
                var savefile = globalInfo[savefileId];
                return (savefile.globalId === this._globalId &&
                    savefile.title === $dataSystem.gameTitle);
            }
        } else {
            return false;
        }
    };

    static isAnySavefileExists() {
        var globalInfo = this.loadGlobalInfo();
        if (globalInfo) {
            for (var i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i)) {
                    return true;
                }
            }
        }
        return false;
    };

    static latestSavefileId() {
        var globalInfo = this.loadGlobalInfo();
        var savefileId = 1;
        var timestamp = 0;
        if (globalInfo) {
            for (var i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
                    timestamp = globalInfo[i].timestamp;
                    savefileId = i;
                }
            }
        }
        return savefileId;
    };

    static loadAllSavefileImages() {
        var globalInfo = this.loadGlobalInfo();
        if (globalInfo) {
            for (var i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i)) {
                    var info = globalInfo[i];
                    this.loadSavefileImages(info);
                }
            }
        }
    };

    static loadSavefileImages(info) {
        if (info.characters) {
            for (var i = 0; i < info.characters.length; i++) {
                ImageManager.reserveCharacter(info.characters[i][0]);
            }
        }
        if (info.faces) {
            for (var j = 0; j < info.faces.length; j++) {
                ImageManager.reserveFace(info.faces[j][0]);
            }
        }
    };

    static maxSavefiles() {
        return 20;
    };

    static saveGame(savefileId) {
        try {
            StorageManager.backup(savefileId);
            return this.saveGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            try {
                StorageManager.remove(savefileId);
                StorageManager.restoreBackup(savefileId);
            } catch (e2) {
            }
            return false;
        }
    };

    static loadGame(savefileId) {
        try {
            return this.loadGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    static loadSavefileInfo(savefileId) {
        var globalInfo = this.loadGlobalInfo();
        return (globalInfo && globalInfo[savefileId]) ? globalInfo[savefileId] : null;
    };

    static lastAccessedSavefileId() {
        return this._lastAccessedId;
    };

    static saveGameWithoutRescue(savefileId) {
        var json = JsonEx.stringify(this.makeSaveContents());
        if (json.length >= 200000) {
            console.warn('Save data too big!');
        }
        StorageManager.save(savefileId, json);
        this._lastAccessedId = savefileId;
        var globalInfo = this.loadGlobalInfo() || [];
        globalInfo[savefileId] = this.makeSavefileInfo();
        this.saveGlobalInfo(globalInfo);
        return true;
    };

    static loadGameWithoutRescue(savefileId) {
        var globalInfo = this.loadGlobalInfo();
        if (this.isThisGameFile(savefileId)) {
            var json = StorageManager.load(savefileId);
            this.createGameObjects();
            this.extractSaveContents(JsonEx.parse(json));
            this._lastAccessedId = savefileId;
            return true;
        } else {
            return false;
        }
    };

    static selectSavefileForNewGame() {
        var globalInfo = this.loadGlobalInfo();
        this._lastAccessedId = 1;
        if (globalInfo) {
            var numSavefiles = Math.max(0, globalInfo.length - 1);
            if (numSavefiles < this.maxSavefiles()) {
                this._lastAccessedId = numSavefiles + 1;
            } else {
                var timestamp = Number.MAX_VALUE;
                for (var i = 1; i < globalInfo.length; i++) {
                    if (!globalInfo[i]) {
                        this._lastAccessedId = i;
                        break;
                    }
                    if (globalInfo[i].timestamp < timestamp) {
                        timestamp = globalInfo[i].timestamp;
                        this._lastAccessedId = i;
                    }
                }
            }
        }
    };

    static makeSavefileInfo() {
        var info = {};
        info.globalId = this._globalId;
        info.title = $dataSystem.gameTitle;
        info.characters = $gameParty.charactersForSavefile();
        info.faces = $gameParty.facesForSavefile();
        info.playtime = $gameSystem.playtimeText();
        info.timestamp = Date.now();
        return info;
    };

    static makeSaveContents() {
        // A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
        var contents = {};
        contents.system = $gameSystem;
        contents.screen = $gameScreen;
        contents.timer = $gameTimer;
        contents.switches = $gameSwitches;
        contents.variables = $gameVariables;
        contents.selfSwitches = $gameSelfSwitches;
        contents.actors = $gameActors;
        contents.party = $gameParty;
        contents.map = $gameMap;
        contents.player = $gamePlayer;
        return contents;
    };

    static extractSaveContents(contents) {
        $gameSystem = contents.system;
        $gameScreen = contents.screen;
        $gameTimer = contents.timer;
        $gameSwitches = contents.switches;
        $gameVariables = contents.variables;
        $gameSelfSwitches = contents.selfSwitches;
        $gameActors = contents.actors;
        $gameParty = contents.party;
        $gameMap = contents.map;
        $gamePlayer = contents.player;
    };
}

var $dataActors       = null;
var $dataClasses      = null;
var $dataSkills       = null;
var $dataItems        = null;
var $dataWeapons      = null;
var $dataArmors       = null;
var $dataEnemies      = null;
var $dataTroops       = null;
var $dataStates       = null;
var $dataAnimations   = null;
var $dataTilesets     = null;
var $dataCommonEvents = null;
var $dataSystem       = null;
var $dataMapInfos     = null;
var $dataMap          = null;
var $gameTemp         = null;
var $gameSystem       = null;
var $gameScreen       = null;
var $gameTimer        = null;
var $gameMessage      = null;
var $gameSwitches     = null;
var $gameVariables    = null;
var $gameSelfSwitches = null;
var $gameActors       = null;
var $gameParty        = null;
var $gameTroop        = null;
var $gameMap          = null;
var $gamePlayer       = null;
var $testEvent        = null;

DataManager._globalId = 'RPGMV';
DataManager._lastAccessedId = 1;
DataManager._errorUrl = null;

DataManager._databaseFiles = [
    { name: '$dataActors',       src: 'Actors.json'       },
    { name: '$dataClasses',      src: 'Classes.json'      },
    { name: '$dataSkills',       src: 'Skills.json'       },
    { name: '$dataItems',        src: 'Items.json'        },
    { name: '$dataWeapons',      src: 'Weapons.json'      },
    { name: '$dataArmors',       src: 'Armors.json'       },
    { name: '$dataEnemies',      src: 'Enemies.json'      },
    { name: '$dataTroops',       src: 'Troops.json'       },
    { name: '$dataStates',       src: 'States.json'       },
    { name: '$dataAnimations',   src: 'Animations.json'   },
    { name: '$dataTilesets',     src: 'Tilesets.json'     },
    { name: '$dataCommonEvents', src: 'CommonEvents.json' },
    { name: '$dataSystem',       src: 'System.json'       },
    { name: '$dataMapInfos',     src: 'MapInfos.json'     }
];
//-----------------------------------------------------------------------------
// ConfigManager
//
// The static class that manages the configuration data.

class ConfigManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static load() {
        var json;
        var config = {};
        try {
            json = StorageManager.load(-1);
        } catch (e) {
            console.error(e);
        }
        if (json) {
            config = JSON.parse(json);
        }
        this.applyData(config);
    };

    static save() {
        StorageManager.save(-1, JSON.stringify(this.makeData()));
    };

    static makeData() {
        var config = {};
        config.alwaysDash = this.alwaysDash;
        config.commandRemember = this.commandRemember;
        config.bgmVolume = this.bgmVolume;
        config.bgsVolume = this.bgsVolume;
        config.meVolume = this.meVolume;
        config.seVolume = this.seVolume;
        return config;
    };

    static applyData(config) {
        this.alwaysDash = this.readFlag(config, 'alwaysDash');
        this.commandRemember = this.readFlag(config, 'commandRemember');
        this.bgmVolume = this.readVolume(config, 'bgmVolume');
        this.bgsVolume = this.readVolume(config, 'bgsVolume');
        this.meVolume = this.readVolume(config, 'meVolume');
        this.seVolume = this.readVolume(config, 'seVolume');
    };

    static readFlag(config, name) {
        return !!config[name];
    };

    static readVolume(config, name) {
        var value = config[name];
        if (value !== undefined) {
            return Number(value).clamp(0, 100);
        } else {
            return 100;
        }
    };
}

ConfigManager.alwaysDash = false;
ConfigManager.commandRemember = false;

Object.defineProperty(ConfigManager, 'bgmVolume', {
    get: function () {
        return AudioManager._bgmVolume;
    },
    set: function (value) {
        AudioManager.bgmVolume = value;
    },
    configurable: true
});

Object.defineProperty(ConfigManager, 'bgsVolume', {
    get: function () {
        return AudioManager.bgsVolume;
    },
    set: function (value) {
        AudioManager.bgsVolume = value;
    },
    configurable: true
});

Object.defineProperty(ConfigManager, 'meVolume', {
    get: function () {
        return AudioManager.meVolume;
    },
    set: function (value) {
        AudioManager.meVolume = value;
    },
    configurable: true
});

Object.defineProperty(ConfigManager, 'seVolume', {
    get: function () {
        return AudioManager.seVolume;
    },
    set: function (value) {
        AudioManager.seVolume = value;
    },
    configurable: true
});

//-----------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.

class StorageManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static save(savefileId, json) {
        if (this.isLocalMode()) {
            this.saveToLocalFile(savefileId, json);
        } else {
            this.saveToWebStorage(savefileId, json);
        }
    };

    static load(savefileId) {
        if (this.isLocalMode()) {
            return this.loadFromLocalFile(savefileId);
        } else {
            return this.loadFromWebStorage(savefileId);
        }
    };

    static exists(savefileId) {
        if (this.isLocalMode()) {
            return this.localFileExists(savefileId);
        } else {
            return this.webStorageExists(savefileId);
        }
    };

    static remove(savefileId) {
        if (this.isLocalMode()) {
            this.removeLocalFile(savefileId);
        } else {
            this.removeWebStorage(savefileId);
        }
    };

    static backup(savefileId) {
        if (this.exists(savefileId)) {
            if (this.isLocalMode()) {
                var data = this.loadFromLocalFile(savefileId);
                var compressed = LZString.compressToBase64(data);
                var fs = require('fs');
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId) + ".bak";
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
            } else {
                var data = this.loadFromWebStorage(savefileId);
                var compressed = LZString.compressToBase64(data);
                var key = this.webStorageKey(savefileId) + "bak";
                localStorage.setItem(key, compressed);
            }
        }
    };

    static backupExists(savefileId) {
        if (this.isLocalMode()) {
            return this.localFileBackupExists(savefileId);
        } else {
            return this.webStorageBackupExists(savefileId);
        }
    };

    static cleanBackup(savefileId) {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                var fs = require('fs');
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId);
                fs.unlinkSync(filePath + ".bak");
            } else {
                var key = this.webStorageKey(savefileId);
                localStorage.removeItem(key + "bak");
            }
        }
    };

    static restoreBackup(savefileId) {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                var data = this.loadFromLocalBackupFile(savefileId);
                var compressed = LZString.compressToBase64(data);
                var fs = require('fs');
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
                fs.unlinkSync(filePath + ".bak");
            } else {
                var data = this.loadFromWebStorageBackup(savefileId);
                var compressed = LZString.compressToBase64(data);
                var key = this.webStorageKey(savefileId);
                localStorage.setItem(key, compressed);
                localStorage.removeItem(key + "bak");
            }
        }
    };

    static isLocalMode() {
        return Utils.isNwjs();
    };

    static saveToLocalFile(savefileId, json) {
        var data = LZString.compressToBase64(json);
        var fs = require('fs');
        var dirPath = this.localFileDirectoryPath();
        var filePath = this.localFilePath(savefileId);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        fs.writeFileSync(filePath, data);
    };

    static loadFromLocalFile(savefileId) {
        var data = null;
        var fs = require('fs');
        var filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, {encoding: 'utf8'});
        }
        return LZString.decompressFromBase64(data);
    };

    static loadFromLocalBackupFile(savefileId) {
        var data = null;
        var fs = require('fs');
        var filePath = this.localFilePath(savefileId) + ".bak";
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, {encoding: 'utf8'});
        }
        return LZString.decompressFromBase64(data);
    };

    static localFileBackupExists(savefileId) {
        var fs = require('fs');
        return fs.existsSync(this.localFilePath(savefileId) + ".bak");
    };

    static localFileExists(savefileId) {
        var fs = require('fs');
        return fs.existsSync(this.localFilePath(savefileId));
    };

    static removeLocalFile(savefileId) {
        var fs = require('fs');
        var filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    };

    static saveToWebStorage(savefileId, json) {
        var key = this.webStorageKey(savefileId);
        var data = LZString.compressToBase64(json);
        localStorage.setItem(key, data);
    };

    static loadFromWebStorage(savefileId) {
        var key = this.webStorageKey(savefileId);
        var data = localStorage.getItem(key);
        return LZString.decompressFromBase64(data);
    };

    static loadFromWebStorageBackup(savefileId) {
        var key = this.webStorageKey(savefileId) + "bak";
        var data = localStorage.getItem(key);
        return LZString.decompressFromBase64(data);
    };

    static webStorageBackupExists(savefileId) {
        var key = this.webStorageKey(savefileId) + "bak";
        return !!localStorage.getItem(key);
    };

    static webStorageExists(savefileId) {
        var key = this.webStorageKey(savefileId);
        return !!localStorage.getItem(key);
    };

    static removeWebStorage(savefileId) {
        var key = this.webStorageKey(savefileId);
        localStorage.removeItem(key);
    };

    static localFileDirectoryPath() {
        var path = require('path');

        var base = path.dirname(process.mainModule.filename);
        return path.join(base, 'save/');
    };

    static localFilePath(savefileId) {
        var name;
        if (savefileId < 0) {
            name = 'config.rpgsave';
        } else if (savefileId === 0) {
            name = 'global.rpgsave';
        } else {
            name = 'file%1.rpgsave'.format(savefileId);
        }
        return this.localFileDirectoryPath() + name;
    };

    static webStorageKey(savefileId) {
        if (savefileId < 0) {
            return 'RPG Config';
        } else if (savefileId === 0) {
            return 'RPG Global';
        } else {
            return 'RPG File%1'.format(savefileId);
        }
    };

}

//-----------------------------------------------------------------------------
// ImageManager
//
// The static class that loads images, creates bitmap objects and retains them.

class ImageManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static _generateCacheKey(path, hue) {
        return path + ':' + hue;
    };

    static loadAnimation(filename, hue) {
        return this.loadBitmap('img/animations/', filename, hue, true);
    };

    static loadBattleback1(filename, hue) {
        return this.loadBitmap('img/battlebacks1/', filename, hue, true);
    };

    static loadBattleback2(filename, hue) {
        return this.loadBitmap('img/battlebacks2/', filename, hue, true);
    };

    static loadEnemy(filename, hue) {
        return this.loadBitmap('img/enemies/', filename, hue, true);
    };

    static loadCharacter(filename, hue) {
        return this.loadBitmap('img/characters/', filename, hue, false);
    };

    static loadFace(filename, hue) {
        return this.loadBitmap('img/faces/', filename, hue, true);
    };

    static loadParallax(filename, hue) {
        return this.loadBitmap('img/parallaxes/', filename, hue, true);
    };

    static loadPicture(filename, hue) {
        return this.loadBitmap('img/pictures/', filename, hue, true);
    };

    static loadSvActor(filename, hue) {
        return this.loadBitmap('img/sv_actors/', filename, hue, false);
    };

    static loadSvEnemy(filename, hue) {
        return this.loadBitmap('img/sv_enemies/', filename, hue, true);
    };

    static loadSystem(filename, hue) {
        return this.loadBitmap('img/system/', filename, hue, false);
    };

    static loadTileset(filename, hue) {
        return this.loadBitmap('img/tilesets/', filename, hue, false);
    };

    static loadTitle1(filename, hue) {
        return this.loadBitmap('img/titles1/', filename, hue, true);
    };

    static loadTitle2(filename, hue) {
        return this.loadBitmap('img/titles2/', filename, hue, true);
    };

    static loadBitmap(folder, filename, hue, smooth) {
        if (filename) {
            var path = folder + encodeURIComponent(filename) + '.png';
            var bitmap = this.loadNormalBitmap(path, hue || 0);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    };

    static loadEmptyBitmap() {
        var empty = this._imageCache.get('empty');
        if (!empty) {
            empty = new Bitmap();
            this._imageCache.add('empty', empty);
            this._imageCache.reserve('empty', empty, this._systemReservationId);
        }

        return empty;
    };

    static loadNormalBitmap(path, hue) {
        var key = this._generateCacheKey(path, hue);
        var bitmap = this._imageCache.get(key);
        if (!bitmap) {
            bitmap = Bitmap.load(path);
            bitmap.addLoadListener(function () {
                bitmap.rotateHue(hue);
            });
            this._imageCache.add(key, bitmap);
        } else if (!bitmap.isReady()) {
            bitmap.decode();
        }

        return bitmap;
    };

    static clear() {
        this._imageCache = new ImageCache();
    };

    static isReady() {
        return this._imageCache.isReady();
    };

    static isObjectCharacter(filename) {
        var sign = filename.match(/^[\!\$]+/);
        return sign && sign[0].contains('!');
    };

    static isBigCharacter(filename) {
        var sign = filename.match(/^[\!\$]+/);
        return sign && sign[0].contains('$');
    };

    static isZeroParallax(filename) {
        return filename.charAt(0) === '!';
    };


    static reserveAnimation(filename, hue, reservationId) {
        return this.reserveBitmap('img/animations/', filename, hue, true, reservationId);
    };

    static reserveBattleback1(filename, hue, reservationId) {
        return this.reserveBitmap('img/battlebacks1/', filename, hue, true, reservationId);
    };

    static reserveBattleback2(filename, hue, reservationId) {
        return this.reserveBitmap('img/battlebacks2/', filename, hue, true, reservationId);
    };

    static reserveEnemy(filename, hue, reservationId) {
        return this.reserveBitmap('img/enemies/', filename, hue, true, reservationId);
    };

    static reserveCharacter(filename, hue, reservationId) {
        return this.reserveBitmap('img/characters/', filename, hue, false, reservationId);
    };

    static reserveFace(filename, hue, reservationId) {
        return this.reserveBitmap('img/faces/', filename, hue, true, reservationId);
    };

    static reserveParallax(filename, hue, reservationId) {
        return this.reserveBitmap('img/parallaxes/', filename, hue, true, reservationId);
    };

    static reservePicture(filename, hue, reservationId) {
        return this.reserveBitmap('img/pictures/', filename, hue, true, reservationId);
    };

    static reserveSvActor(filename, hue, reservationId) {
        return this.reserveBitmap('img/sv_actors/', filename, hue, false, reservationId);
    };

    static reserveSvEnemy(filename, hue, reservationId) {
        return this.reserveBitmap('img/sv_enemies/', filename, hue, true, reservationId);
    };

    static reserveSystem(filename, hue, reservationId) {
        return this.reserveBitmap('img/system/', filename, hue, false, reservationId || this._systemReservationId);
    };

    static reserveTileset(filename, hue, reservationId) {
        return this.reserveBitmap('img/tilesets/', filename, hue, false, reservationId);
    };

    static reserveTitle1(filename, hue, reservationId) {
        return this.reserveBitmap('img/titles1/', filename, hue, true, reservationId);
    };

    static reserveTitle2(filename, hue, reservationId) {
        return this.reserveBitmap('img/titles2/', filename, hue, true, reservationId);
    };

    static reserveBitmap(folder, filename, hue, smooth, reservationId) {
        if (filename) {
            var path = folder + encodeURIComponent(filename) + '.png';
            var bitmap = this.reserveNormalBitmap(path, hue || 0, reservationId || this._defaultReservationId);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    };

    static reserveNormalBitmap(path, hue, reservationId) {
        var bitmap = this.loadNormalBitmap(path, hue);
        this._imageCache.reserve(this._generateCacheKey(path, hue), bitmap, reservationId);

        return bitmap;
    };

    static releaseReservation(reservationId) {
        this._imageCache.releaseReservation(reservationId);
    };

    static setDefaultReservationId(reservationId) {
        this._defaultReservationId = reservationId;
    };


    static requestAnimation(filename, hue) {
        return this.requestBitmap('img/animations/', filename, hue, true);
    };

    static requestBattleback1(filename, hue) {
        return this.requestBitmap('img/battlebacks1/', filename, hue, true);
    };

    static requestBattleback2(filename, hue) {
        return this.requestBitmap('img/battlebacks2/', filename, hue, true);
    };

    static requestEnemy(filename, hue) {
        return this.requestBitmap('img/enemies/', filename, hue, true);
    };

    static requestCharacter(filename, hue) {
        return this.requestBitmap('img/characters/', filename, hue, false);
    };

    static requestFace(filename, hue) {
        return this.requestBitmap('img/faces/', filename, hue, true);
    };

    static requestParallax(filename, hue) {
        return this.requestBitmap('img/parallaxes/', filename, hue, true);
    };

    static requestPicture(filename, hue) {
        return this.requestBitmap('img/pictures/', filename, hue, true);
    };

    static requestSvActor(filename, hue) {
        return this.requestBitmap('img/sv_actors/', filename, hue, false);
    };

    static requestSvEnemy(filename, hue) {
        return this.requestBitmap('img/sv_enemies/', filename, hue, true);
    };

    static requestSystem(filename, hue) {
        return this.requestBitmap('img/system/', filename, hue, false);
    };

    static requestTileset(filename, hue) {
        return this.requestBitmap('img/tilesets/', filename, hue, false);
    };

    static requestTitle1(filename, hue) {
        return this.requestBitmap('img/titles1/', filename, hue, true);
    };

    static requestTitle2(filename, hue) {
        return this.requestBitmap('img/titles2/', filename, hue, true);
    };

    static requestBitmap(folder, filename, hue, smooth) {
        if (filename) {
            var path = folder + encodeURIComponent(filename) + '.png';
            var bitmap = this.requestNormalBitmap(path, hue || 0);
            bitmap.smooth = smooth;
            return bitmap;
        } else {
            return this.loadEmptyBitmap();
        }
    };

    static requestNormalBitmap(path, hue) {
        var key = this._generateCacheKey(path, hue);
        var bitmap = this._imageCache.get(key);
        if (!bitmap) {
            bitmap = Bitmap.request(path);
            bitmap.addLoadListener(function () {
                bitmap.rotateHue(hue);
            });
            this._imageCache.add(key, bitmap);
            this._requestQueue.enqueue(key, bitmap);
        } else {
            this._requestQueue.raisePriority(key);
        }

        return bitmap;
    };

    static update() {
        this._requestQueue.update();
    };

    static clearRequest() {
        this._requestQueue.clear();
    };
}

ImageManager.cache = new CacheMap(ImageManager);

ImageManager._imageCache = new ImageCache();
ImageManager._requestQueue = new RequestQueue();
ImageManager._systemReservationId = Utils.generateRuntimeId();

//-----------------------------------------------------------------------------
// AudioManager
//
// The static class that handles BGM, BGS, ME and SE.

class AudioManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static playBgm(bgm, pos) {
        if (this.isCurrentBgm(bgm)) {
            this.updateBgmParameters(bgm);
        } else {
            this.stopBgm();
            if (bgm.name) {
                if (Decrypter.hasEncryptedAudio && this.shouldUseHtml5Audio()) {
                    this.playEncryptedBgm(bgm, pos);
                }
                else {
                    this._bgmBuffer = this.createBuffer('bgm', bgm.name);
                    this.updateBgmParameters(bgm);
                    if (!this._meBuffer) {
                        this._bgmBuffer.play(true, pos || 0);
                    }
                }
            }
        }
        this.updateCurrentBgm(bgm, pos);
    };

    static playEncryptedBgm(bgm, pos) {
        var ext = this.audioFileExt();
        var url = this._path + 'bgm/' + encodeURIComponent(bgm.name) + ext;
        url = Decrypter.extToEncryptExt(url);
        Decrypter.decryptHTML5Audio(url, bgm, pos);
    };

    static createDecryptBuffer(url, bgm, pos) {
        this._blobUrl = url;
        this._bgmBuffer = this.createBuffer('bgm', bgm.name);
        this.updateBgmParameters(bgm);
        if (!this._meBuffer) {
            this._bgmBuffer.play(true, pos || 0);
        }
        this.updateCurrentBgm(bgm, pos);
    };

    static replayBgm(bgm) {
        if (this.isCurrentBgm(bgm)) {
            this.updateBgmParameters(bgm);
        } else {
            this.playBgm(bgm, bgm.pos);
            if (this._bgmBuffer) {
                this._bgmBuffer.fadeIn(this._replayFadeTime);
            }
        }
    };

    static isCurrentBgm(bgm) {
        return (this._currentBgm && this._bgmBuffer &&
            this._currentBgm.name === bgm.name);
    };

    static updateBgmParameters(bgm) {
        this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
    };

    static updateCurrentBgm(bgm, pos) {
        this._currentBgm = {
            name: bgm.name,
            volume: bgm.volume,
            pitch: bgm.pitch,
            pan: bgm.pan,
            pos: pos
        };
    };

    static stopBgm() {
        if (this._bgmBuffer) {
            this._bgmBuffer.stop();
            this._bgmBuffer = null;
            this._currentBgm = null;
        }
    };

    static fadeOutBgm(duration) {
        if (this._bgmBuffer && this._currentBgm) {
            this._bgmBuffer.fadeOut(duration);
            this._currentBgm = null;
        }
    };

    static fadeInBgm(duration) {
        if (this._bgmBuffer && this._currentBgm) {
            this._bgmBuffer.fadeIn(duration);
        }
    };

    static playBgs(bgs, pos) {
        if (this.isCurrentBgs(bgs)) {
            this.updateBgsParameters(bgs);
        } else {
            this.stopBgs();
            if (bgs.name) {
                this._bgsBuffer = this.createBuffer('bgs', bgs.name);
                this.updateBgsParameters(bgs);
                this._bgsBuffer.play(true, pos || 0);
            }
        }
        this.updateCurrentBgs(bgs, pos);
    };

    static replayBgs(bgs) {
        if (this.isCurrentBgs(bgs)) {
            this.updateBgsParameters(bgs);
        } else {
            this.playBgs(bgs, bgs.pos);
            if (this._bgsBuffer) {
                this._bgsBuffer.fadeIn(this._replayFadeTime);
            }
        }
    };

    static isCurrentBgs(bgs) {
        return (this._currentBgs && this._bgsBuffer &&
            this._currentBgs.name === bgs.name);
    };

    static updateBgsParameters(bgs) {
        this.updateBufferParameters(this._bgsBuffer, this._bgsVolume, bgs);
    };

    static updateCurrentBgs(bgs, pos) {
        this._currentBgs = {
            name: bgs.name,
            volume: bgs.volume,
            pitch: bgs.pitch,
            pan: bgs.pan,
            pos: pos
        };
    };

    static stopBgs() {
        if (this._bgsBuffer) {
            this._bgsBuffer.stop();
            this._bgsBuffer = null;
            this._currentBgs = null;
        }
    };

    static fadeOutBgs(duration) {
        if (this._bgsBuffer && this._currentBgs) {
            this._bgsBuffer.fadeOut(duration);
            this._currentBgs = null;
        }
    };

    static fadeInBgs(duration) {
        if (this._bgsBuffer && this._currentBgs) {
            this._bgsBuffer.fadeIn(duration);
        }
    };

    static playMe(me) {
        this.stopMe();
        if (me.name) {
            if (this._bgmBuffer && this._currentBgm) {
                this._currentBgm.pos = this._bgmBuffer.seek();
                this._bgmBuffer.stop();
            }
            this._meBuffer = this.createBuffer('me', me.name);
            this.updateMeParameters(me);
            this._meBuffer.play(false);
            this._meBuffer.addStopListener(this.stopMe.bind(this));
        }
    };

    static updateMeParameters(me) {
        this.updateBufferParameters(this._meBuffer, this._meVolume, me);
    };

    static fadeOutMe(duration) {
        if (this._meBuffer) {
            this._meBuffer.fadeOut(duration);
        }
    };

    static stopMe() {
        if (this._meBuffer) {
            this._meBuffer.stop();
            this._meBuffer = null;
            if (this._bgmBuffer && this._currentBgm && !this._bgmBuffer.isPlaying()) {
                this._bgmBuffer.play(true, this._currentBgm.pos);
                this._bgmBuffer.fadeIn(this._replayFadeTime);
            }
        }
    };

    static playSe(se) {
        if (se.name) {
            this._seBuffers = this._seBuffers.filter(function (audio) {
                return audio.isPlaying();
            });
            var buffer = this.createBuffer('se', se.name);
            this.updateSeParameters(buffer, se);
            buffer.play(false);
            this._seBuffers.push(buffer);
        }
    };

    static updateSeParameters(buffer, se) {
        this.updateBufferParameters(buffer, this._seVolume, se);
    };

    static stopSe() {
        this._seBuffers.forEach(function (buffer) {
            buffer.stop();
        });
        this._seBuffers = [];
    };

    static playStaticSe(se) {
        if (se.name) {
            this.loadStaticSe(se);
            for (var i = 0; i < this._staticBuffers.length; i++) {
                var buffer = this._staticBuffers[i];
                if (buffer._reservedSeName === se.name) {
                    buffer.stop();
                    this.updateSeParameters(buffer, se);
                    buffer.play(false);
                    break;
                }
            }
        }
    };

    static loadStaticSe(se) {
        if (se.name && !this.isStaticSe(se)) {
            var buffer = this.createBuffer('se', se.name);
            buffer._reservedSeName = se.name;
            this._staticBuffers.push(buffer);
            if (this.shouldUseHtml5Audio()) {
                Html5Audio.setStaticSe(buffer._url);
            }
        }
    };

    static isStaticSe(se) {
        for (var i = 0; i < this._staticBuffers.length; i++) {
            var buffer = this._staticBuffers[i];
            if (buffer._reservedSeName === se.name) {
                return true;
            }
        }
        return false;
    };

    static stopAll() {
        this.stopMe();
        this.stopBgm();
        this.stopBgs();
        this.stopSe();
    };

    static saveBgm() {
        if (this._currentBgm) {
            var bgm = this._currentBgm;
            return {
                name: bgm.name,
                volume: bgm.volume,
                pitch: bgm.pitch,
                pan: bgm.pan,
                pos: this._bgmBuffer ? this._bgmBuffer.seek() : 0
            };
        } else {
            return this.makeEmptyAudioObject();
        }
    };

    static saveBgs() {
        if (this._currentBgs) {
            var bgs = this._currentBgs;
            return {
                name: bgs.name,
                volume: bgs.volume,
                pitch: bgs.pitch,
                pan: bgs.pan,
                pos: this._bgsBuffer ? this._bgsBuffer.seek() : 0
            };
        } else {
            return this.makeEmptyAudioObject();
        }
    };

    static makeEmptyAudioObject() {
        return {name: '', volume: 0, pitch: 0};
    };

    static createBuffer(folder, name) {
        var ext = this.audioFileExt();
        var url = this._path + folder + '/' + encodeURIComponent(name) + ext;
        if (this.shouldUseHtml5Audio() && folder === 'bgm') {
            if (this._blobUrl) Html5Audio.setup(this._blobUrl);
            else Html5Audio.setup(url);
            return Html5Audio;
        } else {
            return new WebAudio(url);
        }
    };

    static updateBufferParameters(buffer, configVolume, audio) {
        if (buffer && audio) {
            buffer.volume = configVolume * (audio.volume || 0) / 10000;
            buffer.pitch = (audio.pitch || 0) / 100;
            buffer.pan = (audio.pan || 0) / 100;
        }
    };

    static audioFileExt() {
        if (WebAudio.canPlayOgg() && !Utils.isMobileDevice()) {
            return '.ogg';
        } else {
            return '.m4a';
        }
    };

    static shouldUseHtml5Audio() {
        // The only case where we wanted html5audio was android/ no encrypt
        // Atsuma-ru asked to force webaudio there too, so just return false for ALL    // return Utils.isAndroidChrome() && !Decrypter.hasEncryptedAudio;
        return false;
    };

    static checkErrors() {
        this.checkWebAudioError(this._bgmBuffer);
        this.checkWebAudioError(this._bgsBuffer);
        this.checkWebAudioError(this._meBuffer);
        this._seBuffers.forEach(function (buffer) {
            this.checkWebAudioError(buffer);
        }.bind(this));
        this._staticBuffers.forEach(function (buffer) {
            this.checkWebAudioError(buffer);
        }.bind(this));
    };

    static checkWebAudioError(webAudio) {
        if (webAudio && webAudio.isError()) {
            throw new Error('Failed to load: ' + webAudio.url);
        }
    };
}

AudioManager._masterVolume   = 1;   // (min: 0, max: 1)
AudioManager._bgmVolume      = 100;
AudioManager._bgsVolume      = 100;
AudioManager._meVolume       = 100;
AudioManager._seVolume       = 100;
AudioManager._currentBgm     = null;
AudioManager._currentBgs     = null;
AudioManager._bgmBuffer      = null;
AudioManager._bgsBuffer      = null;
AudioManager._meBuffer       = null;
AudioManager._seBuffers      = [];
AudioManager._staticBuffers  = [];
AudioManager._replayFadeTime = 0.5;
AudioManager._path           = 'audio/';
AudioManager._blobUrl        = null;

Object.defineProperty(AudioManager, 'masterVolume', {
    get: function () {
        return this._masterVolume;
    },
    set: function (value) {
        this._masterVolume = value;
        WebAudio.setMasterVolume(this._masterVolume);
        Graphics.setVideoVolume(this._masterVolume);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'bgmVolume', {
    get: function () {
        return this._bgmVolume;
    },
    set: function (value) {
        this._bgmVolume = value;
        this.updateBgmParameters(this._currentBgm);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'bgsVolume', {
    get: function () {
        return this._bgsVolume;
    },
    set: function (value) {
        this._bgsVolume = value;
        this.updateBgsParameters(this._currentBgs);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'meVolume', {
    get: function () {
        return this._meVolume;
    },
    set: function (value) {
        this._meVolume = value;
        this.updateMeParameters(this._currentMe);
    },
    configurable: true
});

Object.defineProperty(AudioManager, 'seVolume', {
    get: function () {
        return this._seVolume;
    },
    set: function (value) {
        this._seVolume = value;
    },
    configurable: true
});

//-----------------------------------------------------------------------------
// SoundManager
//
// The static class that plays sound effects defined in the database.

class SoundManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static preloadImportantSounds() {
        this.loadSystemSound(0);
        this.loadSystemSound(1);
        this.loadSystemSound(2);
        this.loadSystemSound(3);
    };

    static loadSystemSound(n) {
        if ($dataSystem) {
            AudioManager.loadStaticSe($dataSystem.sounds[n]);
        }
    };

    static playSystemSound(n) {
        if ($dataSystem) {
            AudioManager.playStaticSe($dataSystem.sounds[n]);
        }
    };

    static playCursor() {
        this.playSystemSound(0);
    };

    static playOk() {
        this.playSystemSound(1);
    };

    static playCancel() {
        this.playSystemSound(2);
    };

    static playBuzzer() {
        this.playSystemSound(3);
    };

    static playEquip() {
        this.playSystemSound(4);
    };

    static playSave() {
        this.playSystemSound(5);
    };

    static playLoad() {
        this.playSystemSound(6);
    };

    static playBattleStart() {
        this.playSystemSound(7);
    };

    static playEscape() {
        this.playSystemSound(8);
    };

    static playEnemyAttack() {
        this.playSystemSound(9);
    };

    static playEnemyDamage() {
        this.playSystemSound(10);
    };

    static playEnemyCollapse() {
        this.playSystemSound(11);
    };

    static playBossCollapse1() {
        this.playSystemSound(12);
    };

    static playBossCollapse2() {
        this.playSystemSound(13);
    };

    static playActorDamage() {
        this.playSystemSound(14);
    };

    static playActorCollapse() {
        this.playSystemSound(15);
    };

    static playRecovery() {
        this.playSystemSound(16);
    };

    static playMiss() {
        this.playSystemSound(17);
    };

    static playEvasion() {
        this.playSystemSound(18);
    };

    static playMagicEvasion() {
        this.playSystemSound(19);
    };

    static playReflection() {
        this.playSystemSound(20);
    };

    static playShop() {
        this.playSystemSound(21);
    };

    static playUseItem() {
        this.playSystemSound(22);
    };

    static playUseSkill() {
        this.playSystemSound(23);
    };
}

//-----------------------------------------------------------------------------
// TextManager
//
// The static class that handles terms and messages.

class TextManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static basic(basicId) {
        return $dataSystem.terms.basic[basicId] || '';
    };

    static param(paramId) {
        return $dataSystem.terms.params[paramId] || '';
    };

    static command(commandId) {
        return $dataSystem.terms.commands[commandId] || '';
    };

    static message(messageId) {
        return $dataSystem.terms.messages[messageId] || '';
    };

    static getter(method, param) {
        return {
            get: function () {
                return this[method](param);
            },
            configurable: true
        };
    };
}

Object.defineProperty(TextManager, 'currencyUnit', {
    get: function () {
        return $dataSystem.currencyUnit;
    },
    configurable: true
});

Object.defineProperties(TextManager, {
    level           : TextManager.getter('basic', 0),
    levelA          : TextManager.getter('basic', 1),
    hp              : TextManager.getter('basic', 2),
    hpA             : TextManager.getter('basic', 3),
    mp              : TextManager.getter('basic', 4),
    mpA             : TextManager.getter('basic', 5),
    tp              : TextManager.getter('basic', 6),
    tpA             : TextManager.getter('basic', 7),
    exp             : TextManager.getter('basic', 8),
    expA            : TextManager.getter('basic', 9),
    fight           : TextManager.getter('command', 0),
    escape          : TextManager.getter('command', 1),
    attack          : TextManager.getter('command', 2),
    guard           : TextManager.getter('command', 3),
    item            : TextManager.getter('command', 4),
    skill           : TextManager.getter('command', 5),
    equip           : TextManager.getter('command', 6),
    status          : TextManager.getter('command', 7),
    formation       : TextManager.getter('command', 8),
    save            : TextManager.getter('command', 9),
    gameEnd         : TextManager.getter('command', 10),
    options         : TextManager.getter('command', 11),
    weapon          : TextManager.getter('command', 12),
    armor           : TextManager.getter('command', 13),
    keyItem         : TextManager.getter('command', 14),
    equip2          : TextManager.getter('command', 15),
    optimize        : TextManager.getter('command', 16),
    clear           : TextManager.getter('command', 17),
    newGame         : TextManager.getter('command', 18),
    continue_       : TextManager.getter('command', 19),
    toTitle         : TextManager.getter('command', 21),
    cancel          : TextManager.getter('command', 22),
    buy             : TextManager.getter('command', 24),
    sell            : TextManager.getter('command', 25),
    alwaysDash      : TextManager.getter('message', 'alwaysDash'),
    commandRemember : TextManager.getter('message', 'commandRemember'),
    bgmVolume       : TextManager.getter('message', 'bgmVolume'),
    bgsVolume       : TextManager.getter('message', 'bgsVolume'),
    meVolume        : TextManager.getter('message', 'meVolume'),
    seVolume        : TextManager.getter('message', 'seVolume'),
    possession      : TextManager.getter('message', 'possession'),
    expTotal        : TextManager.getter('message', 'expTotal'),
    expNext         : TextManager.getter('message', 'expNext'),
    saveMessage     : TextManager.getter('message', 'saveMessage'),
    loadMessage     : TextManager.getter('message', 'loadMessage'),
    file            : TextManager.getter('message', 'file'),
    partyName       : TextManager.getter('message', 'partyName'),
    emerge          : TextManager.getter('message', 'emerge'),
    preemptive      : TextManager.getter('message', 'preemptive'),
    surprise        : TextManager.getter('message', 'surprise'),
    escapeStart     : TextManager.getter('message', 'escapeStart'),
    escapeFailure   : TextManager.getter('message', 'escapeFailure'),
    victory         : TextManager.getter('message', 'victory'),
    defeat          : TextManager.getter('message', 'defeat'),
    obtainExp       : TextManager.getter('message', 'obtainExp'),
    obtainGold      : TextManager.getter('message', 'obtainGold'),
    obtainItem      : TextManager.getter('message', 'obtainItem'),
    levelUp         : TextManager.getter('message', 'levelUp'),
    obtainSkill     : TextManager.getter('message', 'obtainSkill'),
    useItem         : TextManager.getter('message', 'useItem'),
    criticalToEnemy : TextManager.getter('message', 'criticalToEnemy'),
    criticalToActor : TextManager.getter('message', 'criticalToActor'),
    actorDamage     : TextManager.getter('message', 'actorDamage'),
    actorRecovery   : TextManager.getter('message', 'actorRecovery'),
    actorGain       : TextManager.getter('message', 'actorGain'),
    actorLoss       : TextManager.getter('message', 'actorLoss'),
    actorDrain      : TextManager.getter('message', 'actorDrain'),
    actorNoDamage   : TextManager.getter('message', 'actorNoDamage'),
    actorNoHit      : TextManager.getter('message', 'actorNoHit'),
    enemyDamage     : TextManager.getter('message', 'enemyDamage'),
    enemyRecovery   : TextManager.getter('message', 'enemyRecovery'),
    enemyGain       : TextManager.getter('message', 'enemyGain'),
    enemyLoss       : TextManager.getter('message', 'enemyLoss'),
    enemyDrain      : TextManager.getter('message', 'enemyDrain'),
    enemyNoDamage   : TextManager.getter('message', 'enemyNoDamage'),
    enemyNoHit      : TextManager.getter('message', 'enemyNoHit'),
    evasion         : TextManager.getter('message', 'evasion'),
    magicEvasion    : TextManager.getter('message', 'magicEvasion'),
    magicReflection : TextManager.getter('message', 'magicReflection'),
    counterAttack   : TextManager.getter('message', 'counterAttack'),
    substitute      : TextManager.getter('message', 'substitute'),
    buffAdd         : TextManager.getter('message', 'buffAdd'),
    debuffAdd       : TextManager.getter('message', 'debuffAdd'),
    buffRemove      : TextManager.getter('message', 'buffRemove'),
    actionFailure   : TextManager.getter('message', 'actionFailure'),
});

//-----------------------------------------------------------------------------
// SceneManager
//
// The static class that manages scene transitions.

class SceneManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static _getTimeInMsWithoutMobileSafari() {
        return performance.now();
    };

    static run(sceneClass) {
        try {
            this.initialize();
            this.goto(sceneClass);
            this.requestUpdate();
        } catch (e) {
            this.catchException(e);
        }
    };

    static initialize() {
        this.initGraphics();
        this.checkFileAccess();
        this.initAudio();
        this.initInput();
        this.initNwjs();
        this.checkPluginErrors();
        this.setupErrorHandlers();
    };

    static initGraphics() {
        var type = this.preferableRendererType();
        Graphics.initialize(this._screenWidth, this._screenHeight, type);
        Graphics.boxWidth = this._boxWidth;
        Graphics.boxHeight = this._boxHeight;
        Graphics.setLoadingImage('img/system/Loading.png');
        if (Utils.isOptionValid('showfps')) {
            Graphics.showFps();
        }
        if (type === 'webgl') {
            this.checkWebGL();
        }
    };

    static preferableRendererType() {
        if (Utils.isOptionValid('canvas')) {
            return 'canvas';
        } else if (Utils.isOptionValid('webgl')) {
            return 'webgl';
        } else {
            return 'auto';
        }
    };

    static shouldUseCanvasRenderer() {
        return Utils.isMobileDevice();
    };

    static checkWebGL() {
        if (!Graphics.hasWebGL()) {
            throw new Error('Your browser does not support WebGL.');
        }
    };

    static checkFileAccess() {
        if (!Utils.canReadGameFiles()) {
            throw new Error('Your browser does not allow to read local files.');
        }
    };

    static initAudio() {
        var noAudio = Utils.isOptionValid('noaudio');
        if (!WebAudio.initialize(noAudio) && !noAudio) {
            throw new Error('Your browser does not support Web Audio API.');
        }
    };

    static initInput() {
        Input.initialize();
        TouchInput.initialize();
    };

    static initNwjs() {
        if (Utils.isNwjs()) {
            var gui = require('nw.gui');
            var win = gui.Window.get();
            if (process.platform === 'darwin' && !win.menu) {
                var menubar = new gui.Menu({type: 'menubar'});
                var option = {hideEdit: true, hideWindow: true};
                menubar.createMacBuiltin('Game', option);
                win.menu = menubar;
            }
        }
    };

    static checkPluginErrors() {
        PluginManager.checkErrors();
    };

    static setupErrorHandlers() {
        window.addEventListener('error', this.onError.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    };

    static requestUpdate() {
        if (!this._stopped) {
            requestAnimationFrame(this.update.bind(this));
        }
    };

    static update() {
        try {
            this.tickStart();
            if (Utils.isMobileSafari()) {
                this.updateInputData();
            }
            this.updateManagers();
            this.updateMain();
            this.tickEnd();
        } catch (e) {
            this.catchException(e);
        }
    };

    static terminate() {
        window.close();
    };

    static onError(e) {
        console.error(e.message);
        console.error(e.filename, e.lineno);
        try {
            this.stop();
            Graphics.printError('Error', e.message);
            AudioManager.stopAll();
        } catch (e2) {
        }
    };

    static onKeyDown(event) {
        if (!event.ctrlKey && !event.altKey) {
            switch (event.keyCode) {
                case 116:   // F5
                    if (Utils.isNwjs()) {
                        location.reload();
                    }
                    break;
                case 119:   // F8
                    if (Utils.isNwjs() && Utils.isOptionValid('test')) {
                        require('nw.gui').Window.get().showDevTools();
                    }
                    break;
            }
        }
    };

    static catchException(e) {
        if (e instanceof Error) {
            Graphics.printError(e.name, e.message);
            console.error(e.stack);
        } else {
            Graphics.printError('UnknownError', e);
        }
        AudioManager.stopAll();
        this.stop();
    };

    static tickStart() {
        Graphics.tickStart();
    };

    static tickEnd() {
        Graphics.tickEnd();
    };

    static updateInputData() {
        Input.update();
        TouchInput.update();
    };

    static updateMain() {
        if (Utils.isMobileSafari()) {
            this.changeScene();
            this.updateScene();
        } else {
            var newTime = this._getTimeInMsWithoutMobileSafari();
            var fTime = (newTime - this._currentTime) / 1000;
            if (fTime > 0.25) fTime = 0.25;
            this._currentTime = newTime;
            this._accumulator += fTime;
            while (this._accumulator >= this._deltaTime) {
                this.updateInputData();
                this.changeScene();
                this.updateScene();
                this._accumulator -= this._deltaTime;
            }
        }
        this.renderScene();
        this.requestUpdate();
    };

    static updateManagers() {
        ImageManager.update();
    };

    static changeScene() {
        if (this.isSceneChanging() && !this.isCurrentSceneBusy()) {
            if (this._scene) {
                this._scene.terminate();
                this._scene.detachReservation();
                this._previousClass = this._scene.constructor;
            }
            this._scene = this._nextScene;
            if (this._scene) {
                this._scene.attachReservation();
                this._scene.create();
                this._nextScene = null;
                this._sceneStarted = false;
                this.onSceneCreate();
            }
            if (this._exiting) {
                this.terminate();
            }
        }
    };

    static updateScene() {
        if (this._scene) {
            if (!this._sceneStarted && this._scene.isReady()) {
                this._scene.start();
                this._sceneStarted = true;
                this.onSceneStart();
            }
            if (this.isCurrentSceneStarted()) {
                this._scene.update();
            }
        }
    };

    static renderScene() {
        if (this.isCurrentSceneStarted()) {
            Graphics.render(this._scene);
        } else if (this._scene) {
            this.onSceneLoading();
        }
    };

    static onSceneCreate() {
        Graphics.startLoading();
    };

    static onSceneStart() {
        Graphics.endLoading();
    };

    static onSceneLoading() {
        Graphics.updateLoading();
    };

    static isSceneChanging() {
        return this._exiting || !!this._nextScene;
    };

    static isCurrentSceneBusy() {
        return this._scene && this._scene.isBusy();
    };

    static isCurrentSceneStarted() {
        return this._scene && this._sceneStarted;
    };

    static isNextScene(sceneClass) {
        return this._nextScene && this._nextScene.constructor === sceneClass;
    };

    static isPreviousScene(sceneClass) {
        return this._previousClass === sceneClass;
    };

    static goto(sceneClass) {
        if (sceneClass) {
            this._nextScene = new sceneClass();
        }
        if (this._scene) {
            this._scene.stop();
        }
    };

    static push(sceneClass) {
        this._stack.push(this._scene.constructor);
        this.goto(sceneClass);
    };

    static pop() {
        if (this._stack.length > 0) {
            this.goto(this._stack.pop());
        } else {
            this.exit();
        }
    };

    static exit() {
        this.goto(null);
        this._exiting = true;
    };

    static clearStack() {
        this._stack = [];
    };

    static stop() {
        this._stopped = true;
    };

    static prepareNextScene() {
        this._nextScene.prepare.apply(this._nextScene, arguments);
    };

    static snap() {
        return Bitmap.snap(this._scene);
    };

    static snapForBackground() {
        this._backgroundBitmap = this.snap();
        this._backgroundBitmap.blur();
    };

    static backgroundBitmap() {
        return this._backgroundBitmap;
    };

    static resume() {
        this._stopped = false;
        this.requestUpdate();
        if (!Utils.isMobileSafari()) {
            this._currentTime = this._getTimeInMsWithoutMobileSafari();
            this._accumulator = 0;
        }
    };
}

/*
 * Gets the current time in ms without on iOS Safari.
 * @private
 */
SceneManager._scene             = null;
SceneManager._nextScene         = null;
SceneManager._stack             = [];
SceneManager._stopped           = false;
SceneManager._sceneStarted      = false;
SceneManager._exiting           = false;
SceneManager._previousClass     = null;
SceneManager._backgroundBitmap  = null;
SceneManager._screenWidth       = 816;
SceneManager._screenHeight      = 624;
SceneManager._boxWidth          = 816;
SceneManager._boxHeight         = 624;
SceneManager._deltaTime = 1.0 / 60.0;
if (!Utils.isMobileSafari()) SceneManager._currentTime = SceneManager._getTimeInMsWithoutMobileSafari();
SceneManager._accumulator = 0.0;

//-----------------------------------------------------------------------------
// BattleManager
//
// The static class that manages battle progress.

class BattleManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static setup(troopId, canEscape, canLose) {
        this.initMembers();
        this._canEscape = canEscape;
        this._canLose = canLose;
        $gameTroop.setup(troopId);
        $gameScreen.onBattleStart();
        this.makeEscapeRatio();
    };

    static initMembers() {
        this._phase = 'init';
        this._canEscape = false;
        this._canLose = false;
        this._battleTest = false;
        this._eventCallback = null;
        this._preemptive = false;
        this._surprise = false;
        this._actorIndex = -1;
        this._actionForcedBattler = null;
        this._mapBgm = null;
        this._mapBgs = null;
        this._actionBattlers = [];
        this._subject = null;
        this._action = null;
        this._targets = [];
        this._logWindow = null;
        this._statusWindow = null;
        this._enemyStatusWindow = null;
        this._spriteset = null;
        this._escapeRatio = 0;
        this._escaped = false;
        this._rewards = {};
        this._turnForced = false;
    };

    static isBattleTest() {
        return this._battleTest;
    };

    static setBattleTest(battleTest) {
        this._battleTest = battleTest;
    };

    static setEventCallback(callback) {
        this._eventCallback = callback;
    };

    static setLogWindow(logWindow) {
        this._logWindow = logWindow;
    };

    static setStatusWindow(statusWindow) {
        this._statusWindow = statusWindow;
    };

    static setEnemyStatusWindow(enemyStatusWindow) {
        this._enemyStatusWindow = enemyStatusWindow;
    };

    static setSpriteset(spriteset) {
        this._spriteset = spriteset;
    };

    static onEncounter() {
        this._preemptive = (Math.random() < this.ratePreemptive());
        this._surprise = (Math.random() < this.rateSurprise() && !this._preemptive);
    };

    static ratePreemptive() {
        return $gameParty.ratePreemptive($gameTroop.agility());
    };

    static rateSurprise() {
        return $gameParty.rateSurprise($gameTroop.agility());
    };

    static saveBgmAndBgs() {
        this._mapBgm = AudioManager.saveBgm();
        this._mapBgs = AudioManager.saveBgs();
    };

    static playBattleBgm() {
        AudioManager.playBgm($gameSystem.battleBgm());
        AudioManager.stopBgs();
    };

    static playVictoryMe() {
        AudioManager.playMe($gameSystem.victoryMe());
    };

    static playDefeatMe() {
        AudioManager.playMe($gameSystem.defeatMe());
    };

    static replayBgmAndBgs() {
        if (this._mapBgm) {
            AudioManager.replayBgm(this._mapBgm);
        } else {
            AudioManager.stopBgm();
        }
        if (this._mapBgs) {
            AudioManager.replayBgs(this._mapBgs);
        }
    };

    static makeEscapeRatio() {
        this._escapeRatio = 0.5 * $gameParty.agility() / $gameTroop.agility();
    };

    static update() {
        if (!this.isBusy() && !this.updateEvent()) {
            switch (this._phase) {
                case 'start':
                    this.startInput();
                    break;
                case 'turn':
                    this.updateTurn();
                    break;
                case 'action':
                    this.updateAction();
                    break;
                case 'turnEnd':
                    this.updateTurnEnd();
                    break;
                case 'battleEnd':
                    this.updateBattleEnd();
                    break;
            }
        }
    };

    static updateEvent() {
        switch (this._phase) {
            case 'start':
            case 'turn':
            case 'turnEnd':
                if (this.isActionForced()) {
                    this.processForcedAction();
                    return true;
                } else {
                    return this.updateEventMain();
                }
        }
        return this.checkAbort2();
    };

    static updateEventMain() {
        $gameTroop.updateInterpreter();
        $gameParty.requestMotionRefresh();
        if ($gameTroop.isEventRunning() || this.checkBattleEnd()) {
            return true;
        }
        $gameTroop.setupBattleEvent();
        if ($gameTroop.isEventRunning() || SceneManager.isSceneChanging()) {
            return true;
        }
        return false;
    };

    static isBusy() {
        return ($gameMessage.isBusy() || this._spriteset.isBusy() ||
            this._logWindow.isBusy());
    };

    static isInputting() {
        return this._phase === 'input';
    };

    static isInTurn() {
        return this._phase === 'turn';
    };

    static isTurnEnd() {
        return this._phase === 'turnEnd';
    };

    static isAborting() {
        return this._phase === 'aborting';
    };

    static isBattleEnd() {
        return this._phase === 'battleEnd';
    };

    static isBattleScene() {
        return SceneManager._scene === Scene_Battle;
    };

    static canEscape() {
        return this._canEscape;
    };

    static canLose() {
        return this._canLose;
    };

    static isEscaped() {
        return this._escaped;
    };

    static actor() {
        return this._actorIndex >= 0 ? $gameParty.members()[this._actorIndex] : null;
    };

    static clearActor() {
        this.changeActor(-1, '');
    };

    static changeActor(newActorIndex, lastActorActionState) {
        var lastActor = this.actor();
        this._actorIndex = newActorIndex;
        var newActor = this.actor();
        if (lastActor) {
            lastActor.setActionState(lastActorActionState);
        }
        if (newActor) {
            newActor.setActionState('inputting');
        }
    };

    static startBattle() {
        this._phase = 'start';
        $gameSystem.onBattleStart();
        $gameParty.onBattleStart();
        $gameTroop.onBattleStart();
        if (!SceneManager.isPreviousScene(Scene_Menu)) {
            this.displayStartMessages();
        }
    };

    static continueBattle() {
        $gameSystem.onBattleStart();
        $gameParty.onBattleContinue();
        $gameTroop.onBattleContinue();
        if (this._phase === 'input') {
            $gameParty.makeActions();
            $gameTroop.makeActions();
        }
    };

    static displayStartMessages() {
        $gameTroop.enemyNames().forEach(function(name) {
            $gameMessage.add(TextManager.emerge.format(name));
        });
        if (this._preemptive) {
            $gameMessage.add(TextManager.preemptive.format($gameParty.name()));
        } else if (this._surprise) {
            $gameMessage.add(TextManager.surprise.format($gameParty.name()));
        }
    };

    static startInput() {
        this._phase = 'input';
        $gameParty.makeActions();
        $gameTroop.makeActions();
        this.clearActor();
        if (this._surprise || !$gameParty.canInput()) {
            this.startTurn();
        }
    };

    static inputtingAction() {
        return this.actor() ? this.actor().inputtingAction() : null;
    };

    static selectNextCommand() {
        do {
            if (!this.actor() || !this.actor().selectNextCommand()) {
                this.changeActor(this._actorIndex + 1, 'waiting');
                if (this._actorIndex >= $gameParty.size()) {
                    this.startTurn();
                    break;
                }
            }
        } while (!this.actor().canInput());
    };

    static selectPreviousCommand() {
        do {
            if (!this.actor() || !this.actor().selectPreviousCommand()) {
                this.changeActor(this._actorIndex - 1, 'undecided');
                if (this._actorIndex < 0) {
                    return;
                }
            }
        } while (!this.actor().canInput());
    };

    static refreshStatus() {
        this._statusWindow.refresh();
        this._enemyStatusWindow.refresh();
    };

    static startTurn() {
        this._phase = 'turn';
        this.clearActor();
        $gameTroop.increaseTurn();
        this.makeActionOrders();
        $gameParty.requestMotionRefresh();
        this._logWindow.startTurn();
    };

    static updateTurn() {
        $gameParty.requestMotionRefresh();
        if (!this._subject) {
            this._subject = this.getNextSubject();
        }
        if (this._subject) {
            this.processTurn();
        } else {
            this.endTurn();
        }
    };

    static processTurn() {
        var subject = this._subject;
        var action = subject.currentAction();
        if (action) {
            action.prepare();
            if (action.isValid()) {
                this.startAction();
            }
            subject.removeCurrentAction();
        } else {
            subject.onAllActionsEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(subject);
            this._logWindow.displayCurrentState(subject);
            this._logWindow.displayRegeneration(subject);
            this._subject = this.getNextSubject();
        }
    };

    static endTurn() {
        this._phase = 'turnEnd';
        this._preemptive = false;
        this._surprise = false;
        this.allBattleMembers().forEach(function(battler) {
            battler.onTurnEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(battler);
            this._logWindow.displayRegeneration(battler);
        }, this);
        if (this.isForcedTurn()) {
            this._turnForced = false;
        }
    };

    static isForcedTurn() {
        return this._turnForced;
    };

    static updateTurnEnd() {
        this.startInput();
    };

    static getNextSubject() {
        for (;;) {
            var battler = this._actionBattlers.shift();
            if (!battler) {
                return null;
            }
            if (battler.isBattleMember() && battler.isAlive()) {
                return battler;
            }
        }
    };

    static allBattleMembers() {
        return $gameParty.members().concat($gameTroop.members());
    };

    static makeActionOrders() {
        var battlers = [];
        if (!this._surprise) {
            battlers = battlers.concat($gameParty.members());
        }
        if (!this._preemptive) {
            battlers = battlers.concat($gameTroop.members());
        }
        battlers.forEach(function(battler) {
            battler.makeSpeed();
        });
        battlers.sort(function(a, b) {
            return b.speed() - a.speed();
        });
        this._actionBattlers = battlers;
    };

    static startAction() {
        var subject = this._subject;
        var action = subject.currentAction();
        var targets = action.makeTargets();
        this._phase = 'action';
        this._action = action;
        this._targets = targets;
        subject.useItem(action.item());
        this._action.applyGlobal();
        this.refreshStatus();
        this._logWindow.startAction(subject, action, targets);
    };

    static updateAction() {
        var target = this._targets.shift();
        if (target) {
            this.invokeAction(this._subject, target);
        } else {
            this.endAction();
        }
    };

    static endAction() {
        this._logWindow.endAction(this._subject);
        this._phase = 'turn';
    };

    static invokeAction(subject, target) {
        this._logWindow.push('pushBaseLine');
        if (Math.random() < this._action.itemCnt(target)) {
            this.invokeCounterAttack(subject, target);
        } else if (Math.random() < this._action.itemMrf(target)) {
            this.invokeMagicReflection(subject, target);
        } else {
            this.invokeNormalAction(subject, target);
        }
        subject.setLastTarget(target);
        this._logWindow.push('popBaseLine');
        this.refreshStatus();
    };

    static invokeNormalAction(subject, target) {
        var realTarget = this.applySubstitute(target);
        this._action.apply(realTarget);
        this._logWindow.displayActionResults(subject, realTarget);
    };

    static invokeCounterAttack(subject, target) {
        var action = new Game_Action(target);
        action.setAttack();
        action.apply(subject);
        this._logWindow.displayCounter(target);
        this._logWindow.displayActionResults(target, subject);
    };

    static invokeMagicReflection(subject, target) {
        this._action._reflectionTarget = target;
        this._logWindow.displayReflection(target);
        this._action.apply(subject);
        this._logWindow.displayActionResults(target, subject);
    };

    static applySubstitute(target) {
        if (this.checkSubstitute(target)) {
            var substitute = target.friendsUnit().substituteBattler();
            if (substitute && target !== substitute) {
                this._logWindow.displaySubstitute(substitute, target);
                return substitute;
            }
        }
        return target;
    };

    static checkSubstitute(target) {
        return target.isDying() && !this._action.isCertainHit();
    };

    static isActionForced() {
        return !!this._actionForcedBattler;
    };

    static forceAction(battler) {
        this._actionForcedBattler = battler;
        var index = this._actionBattlers.indexOf(battler);
        if (index >= 0) {
            this._actionBattlers.splice(index, 1);
        }
    };

    static processForcedAction() {
        if (this._actionForcedBattler) {
            this._turnForced = true;
            this._subject = this._actionForcedBattler;
            this._actionForcedBattler = null;
            this.startAction();
            this._subject.removeCurrentAction();
        }
    };

    static abort() {
        this._phase = 'aborting';
    };

    static checkBattleEnd() {
        if (this._phase) {
            if (this.checkAbort()) {
                return true;
            } else if ($gameParty.isAllDead()) {
                this.processDefeat();
                return true;
            } else if ($gameTroop.isAllDead()) {
                this.processVictory();
                return true;
            }
        }
        return false;
    };

    static checkAbort() {
        if ($gameParty.isEmpty() || this.isAborting()) {
            this.processAbort();
            return true;
        }
        return false;
    };

    static checkAbort2() {
        if ($gameParty.isEmpty() || this.isAborting()) {
            SoundManager.playEscape();
            this._escaped = true;
            this.processAbort();
        }
        return false;
    };

    static processVictory() {
        $gameParty.removeBattleStates();
        $gameParty.performVictory();
        this.playVictoryMe();
        this.replayBgmAndBgs();
        this.makeRewards();
        this.displayVictoryMessage();
        this.displayRewards();
        this.gainRewards();
        this.endBattle(0);
    };

    static processEscape() {
        $gameParty.performEscape();
        SoundManager.playEscape();
        var success = this._preemptive ? true : (Math.random() < this._escapeRatio);
        if (success) {
            this.displayEscapeSuccessMessage();
            this._escaped = true;
            this.processAbort();
        } else {
            this.displayEscapeFailureMessage();
            this._escapeRatio += 0.1;
            $gameParty.clearActions();
            this.startTurn();
        }
        return success;
    };

    static processAbort() {
        $gameParty.removeBattleStates();
        this.replayBgmAndBgs();
        this.endBattle(1);
    };

    static processDefeat() {
        this.displayDefeatMessage();
        this.playDefeatMe();
        if (this._canLose) {
            this.replayBgmAndBgs();
        } else {
            AudioManager.stopBgm();
        }
        this.endBattle(2);
    };

    static endBattle(result) {
        this._phase = 'battleEnd';
        if (this._eventCallback) {
            this._eventCallback(result);
        }
        if (result === 0) {
            $gameSystem.onBattleWin();
        } else if (this._escaped) {
            $gameSystem.onBattleEscape();
        }
    };

    static updateBattleEnd() {
        if (this.isBattleTest()) {
            AudioManager.stopBgm();
            SceneManager.exit();
        } else if (!this._escaped && $gameParty.isAllDead()) {
            if (this._canLose) {
                $gameParty.reviveBattleMembers();
                SceneManager.pop();
            } else {
                SceneManager.goto(Scene_Gameover);
            }
        } else {
            SceneManager.pop();
        }
        this._phase = null;
    };

    static makeRewards() {
        this._rewards = {};
        this._rewards.gold = $gameTroop.goldTotal();
        this._rewards.exp = $gameTroop.expTotal();
        this._rewards.items = $gameTroop.makeDropItems();
    };

    static displayVictoryMessage() {
        $gameMessage.add(TextManager.victory.format($gameParty.name()));
    };

    static displayDefeatMessage() {
        $gameMessage.add(TextManager.defeat.format($gameParty.name()));
    };

    static displayEscapeSuccessMessage() {
        $gameMessage.add(TextManager.escapeStart.format($gameParty.name()));
    };

    static displayEscapeFailureMessage() {
        $gameMessage.add(TextManager.escapeStart.format($gameParty.name()));
        $gameMessage.add('\\.' + TextManager.escapeFailure);
    };

    static displayRewards() {
        this.displayExp();
        this.displayGold();
        this.displayDropItems();
    };

    static displayExp() {
        var exp = this._rewards.exp;
        if (exp > 0) {
            var text = TextManager.obtainExp.format(exp, TextManager.exp);
            $gameMessage.add('\\.' + text);
        }
    };

    static displayGold() {
        var gold = this._rewards.gold;
        if (gold > 0) {
            $gameMessage.add('\\.' + TextManager.obtainGold.format(gold));
        }
    };

    static displayDropItems() {
        var items = this._rewards.items;
        if (items.length > 0) {
            $gameMessage.newPage();
            items.forEach(function(item) {
                $gameMessage.add(TextManager.obtainItem.format(item.name));
            });
        }
    };

    static gainRewards() {
        this.gainExp();
        this.gainGold();
        this.gainDropItems();
    };

    static gainExp() {
        var exp = this._rewards.exp;
        $gameParty.allMembers().forEach(function(actor) {
            actor.gainExp(exp);
        });
    };

    static gainGold() {
        $gameParty.gainGold(this._rewards.gold);
    };

    static gainDropItems() {
        var items = this._rewards.items;
        items.forEach(function(item) {
            $gameParty.gainItem(item, 1);
        });
    };
}

//-----------------------------------------------------------------------------
// PluginManager
//
// The static class that manages the plugins.

class PluginManager {
    constructor() {
        throw new Error('This is a static class');
    }

    static setup(plugins) {
        plugins.forEach(function (plugin) {
            if (plugin.status && !this._scripts.contains(plugin.name)) {
                this.setParameters(plugin.name, plugin.parameters);
                this.loadScript(plugin.name + '.js');
                this._scripts.push(plugin.name);
            }
        }, this);
    };

    static checkErrors() {
        var url = this._errorUrls.shift();
        if (url) {
            throw new Error('Failed to load: ' + url);
        }
    };

    static parameters(name) {
        return this._parameters[name.toLowerCase()] || {};
    };

    static setParameters(name, parameters) {
        this._parameters[name.toLowerCase()] = parameters;
    };

    static loadScript(name) {
        var url = this._path + name;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;
        script.onerror = this.onError.bind(this);
        script._url = url;
        document.body.appendChild(script);
    };

    static onError(e) {
        this._errorUrls.push(e.target._url);
    };
}

PluginManager._path         = 'js/plugins/';
PluginManager._scripts      = [];
PluginManager._errorUrls    = [];
PluginManager._parameters   = {};

