var file = require("file"),
    Utils = require("./utils"),
    MIME = require("./mime");

exports.File = function(root, options) {
    root = file.path(root).absolute();
    options = options || {};
    var indexes = options.indexes || [];
    if (typeof indexes === "string")
        indexes = [indexes];

    return function(request) {
        var pathInfo = Utils.unescape(request.pathInfo);

        if (pathInfo.indexOf("..") >= 0)
            return Utils.responseForStatus(403);

        var path = file.join(root, pathInfo); // don't want to append a "/" if PATH_INFO is empty
        //path = resource(path);

        try {
            if (path !== undefined && file.isFile(path) && file.isReadable(path)) {
                // efficiently serve files if the server supports "X-Sendfile"
                if (request["HTTP_X_ALLOW_SENDFILE"]) {
                    return {
                        status : 200,
                        headers : {
                            "X-Sendfile"        : path,
                            "Content-Type"      : mime.mimeType(file.extension(path), "text/plain"),
                            "Content-Length"    : "0"//String(file.size(path))
                        },
                        body : []
                    };
                } else {
                    var contents = file.read(path, { mode : "b" });
                    if (contents)
                        return serve(path, contents);
                }
            }
        } catch(e) {
            request.jsgi.errors.print("Jack.File error: " + e);
        }

        return Utils.responseForStatus(404, pathInfo);
    }
}

function serve(path, allowSendfile) {
    // TODO: once we have streams that respond to forEach, just return the stream.
    // efficiently serve files if the server supports "X-Sendfile"
    if (allowSendfile) {
        return {
            status : 200,
            headers : {
                "X-Sendfile"        : path.toString(),
                "Content-Type"   : MIME.mimeType(file.extension(path), "text/plain"),
                "Content-Length"    : "0"
            },
            body : []
        };
    } else {
        var body = path.read({ mode : "b" });
        return {
            status : 200,
            headers : {
                "Last-Modified"  : file.mtime(path).toUTCString(),
                "Content-Type"   : MIME.mimeType(file.extension(path), "text/plain"),
                "Content-Length" : body.length.toString(10)
            },
            body : [body]
        }
    }
}
