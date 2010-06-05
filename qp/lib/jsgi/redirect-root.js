var redirector = require("jack/redirect").Redirect("/index.html");
exports.RedirectRoot = function(app){
	return function(request){
		if(request.pathInfo == "/"){
			return redirector(request);
		}
		return app(request);
	};
};
