var fs = require("fs-promise"),
	defer = require("promise").defer,
	Buffer = require('buffer').Buffer,
	mime = require("jack/mime");
exports.Static = function(options){
	var options = options || {},
		urls = options["urls"] || ["/favicon.ico"],
		roots = options["roots"] || [""];

	return function(request) {
		var path = request.pathInfo;
		for (var i = 0; i < urls.length; i++) {
			if (path.indexOf(urls[i]) === 0) {
				var rootIndex = 0;
				var responseDeferred = defer();
				checkNextRoot();
				return responseDeferred.promise;
			}
		}
		return {
			status: 404,
			headers: {},
			body: [path + " not found"]
		};
		function checkNextRoot(){
			if(rootIndex >= roots.length){
				responseDeferred.resolve({
					status: 404,
					headers: {},
					body: [path + " not found"]
				});
				return;
			}
			var file = roots[rootIndex] + path;
			rootIndex++;
			fs.stat(file)
				.then(function (stat) {
					if(stat.isFile()){
						// file exists.
						fs.open(file, process.O_RDONLY, 0666)
							.then(function (file) {
								var extension = path.match(/\.[^\.]+$/);
								extension = extension && extension[0];
								var bodyDeferred = defer();
								var write;
								file.encoding = "binary";
							    responseDeferred.resolve({
							    	status: 200,
							    	headers: {
							    		"content-length": stat.size,
										"content-type": extension && mime.mimeType(extension)
							    	},
							    	body: file
							    });
							}, checkNextRoot);
					}
					else{
						checkNextRoot();
					}

			}, checkNextRoot);
		}
	};
};
