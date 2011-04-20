var STATUS_WITH_NO_ENTITY_BODY = require("jack/utils").STATUS_WITH_NO_ENTITY_BODY,
    MIME_TYPES = require("jack/mime").MIME_TYPES,
    DEFAULT_TYPE = "text/plain",
    when = require("promise").when;

/**
* This middleware makes sure that the Content-Type header is set for responses
* that require it.
*/
exports.ContentType = function(app, options) {
    options = options || {};
    options.MIME_TYPES = options.MIME_TYPES || {};
    
    return function(request) {
        return when(app(request), function(response) {
            if (!STATUS_WITH_NO_ENTITY_BODY(response.status) && response.headers["content-type"]) {
                var contentType = options.contentType;
                if (!contentType) {
                    var extension = request.pathInfo.match(/(\.[^.]+|)$/)[0];
                    contentType = options.MIME_TYPES[extension] || MIME_TYPES[extension] || DEFAULT_TYPE;
                }
                response.headers["content-type"] = contentType;
            }
            return response;
        });
    }
}
