var utils = require("./utils"),
    when = require("jack/promise").when;

// sets the content-length header on responses with fixed-length bodies
exports.ContentLength = function(app) {
    return function(request) {
        return when(app(request), function(response) {
            if (!utils.STATUS_WITH_NO_ENTITY_BODY(response.status) &&
                !response.headers["content-length"] &&
                !(response.headers["transfer-encoding"] && response.headers["transfer-encoding"] !== "identity") && 
                typeof response.body.forEach === "function")
            {
                var newBody = [],
                    length = 0;
                    
                response.body.forEach(function(chunk) {
                    var binary = chunk.toByteString();
                    length += binary.length;
                    newBody.push(binary);
                });
                
                response.body = newBody;
                response.headers["content-length"] = length + "";
            }
            return response;
        });
    }
}
