//=============================================================================
// main.js
//=============================================================================

'use strict';

(function checkTest(){
    var href = location.href;
    var query = /\?test/;
    if (href.search(query) === -1) {
        var test = window.confirm('Initialize test?');
        if (test) {
            history.replaceState(null, '', href + '?test');
        }
    }
})();

PluginManager.setup($plugins);

window.onload = function() {
    SceneManager.run(Scene_Boot);
};