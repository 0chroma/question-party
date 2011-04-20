var utils = require("./utils"),
    Hash = require("hash").Hash;

var Request = exports.Request = function(request) {
    request.jack = request.jack || {};
    if (request.jack.request)
        return request.jack.request;
    this.raw = request;
    this.raw.jack.request = this;
}

// TODO add Request.prototype.input as a backward compatible synonym for body

Object.defineProperty(Request.prototype, "scheme", {configurable: true, enumerable: true,
    get: function() { return this.raw.scheme; }
});
Object.defineProperty(Request.prototype, "scriptName", {configurable: true, enumerable: true,
    get: function() { return this.raw.scriptName; }
});
Object.defineProperty(Request.prototype, "pathInfo", {configurable: true, enumerable: true,
    get: function() { return this.raw.pathInfo; }
});
Object.defineProperty(Request.prototype, "host", {configurable: true, enumerable: true,
    get: function() {
        // remove port number
        return (this.raw.headers.host || this.host).replace(/:\d+\z/g, "");
    }
});
Object.defineProperty(Request.prototype, "port", {configurable: true, enumerable: true,
    get: function() { return this.raw.port; }
});
Object.defineProperty(Request.prototype, "method", {configurable: true, enumerable: true,
    get: function() { return this.raw.method; }
});
Object.defineProperty(Request.prototype, "queryString", {configurable: true, enumerable: true,
    get: function() { return this.raw.queryString; }
});
Object.defineProperty(Request.prototype, "referer", {configurable: true, enumerable: true,
    get: function() { return this.raw.referer; }
});
Object.defineProperty(Request.prototype, "referrer", {configurable: true, enumerable: true,
    get: function() { return this.raw.referer; }
});
Object.defineProperty(Request.prototype, "contentLength", {configurable: true, enumerable: true,
    get: function() { return parseInt(this.raw.headers["content-length"], 10); }
});
Object.defineProperty(Request.prototype, "contentType", {configurable: true, enumerable: true,
    get: function() { return this.raw.headers["content-type"] || null; }
});


Object.defineProperty(Request.prototype, "isGet", {configurable: true, enumerable: true,
    get: function() { return this.method === "GET"; }
});
Object.defineProperty(Request.prototype, "isPost", {configurable: true, enumerable: true,
    get: function() { return this.method === "POST"; }
});
Object.defineProperty(Request.prototype, "isPut", {configurable: true, enumerable: true,
    get: function() { return this.method === "PUT"; }
});
Object.defineProperty(Request.prototype, "isDelete", {configurable: true, enumerable: true,
    get: function() { return this.method === "DELETE"; }
});
Object.defineProperty(Request.prototype, "isHead", {configurable: true, enumerable: true,
    get: function() { return this.method === "HEAD"; }
});

// The set of form-data media-types. Requests that do not indicate
// one of the media types presents in this list will not be eligible
// for form-data / param parsing.
var FORM_DATA_MEDIA_TYPES = [
    null,
    'application/x-www-form-urlencoded',
    'multipart/form-data'
]

// Determine whether the request body contains form-data by checking
// the request media_type against registered form-data media-types:
// "application/x-www-form-urlencoded" and "multipart/form-data". The
// list of form-data media types can be modified through the
// +FORM_DATA_MEDIA_TYPES+ array.
Object.defineProperty(Request.prototype, "hasFormData", {configurable: true, enumerable: true,
    get: function() {
        mediaType = this.mediaType;
        return FORM_DATA_MEDIA_TYPES.reduce(function(x, type) { return x || type == mediaType; }, false);
    }
});

// The media type (type/subtype) portion of the content-type header
// without any media type parameters. e.g., when content-type is
// "text/plain;charset=utf-8", the media-type is "text/plain".
//
// For more information on the use of media types in HTTP, see:
// http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.7
Object.defineProperty(Request.prototype, "mediaType", {configurable: true, enumerable: true,
    get: function() {
        return (this.contentType && this.contentType.split(/\s*[;,]\s*/, 2)[0].toLowerCase()) || null;
    }
});

// The media type parameters provided in CONTENT_TYPE as a Hash, or
// an empty Hash if no CONTENT_TYPE or media-type parameters were
// provided.  e.g., when the CONTENT_TYPE is "text/plain;charset=utf-8",
// this method responds with the following Hash:
//   { 'charset' => 'utf-8' }
Object.defineProperty(Request.prototype, "mediaTypeParams", {configurable: true, enumerable: true,
    get: function() {
        if (!this.contentType) return {};
        return this.contentType.split(/\s*[;,]\s*/).slice(1).map(function (s) {
                return s.split('=', 2);
        }).reduce(function (hash, pair) {
            hash[pair[0].toLowerCase()] = pair[1];
            return hash;
        }, {});
    }
});

// The character set of the request body if a "charset" media type
// parameter was given, or nil if no "charset" was specified. Note
// that, per RFC2616, text/* media types that specify no explicit
// charset are to be considered ISO-8859-1.
Object.defineProperty(Request.prototype, "contentCharset", {configurable: true, enumerable: true,
    get: function() {
        return this.mediaTypeParams['charset'] || null;
    }
});

// Returns the data recieved in the query string.
Request.prototype.GET = function() {
    // cache the parsed query:
    if (this.raw.jack.request.query_string !== this.queryString) {
        this.raw.jack.request.query_string = this.queryString;
        this.raw.jack.request.query_hash = utils.parseQuery(this.queryString);
    }
    print(this.raw.jack.request.query_string)
    if (arguments.length > 0)
        return this.raw.jack.request.query_hash[arguments[0]];
        
    return this.raw.jack.request.query_hash;
}

// Returns the data recieved in the request body.
//
// This method support both application/x-www-form-urlencoded and
// multipart/form-data.
Request.prototype.POST = function(options) {
    var hash = {};
    if (this.env["jack.request.form_input"] === this.env.body)
        hash = this.env["jack.request.form_hash"];
    else if (this.hasFormData()) {
        this.env["jack.request.form_input"] = this.env["jsgi.input"];
        this.env["jack.request.form_hash"] = utils.parseMultipart(this.env, options);
        if (!this.env["jack.request.form_hash"]) {
            this.env["jack.request.form_vars"] = this.body().decodeToString(this.contentCharset() || "utf-8");
            this.env["jack.request.form_hash"] = utils.parseQuery(this.env["jack.request.form_vars"]);
            //this.env.body.rewind();
        }
        hash = this.env["jack.request.form_hash"];
    }
    
    if (arguments.length > 0)
        return hash[arguments[0]];
    
    return hash;
}

Object.defineProperty(Request.prototype, "isFormEncoded", {configurable: true, enumerable: true,
    get: function() {
        var isAppFormEncoded = /^application\/x-www-form-urlencoded/;
        var isMultipartFormEncoded = /^multipart\/form-data.*boundary=\"?([^\";,]+)\"?/m;
        return isMultipartFormEncoded.test(this.contentType) || isAppFormEncoded.test(this.contentType);
    }
});



Request.prototype.params = function() {
    if (!this.raw.jack.request.params_hash)
        this.raw.jack.request.params_hash = Hash.merge(this.GET(), this.POST());

    if (arguments.length > 0)
        return this.raw.jack.request.params_hash[arguments[0]];
            
    return this.raw.jack.request.params_hash;
}

Object.defineProperty(Request.prototype, "cookies", {configurable: true, enumerable: true,
    get: function() {
        var cookie = this.raw.headers.cookie;
        if (!cookie) return {};
        if (this.raw.jack.request.cookie_string != cookie)  {
            this.env["jack.request.cookie_string"] = cookie;
            // According to RFC 2109:
            // If multiple cookies satisfy the criteria above, they are ordered in
            // the Cookie header such that those with more specific Path attributes
            // precede those with less specific. Ordering with respect to other
            // attributes (e.g., Domain) is unspecified.
            var hash = this.raw.jack.request.cookie_hash = utils.parseQuery(cookie, /[;,]/g);
            for (var k in hash)
                if (Array.isArray(hash[k]))
                    hash[k] = hash[k][0];
        }
    
        return this.raw.jack.request.cookie_hash;
    }
});

/**
 * Get the cookie named 'key'. The dual method of Response.setCookie().
 */
Request.prototype.getCookie = function (key) {
    return this.cookies()[key];
}

Object.defineProperty(Request.prototype, "relativeURI", {configurable: true, enumerable: true,
    get: function() {
        var qs = this.queryString;
        if (qs) {
            return this.pathInfo + "?" + qs;
        } else {
            return this.pathInfo;
        }
    }
});

Object.defineProperty(Request.prototype, "uri", {configurable: true, enumerable: true,
    get: function() {
        var scheme = this.scheme(),
            port = this.port(),
            uri = scheme + "://" + this.host;
        if ((scheme == "https" && port != 443) || (scheme == "http" && port != 80)) {
            uri = uri + port;
        }
        return uri + this.relativeURI;
    }
});

var XHR_RE = new RegExp("XMLHttpRequest", "i");

// http://www.dev411.com/blog/2006/06/30/should-there-be-a-xmlhttprequest-user-agent
Object.defineProperty(Request.prototype, "isXMLHTTPRequest", {configurable: true, enumerable: true,
    get: function() {
        return XHR_RE.test(this.raw.headers["x-requested-with"]);
    }
});

/**
 * Returns an array of [encoding, quality] pairs.
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
 */
Request.prototype.acceptEncoding = function() {
    return this.env["HTTP_ACCEPT_ENCODING"].toString().split(/,\s*/).map(function(part) {
        var m = part.match(/^([^\s,]+?)(?:;\s*q=(\d+(?:\.\d+)?))?$/)     
        if (!m) throw("Invalid value for Accept-Encoding: " + part);
        return [m[1], Number(m[2] || 1.0)];
    });
}

/**
 * The remote ip address.
 */
var remoteIp = function() {
    var addr = this.raw.headers["x-forwarded-for"];
    if (addr) {
        var parts = addr.split(",");
        return parts[parts.length-1].trim();
    } else {
        return this.remoteAddr;
    }
}

Object.defineProperty(Request.prototype, "ip", {configurable: true, enumerable: true,
    get: remoteIp
});

Object.defineProperty(Request.prototype, "remoteAddr", {configurable: true, enumerable: true,
    get: remoteIp
});