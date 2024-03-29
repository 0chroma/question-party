
// -- kriszyp Kris Zyp

// this is based on the CommonJS spec for promises: 
// http://wiki.commonjs.org/wiki/Promises
// Includes convenience functions for promises, much of this is taken from Tyler Close's ref_send 
// and Kris Kowal's work on promises.
// // MIT License

// A typical usage:
// A default Promise constructor can be used to create a self-resolving deferred/promise:
// var Promise = require("promise").Promise;
//    var promise = new Promise();
// asyncOperation(function(){
//    Promise.resolve("succesful result");
// });
//    promise -> given to the consumer
//  
//    A consumer can use the promise
//    promise.then(function(result){
//        ... when the action is complete this is executed ...
//   },
//   function(error){
//        ... executed when the promise fails
//  });
//
// Alternately, a provider can create a deferred and resolve it when it completes an action. 
// The deferred object a promise object that provides a separation of consumer and producer to protect
// promises from being fulfilled by untrusted code.
// var defer = require("promise").defer;
//    var deferred = defer();
// asyncOperation(function(){
//    deferred.resolve("succesful result");
// });
//    deferred.promise -> given to the consumer
//  
//    Another way that a consumer can use the promise (using promise.then is also allowed)
// var when = require("promise").when;
// when(promise,function(result){
//        ... when the action is complete this is executed ...
//   },
//   function(error){
//        ... executed when the promise fails
//  });
var queue = require("event-loop");
var enqueue = queue.enqueue;
var freeze = Object.freeze || function(){};

/**
 * Default constructor that creates a self-resolving Promise. Not all promise implementations
 * need to use this constructor.
 */
var Promise = function(canceller){
};

/**
 * Promise implementations must provide a "then" function.
 */
Promise.prototype.then = function(resolvedCallback, errorCallback, progressCallback){
    throw new TypeError("The Promise base class is abstract, this function must be implemented by the Promise implementation");
};

/**
 * If an implementation of a promise supports a concurrency model that allows
 * execution to block until the promise is resolved, the wait function may be 
 * added. 
 */
/**
 * If an implementation of a promise can be cancelled, it may add this function
 */
 // Promise.prototype.cancel = function(){
 // };

Promise.prototype.get = function(propertyName){
    return this.then(function(value){
        return value[propertyName];
    });
};

Promise.prototype.put = function(propertyName, value){
    return this.then(function(object){
        return object[propertyName] = value;
    });
};

Promise.prototype.call = function(functionName /*, args */){
    return this.then(function(value){
        return value[propertyName].apply(value, Array.prototype.slice.call(arguments, 1));
    });
};

/** Dojo/NodeJS methods*/
Promise.prototype.addCallback = function(callback){
    return this.then(callback);
};

Promise.prototype.addErrback = function(errback){
    return this.then(function(){}, errback);
};

/*Dojo methods*/
Promise.prototype.addBoth = function(callback){
    return this.then(callback, callback);
};

Promise.prototype.addCallbacks = function(callback, errback){
    return this.then(callback, errback);
};

/*NodeJS method*/
Promise.prototype.wait = function(){
    return exports.wait(this);
};

Deferred.prototype = Promise.prototype;
// A deferred provides an API for creating and resolving a promise.
exports.Promise = exports.Deferred = exports.defer = defer;
function defer(){
    return new Deferred();
} 

var contextHandler = exports.contextHandler = {};

function Deferred(canceller){
    var result, finished, isError, waiting = [], handled;
    var promise = this.promise = new Promise();
    var currentContextHandler = contextHandler.getHandler && contextHandler.getHandler();
    
    function notifyAll(value){
        if(finished){
            throw new Error("This deferred has already been resolved");                
        }
        result = value;
        finished = true;
        for(var i = 0; i < waiting.length; i++){
            notify(waiting[i]);    
        }
    }
    function notify(listener){
        var func = (isError ? listener.error : listener.resolved);
        if(func){
            handled = true;
            enqueue(function(){
                if(currentContextHandler){
                    currentContextHandler.resume();
                }
                try{
                    var newResult = func(result);
                    if(newResult && typeof newResult.then === "function"){
                        newResult.then(listener.deferred.resolve, listener.deferred.reject);
                        return;
                    }
                    listener.deferred.resolve(newResult);
                }
                catch(e){
                    listener.deferred.reject(e);
                }
                finally{
                    if(currentContextHandler){
                        currentContextHandler.suspend();
                    }
                }
            });
        }
        else{
            if(isError){
                if (listener.deferred.reject(result, true)) {
                    handled = true;
                  }
            }
            else{
                listener.deferred.resolve.apply(listener.deferred, result);
            }
        }
    }
    // calling resolve will resolve the promise
    this.resolve = this.callback = this.emitSuccess = function(value){
        notifyAll(value);
    };
    
    // calling error will indicate that the promise failed
    var reject = this.reject = this.errback = this.emitError = function(error, dontThrow){
        isError = true;
        notifyAll(error);
        if (!dontThrow) {
            enqueue(function () {
                if (!handled) {
                    throw error;
                }
            });
        }
        return handled;
    };
    
    // call progress to provide updates on the progress on the completion of the promise
    this.progress = function(update){
        for(var i = 0; i < waiting.length; i++){
            var progress = waiting[i].progress;
            progress && progress(update);    
        }
    }
    // provide the implementation of the promise
    this.then = promise.then = function(resolvedCallback, errorCallback, progressCallback){
        var returnDeferred = new Deferred(promise.cancel);
        var listener = {resolved: resolvedCallback, error: errorCallback, progress: progressCallback, deferred: returnDeferred}; 
        if(finished){
            notify(listener);
        }
        else{
            waiting.push(listener);
        }
        return returnDeferred.promise;
    };
    this.setOnResume = promise.setOnResume = function(resumer){
		var result, isError, continuationDeferred = new Deferred();
		var continuationPromise = continuationDeferred.promise;  
		promise.then(function(value){
			onResume(value);
		}, function(error){
			isError = true;
			onResume(error);
		});
		
		function onResume(value){
			result = value;
        	var handleResult = function(value){
        		if(value && typeof value.setOnResume === "function"){
        			value.setOnResume(function(resumer){
        				try{
        					handleResult(resumer());
        				}catch(e){
        					continuationDeferred.reject(e);
        				}
        			});
        		}
        		else{
        			continuationDeferred.resolve(value);
        		}
        	}
        	try{
	        	handleResult(bottomFrame());
        	}catch(e){
        		continuationDeferred.reject(e);
			}
		}
	    var bottomFrameTracker = {}, bottomFrame = function(){
	    	topFrameTracker.called = true;
	    	if(isError){
	    		throw result;
	    	}
	    	return result;
	    };
	    var topFrameTracker = bottomFrameTracker;
		continuationPromise.setOnResume = function(resumer){
			var nextFrame = bottomFrame;
			var nextFrameTracker = bottomFrameTracker;
			var thisFrameTracker = bottomFrameTracker = bottomFrameTracker.next = {};
			bottomFrame = function(){
				try{
					thisFrameTracker.called = true;
					return resumer(nextFrame);
				}finally{
					if(!nextFrameTracker.called){
						throw new Error("Stack was not properly resumed");
					}
				}
			};
			return continuationPromise;
			
		} 
		return continuationPromise.setOnResume(resumer);
    }
    var timeout;
    if(typeof setTimeout !== "undefined") {
        this.timeout = function (ms) {
            if (ms === undefined) {
                return timeout;
            }
            timeout = ms;
            setTimeout(function () {
                if (!finished) {
                    if (promise.cancel) {
                        promise.cancel(new Error("timeout"));
                    }
                    else {
                        reject(new Error("timeout"));
                    }
                }
            }, ms);
            return promise;
        };
    }
    
    if(canceller){
        this.cancel = promise.cancel = function(){
            var error = canceller();
            if(!(error instanceof Error)){
                error = new Error(error);
            }
            reject(error);
        }
    }
    freeze(promise);
};

function perform(value, async, sync){
    try{
        if(value && typeof value.then === "function"){
            value = async(value);
        }
        else{
            value = sync(value);
        }
        if(value && typeof value.then === "function"){
            return value;
        }
        var deferred = new Deferred();
        deferred.resolve(value);
        return deferred.promise;
    }catch(e){
        var deferred = new Deferred();
        deferred.reject(e);
        return deferred.promise;
    }
    
}
/**
 * Promise manager to make it easier to consume promises
 */
 
/**
 * Registers an observer on a promise.
 * @param value     promise or value to observe
 * @param resolvedCallback function to be called with the resolved value
 * @param rejectCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback
 */
exports.whenPromise = function(value, resolvedCallback, rejectCallback, progressCallback){
    return perform(value, function(value){
        return value.then(resolvedCallback, rejectCallback, progressCallback);
    },
    function(value){
        return resolvedCallback(value);
    });
};
/**
 * Registers an observer on a promise.
 * @param value     promise or value to observe
 * @param resolvedCallback function to be called with the resolved value
 * @param rejectCallback  function to be called with the rejection reason
 * @param progressCallback  function to be called when progress is made
 * @return promise for the return value from the invoked callback or the value if it
 * is a non-promise value
 */
exports.when = function(value, resolvedCallback, rejectCallback, progressCallback){
    if(value && typeof value.then === "function"){
        return exports.whenPromise(value, resolvedCallback, rejectCallback, progressCallback);
    }
    return resolvedCallback(value);
};

/**
 * Gets the value of a property in a future turn.
 * @param target    promise or value for target object
 * @param property      name of property to get
 * @return promise for the property value
 */
exports.get = function(target, property){
    return perform(target, function(target){
        return target.get(property);
    },
    function(target){
        return target[property]
    });
};

/**
 * Invokes a method in a future turn.
 * @param target    promise or value for target object
 * @param methodName      name of method to invoke
 * @param args      array of invocation arguments
 * @return promise for the return value
 */
exports.post = function(target, methodName, args){
    return perform(target, function(target){
        return target.call(property, args);
    },
    function(target){
        return target[methodName].apply(target, args);
    });
};

/**
 * Sets the value of a property in a future turn.
 * @param target    promise or value for target object
 * @param property      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
exports.put = function(target, property, value){
    return perform(target, function(target){
        return target.put(property, value);
    },
    function(target){
        return target[property] = value;
    });
};


/**
 * Waits for the given promise to finish, blocking (and executing other events)
 * if necessary to wait for the promise to finish. If target is not a promise
 * it will return the target immediately. If the promise results in an reject,
 * that reject will be thrown.
 * @param target   promise or value to wait for.
 * @return the value of the promise;
 */
exports.wait = function(target){
    if(!queue){
        throw new Error("Can not wait, the event-queue module is not available");
    }
    if(target && typeof target.then === "function"){
        var isFinished, isError, result;        
        target.then(function(value){
            isFinished = true;
            result = value;
        },
        function(error){
            isFinished = true;
            isError = true;
            result = error;
        });
        while(!isFinished){
            queue.processNextEvent(true);
        }
        if(isError){
            throw result;
        }
        return result;
    }
    else{
        return target;
    }
};



/**
 * Takes an array of promises and returns a promise that is fulfilled once all
 * the promises in the array are fulfilled
 * @param array  The array of promises
 * @return the promise that is fulfilled when all the array is fulfilled, resolved to the array of results
 */
exports.all = function(array){
    var deferred = new Deferred();
    if(!(array instanceof Array)){
        array = Array.prototype.slice.call(arguments);
    }
    var fulfilled = 0, length = array.length;
    var results = [];
    array.forEach(function(promise, index){
        exports.when(promise, each, each);
        function each(value){
            results[index] = value;
            fulfilled++;
            if(fulfilled === length){
                deferred.resolve(results);
            }
        }
    });
    return deferred.promise;
};

/**
 * Takes an array of promises and returns a promise that is fulfilled when the first 
 * promise in the array of promises is fulfilled
 * @param array  The array of promises
 * @return a promise that is fulfilled with the value of the value of first promise to be fulfilled
 */
exports.first = function(array){
    var deferred = new Deferred();
    if(!(array instanceof Array)){
        array = Array.prototype.slice.call(arguments);
    }
    var fulfilled;
    array.forEach(function(promise, index){
        exports.when(promise, function(value){
            if (!fulfilled) {
                fulfilled = true;
                deferred.resolve(value);
            }  
        },
        function(error){
            if (!fulfilled) {
                fulfilled = true;
                deferred.resolve(error);
            }  
        });
    });
    return deferred.promise;
};

/**
 * Takes an array of asynchronous functions (that return promises) and 
 * executes them sequentially. Each funtion is called with the return value of the last function
 * @param array  The array of function
 * @param startingValue The value to pass to the first function
 * @return the value returned from the last function
 */
exports.seq = function(array, startingValue){
    array = array.concat(); // make a copy
    var deferred = new Deferred();
    function next(value){
        var nextAction = array.shift();
        if(nextAction){
            exports.when(nextAction(value), next, deferred.reject);
        }
        else {
            deferred.resolve(value);
        }  
    }
    next(startingValue);
    return deferred.promise;
};


/**
 * Delays for a given amount of time and then fulfills the returned promise.
 * @param milliseconds The number of milliseconds to delay
 * @return A promise that will be fulfilled after the delay
 */
if(typeof setTimeout !== "undefined") {
    exports.delay = function(milliseconds) {
        var deferred = new Deferred();
        setTimeout(function(){
            deferred.resolve();
        }, milliseconds);
        return deferred.promise;
    };
}

exports.convertNodeAsyncFunction = function(asyncFunction){
    var arity = asyncFunction.length;
    return function(){
        var deferred = new Deferred();
        arguments.length = arity;
        arguments[arity - 1] = function(error, result){
            if(error) {
                deferred.emitError(error);
            }
            else {
                if(arguments.length > 2){
                    // if there are multiple success values, we return an array
                    Array.prototype.shift.call(arguments, 1);
                    deferred.emitSuccess(arguments);
                }
                else{
                    deferred.emitSuccess(result);
                }
            }
        };
        asyncFunction.apply(this, arguments);
        return deferred.promise;
    };
};
