/**
 * A remote client store that uses JSGI to retrieve data from remote sources
 */
var JSONExt = require("commonjs-utils/json-ext");
var httpRequest = require("commonjs-utils/jsgi-client").request;
var when = require("promise").when;

exports.Remote = function(request, contextUrl){
	contextUrl = contextUrl || "";
	request = request || httpRequest;
	var entityStores = {};
	function remoteSubscribe(){
		request({
			method:"SUBSCRIBE",
			uri: options.query
		}).then(notification, notification, function(message){
			remoteSubscribe();
			notification(message);
		});
	}
	//remoteSubscribe();
	var listeners = [];
	function notification(message){
		for(var i = 0;i < listeners.length; i++){
			var listener = listeners[i];
			try{
				if(listener.query(message.target)){
					listener.callback(message);
				}
			}
			catch(e){
				onerror(e);
			}
		}
	}

	return {
		get: function(id){
			// handle nested stores with nested paths
			var store = entityStores[storeName];
			if(store){
				return store;
			}
			store = entityStores[storeName] = Remote(function(req){
				req.uri = storeName + '/' + req.uri;
				return request(req);
			});
			// fulfill the role of an id provider as well
			store.then = function(callback, errback){
				when(request({
					method:"GET",
					pathInfo: '/' + id
				}), function(response){
					try{
						callback(JSONExt.parse(response.body.join("")));
					}catch(e){
						errback(e);
					}
				}, errback);
			};
		},
		put: function(object, id){
			id = id || (object.getId ? object.getId() : object.id);
			var responsePromise= id ? 
				request({
					method: "PUT",
					pathInfo: '/' + id,
					body: JSONExt.stringify(object)
				}) :
				request({
					method: "POST",
					pathInfo: contextUrl,
					body: JSONExt.stringify(object)
				});
			return when(responsePromise, function(response){
					return JSONExt.parse(response.body.join(""))
				});
		},
		query: function(query, options){
			var headers = {};
			if(options.start || options.end){
				headers.range = "items=" + options.start + '-' + options.end; 
			}
			query = query.replace(/\$[0-9]/g, function(t){
				return JSON.stringify(options.parameters[t.substring(1) - 1]);
			});
			return when(request({
				method:"GET",
				queryString: query,
				headers: headers
			}), function(response){
				return JSONExt.parse(response.body.join(""))
			});
		},
		"delete": function(id){
			return request({
				method:"DELETE",
				pathInfo: '/' + id
			});
		},
		subscribe: function(options){
			listeners.push(options);
		},
		
	};
};
