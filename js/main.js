//=============================================================================
// main.js
//=============================================================================

'use strict';

(function checkTest(){
    let href = location.href;
    let query = /\?test/;
    if (href.search(query) === -1) {
        let test = window.confirm('Initialize test?');
        let btest = window.confirm('Go to battle test?');
        if (test) {
            history.replaceState(null, '', href + '?test');
        }
        if (btest) {
            history.replaceState(null, '', href + '?test&btest');
        }
    }
})();

PluginManager.setup($plugins);

window.onload = function() {
    SceneManager.run(Scene_Boot);
};