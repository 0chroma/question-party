var utils = require("./utils");


function squeeze(s) {
    var set = arguments.length > 0 ? "["+Array.prototype.join.call(arguments.slice(1), '')+"]" : ".|\\n",
        regex = new RegExp("("+set+")\\1+", "g");
    
    return s.replace(regex, "$1");
};

var URLMap = exports.URLMap = function(map, options) {
    var options = options || { longestMatchFirst : true },
        mapping = [];
        
    for (location in map) {
        var app = map[location],
            host = null,
            match;
        
        if (match = location.match(/^https?:\/\/(.*?)(\/.*)/))
        {
            host = match[1];
            location = match[2];
        }
            
        if (location.charAt(0) != "/")
            throw new Error("paths need to start with / (was: " + location + ")");
        
        mapping.push([host, location.replace(/\/+$/,""), app]);
    }
    // if we want to match longest matches first, then sort
    if (options.longestMatchFirst) {
        mapping = mapping.sort(function(a, b) {
            return (b[1].length - a[1].length) || ((b[0]||"").length - (a[0]||"").length);
        });
    }
    
    return function(request) {
        var path  = request.pathInfo ? squeeze(request.pathInfo, "/") : "",
            hHost = request.headers.host, sName = request.host, sPort = request.port;

        for (var i = 0; i < mapping.length; i++)
        {
            var host = mapping[i][0], location = mapping[i][1], app = mapping[i][2];

            if ((host === hHost || host === sName || (host === null && (hHost === sName || hHost === sName + ":" + sPort))) &&
                (location === path.substring(0, location.length)) &&
                (path.charAt(location.length) === "" || path.charAt(location.length) === "/"))
            {
                // FIXME: instead of modifying these, create a copy of "request"
                request.scriptName += location;
                request.pathInfo    = path.substring(location.length);

                return app(request);
            }
        }
        return exports.notFound(request);
    }
}

exports.notFound = function (request) {
    return utils.responseForStatus(404, request.pathInfo);
};
