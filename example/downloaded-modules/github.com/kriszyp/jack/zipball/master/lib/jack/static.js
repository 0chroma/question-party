var File = require("./file").File;
var FILE = require("file");

var Static = exports.Static = function(app, options) {
    var options = options || {},
        urls = options["urls"] || ["/favicon.ico"],
        root = options["root"] || FILE.cwd(),
        fileServer = File(root, options);
    
    return function(request) {
        var path = request.pathInfo;

        for (var i = 0; i < urls.length; i++)
            if (path.indexOf(urls[i]) === 0) {
            	
                var result = fileServer(request);
                return result;
            }
        if(app){
            return app(request);
        }
        else{
            return {
                status: 404,
                headers: {},
                body: ["Not found"]
            }
        }
    }
}
