/**
 * Cascade tries an request on several apps, and returns the first response 
 * that is not 404.
 */
var defer = require("promise").defer,
	when = require("promise").when;
var Cascade = exports.Cascade = function(apps, status) {
    status = status || 404;

    return function(request) {
        var i = 0;
        var deferred = defer(),
        	lastResponse;
        function next(){
        	if(i < apps.length){
        		when(apps[i](request), function(response){
	        		i++;
		            if (response.status !== status) {
		                deferred.resolve(response);
		            }else{
		            	lastResponse = response;
		            	next();
		            }
        		}, deferred.reject);
        	}else{
        		deferred.resolve(lastResponse);
        	}
        }
        next();
        return deferred.promise;
    }
}
