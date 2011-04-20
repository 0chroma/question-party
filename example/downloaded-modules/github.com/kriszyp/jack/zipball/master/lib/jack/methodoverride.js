var Request = require("./request").Request;

/**
 * Provides Rails-style HTTP method overriding via the _method parameter or X-HTTP-METHOD-OVERRIDE header
 * http://code.google.com/apis/gdata/docs/2.0/basics.html#UpdatingEntry
 */
exports.MethodOverride = function(nextApp) {
    return function(request) {
        if ((request.method == "POST") && (!request.headers["content-type"].match(/^multipart\/form-data/))) {
            var req = new Request(request),
                method = request.headers[HTTP_METHOD_OVERRIDE_HEADER] || req.POST(METHOD_OVERRIDE_PARAM_KEY);
            if (method && HTTP_METHODS[method.toUpperCase()] === true) {
                request.env.jack.methodovverride.original_method = request.method;
                request.method = method.toUpperCase();
            }
        }
        return nextApp(request);
    }
}

var HTTP_METHODS = exports.HTTP_METHODS = {"GET":true, "HEAD":true, "PUT":true, "POST":true, "DELETE":true, "OPTIONS":true};
var METHOD_OVERRIDE_PARAM_KEY = exports.METHOD_OVERRIDE_PARAM_KEY = "_method";
var HTTP_METHOD_OVERRIDE_HEADER = exports.HTTP_METHOD_OVERRIDE_HEADER = "x-http-method-override";
