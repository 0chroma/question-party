var when = require("promise").when;

var ShowExceptions = exports.ShowExceptions = function(nextApp) {
    return function(request) {
        return when(nextApp(request),
            function(response) {
                return response;
            },
            function(e) {
                var backtrace = "<html><body><pre>" + e.name + ": " + e.message;
                if (e.rhinoException) {
                    //FIXME abstract and move to engines/rhino
                    backtrace += "\n" + e.rhinoException.getScriptStackTrace();
                }
                // FIXME add a branch for node: e.stack?
                backtrace += "</body></html>";
                return {
                    status: 500,
                    headers: {"content-type":"text/html", "content-length": backtrace.length + ""},
                    body: [backtrace]
                };
            }
        );
    }
}