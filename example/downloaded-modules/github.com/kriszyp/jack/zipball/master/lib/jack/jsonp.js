var Request = require("./request").Request,
    when = require("promise").when;

// Wraps a response in a JavaScript callback if provided in the "callback" parameter,
// JSONP style, to enable cross-site fetching of data. Be careful where you use this.
// http://bob.pythonmac.org/archives/2005/12/05/remote-json-jsonp/
var JSONP = exports.JSONP = function(app, callbackParameter) {
    return function(request) {
        return when(app(request), function(response) {
            var req = new Request(request);
            var callback = req.params(callbackParameter || "callback");
            
            if (callback) {
                var header = (callback + "(").toByteString(),
                    footer = (")").toByteString();
                
                response.headers["content-type"] = "application/javascript";
                
                // Assume the Content-Length was correct before and simply add the length of the padding.
                if (response.headers["content-length"]) {
                    var contentLength = parseInt(response.headers["content-length"], 10);
                    contentLength += header.length + footer.length;
                    response.headers["content-length"] = contentLength + "";
                }
                
                var body = response.body;
                response.body = {
                    forEach : function(chunk) {
                        chunk(header);
                        body.forEach(chunk);
                        chunk(footer);
                    }
                }
            }
            
            return response;
        });
    }
}