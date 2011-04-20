
exports.Content = function (content, contentType) {
    return function (request) {
        return {
            status : 200,
            headers : { "content-type": contentType || "text/html" },
            body : [content]
        };
    };
};

