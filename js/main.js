//=============================================================================
// main.js
//=============================================================================

'use strict';

PluginManager.setup($plugins);

(function checkTest(){
    //location.protocol = 'file:';
    var href = location.href;
    var query = /\?test/;
    if (href.search(query) < 0) {
        var test = window.confirm('Initialize test?');
        var btest = window.confirm('Go to battle test?');
        if (test) {
            history.replaceState(null, '', href + '?test');
        }
        if (btest) {
            history.replaceState(null, '', href + '?test&btest');
        }
    }
})();

window.onload = function() {
    SceneManager.run(Scene_Boot);
};