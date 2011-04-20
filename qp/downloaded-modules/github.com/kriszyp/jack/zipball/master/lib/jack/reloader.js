var Sandbox = require("sandbox").Sandbox;

exports.Reloader = function(id, appName) {
    appName = appName || 'app';
    return function(request) {
        var sandbox = Sandbox({
            "system": system,
            modules: {
            	"event-loop": require("event-loop"),
            	"packages": require("packages")
            },
            "loader": require.loader,
            "debug": require.loader.debug
        });
        var module = sandbox(id); // not as main, key
        return module[appName](request);
    }
}
