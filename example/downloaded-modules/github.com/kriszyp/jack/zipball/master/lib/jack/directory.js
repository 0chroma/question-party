var util = require("util");

exports.Directory = function (paths, notFound) {
    if (!paths)
        paths = {};
    if (!notFound)
        notFound = exports.notFound;
    return function (request) {
        if (!/^\//.test(request.pathInfo)) {
            var location = 
                (request.scheme || 'http') +
                '://' + 
                (request.headers.host || (
                    request.host +
                    (request.port == "80" ? "" : ":" + request.port)
                )) +
                (request.scriptName || '') +
                request.pathInfo + "/";
            return {
                status : 301,
                headers : {
                    "location": location,
                    "content-type": "text/plain"
                },
                body : ['Permanent Redirect: ' + location]
            };
        }
        var path = request.pathInfo.substring(1);
        var parts = path.split("/");
        var part = parts.shift();
        if (util.has(paths, part)) {
            request.scriptName = request.scriptName + "/" + part;
            request.pathInfo = path.substring(part.length);
            return paths[part](request);
        }
        return notFound(request);
    };
};

exports.notFound = function (request) {
    return utils.responseForStatus(404, request.pathInfo);
};

if (require.main == module.id) {
    var jack = require("jack");
    var app = exports.Directory({
        "a": exports.Directory({
            "": function () {
                return {
                    status : 200,
                    headers : {"content-type": "text/plain"},
                    body : ["Hello, World!"]
                };
            }
        })
    });
    exports.app = jack.ContentLength(app);
    require("jackup").main(["jackup", module.path]);
}

