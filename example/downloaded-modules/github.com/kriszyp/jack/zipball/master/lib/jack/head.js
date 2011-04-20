var when = require("promise").whenPreservingType;

var Head = exports.Head = function(nextApp) {
    return function(request) {
        if (request.method === "HEAD")
            request.method = "GET"; // HEAD must act the same as GET
        
        return when(nextApp(request), function(response) {
            if (request.method === "HEAD")
                response.body = [];
            return response;
        });
    }
}