//=============================================================================
// main.js
//=============================================================================

PluginManager.setup($plugins);

window.onload = function() {
    const normalHref = location.href;
    history.replaceState(null, '', normalHref+ '?test');
    SceneManager.run(Scene_Boot);
};