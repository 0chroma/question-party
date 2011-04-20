// Creates a pool of workers and delegates requests to workers as they become idle

var Worker = require("worker").Worker,
    HTTP_STATUS_CODES = require("../utils").HTTP_STATUS_CODES,
    spawn = require("worker-engine").spawn,
    requestQueue;
exports.enqueue = function(request, response){
    // just puts them in the queue
    return requestQueue.offer([request, response]);

}

exports.createQueue = function(options){
    var workerPoolSize = options.workerPoolSize || 5;
    var requestQueueCapacity = options.requestQueueCapacity || 20;
    // our request queue for delegating requests to workers
    requestQueue = new java.util.concurrent.LinkedBlockingQueue(requestQueueCapacity);
};
exports.createWorkers = function(workerModule, options) {
    var maxWorkerPoolSize = options.maxWorkerPoolSize || 5;
    options.server = workerModule;
    // create all are workers for servicing requests
    var workers = [];
    var workerIds = [];
    function addWorker(){
        var i = workers.length;
        var newWorker = new Worker("jack/handler/" + workerModule, workerIds[i] = "Jack worker " + i);
        var optionsCopy = {};
        for(var key in options){
        	optionsCopy[key] = options[key];
        }
        if(i == 0){
        	optionsCopy.firstWorker = true;
        }
        newWorker.__enqueue__("onstart", [optionsCopy]);
        workers.forEach(function(worker){
/*            	worker.postMessage({
            		method:"subscribe",
            		body:{
            			target: "worker://" + newWorker.name
            		}
            	});
            	newWorker.postMessage({
            		method:"subscribe",
            		body:{
            			target: "worker://" + worker.name
            		}
            	});*/
            var connectionA = {
        		send: function(message){
        			newWorker.__enqueue__("onsiblingmessage", [message, connectionB]);
        		}
        	};
            var connectionB = {
        		send: function(message){
        			worker.__enqueue__("onsiblingmessage", [message, connectionA]);
        		}
        	};
        	worker.__enqueue__("onnewworker", [connectionA]);
        	newWorker.__enqueue__("onnewworker", [connectionB]);
        });
        workers[i] = newWorker;
    }
    addWorker(); // create at least one to start with
    
    // our event queue
    var eventQueue = require("event-loop");
    
/*	onmessage = function(e){
		if(typeof e.data == "object"){
			if(e.data.method === "get" && e.data.pathInfo === "/workers"){
				workerListeners.push(newWorkers);
				newWorkers(workerIds);
				function newWorkers(workerIds){
					e.port.postMessage({
	            		source: "/workers",
						body:workerIds
					});
				}
			}
		}
	};*/
    requestProcess:
    while(true){
        var requestResponse = requestQueue.take(); // get the next request
        while(true){
            for(var i = 0; i < workers.length; i++){
                var worker = workers[i];
                if(worker && !worker.hasPendingEvents()){
                    worker.__enqueue__("onrequest", requestResponse);
                    continue requestProcess;
                }
            }
            // no available workers, 
            // create another worker if we are under our limit
            if(workers.length < maxWorkerPoolSize){
                addWorker();
            }
            // block for events (only waiting for onidle events)
            eventQueue.processNextEvent(true);
        }
    }

}

