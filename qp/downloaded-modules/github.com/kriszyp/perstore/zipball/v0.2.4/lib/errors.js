({define:typeof define!="undefined"?define:function(factory){factory(require,exports);}}).
define(function(require,exports){
var ErrorConstructor = require("commonjs-utils/extend-error").ErrorConstructor;
var AccessError = exports.AccessError = ErrorConstructor("AccessError");

var MethodNotAllowedError = exports.MethodNotAllowedError = ErrorConstructor("MethodNotAllowedError", AccessError);

var DatabaseError = exports.DatabaseError = ErrorConstructor("DatabaseError");

var NotFoundError = exports.NotFoundError = ErrorConstructor("NotFoundError", DatabaseError);
NotFoundError.prototype.code = 2;

var PreconditionFailed = exports.PreconditionFailed = ErrorConstructor("PreconditionFailed", DatabaseError);
PreconditionFailed.prototype.code = 3;
});