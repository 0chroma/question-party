/**
 * This is the transaction manager, for handling transactions across stores and databases
 */
var promiseModule = require("promised-io/promise"),
	when = promiseModule.when,
	NotFoundError = require("./errors").NotFoundError;
	
var nextDatabaseId = 1;
	
var defaultDatabase = {
	transaction: function(){
		// these for independent stores, and the main transaction handler calls the commit and abort for us
		//TODO: Should this functionality be switched the main transaction handler?
		return {
			commit: function(){},
			abort: function(){},
			resume: function(){},
			suspend: function(){}
		};
	},
	id:0
};
exports.registerDatabase = function(database){
	var previousDatabase = defaultDatabase;
	while(previousDatabase.nextDatabase){
		previousDatabase = previousDatabase.nextDatabase
	}
	previousDatabase.nextDatabase = database;
	database.id = nextDatabaseId++; 
};

var transactions = {};


exports.transaction = function(calllback){
	var context = promiseModule.currentContext;
	if(!context){
		context = promiseModule.currentContext = {};
	}
	context.suspend = function(){
		try{
			for(var i in transactions){
				if(transactions[i].suspend){
					transactions[i].suspend();
				}
			}
			for(var i in usedStores){
				if(usedStores[i].suspend){
					usedStores[i].suspend();
				}
			}
		}
		finally{
			exports.currentTransaction = null;
		}
	};
	context.resume = function(){
		exports.currentTransaction = transaction; 
		for(var i in transactions){
			if(transactions[i].resume){
				transactions[i].resume();
			}
		}
		for(var i in usedStores){
			if(usedStores[i].resume){
				usedStores[i].resume();
			}
		}
	};

	var throwing = true, committing;
	function done(){
		delete context.resume;
		delete context.suspend;
	}
	
	var database = defaultDatabase;
	do{
		transactions[database.id] = database.transaction();
	}while(database = database.nextDatabase);
	var transaction, usedStores = [];
	try{
		var result = calllback(transaction = exports.currentTransaction = {
			usedStores: usedStores,
			commit: function(){
				try{
					for(var i in transactions){
						if(transactions[i].prepareCommit){
							transactions[i].prepareCommit();
						}
					}
					for(var i in usedStores){
						if(usedStores[i].prepareCommit){
							transactions[i].prepareCommit();
						}
					}
					for(var i in transactions){
						transactions[i].commit();
					}
					for(var i in usedStores){
						if(usedStores[i].commit){
							usedStores[i].commit();
						}
					}
					var success = true;
					exports.currentTransaction = null;
				}finally{
					if(!success){
						this.abort();
					}
				}				
			},
			abort: function(){
				try{
					for(var i in transactions){
						transactions[i].abort();
					}
					for(var i in usedStores){
						if(usedStores[i].abort){
							usedStores[i].abort();
						}
					}
				}
				finally{
					exports.currentTransaction = null;
				}
			},
		});
		throwing = false;
		return when(result, function(result){
			committing = true;
			done();
			transaction.commit();
			exports.currentTransaction = null;
			return result;
		}, function(e){
			committing = true;
			done();
			transaction.abort();
			exports.currentTransaction = null;
			return result;
		});
	}
	finally{
		if(throwing){
			done();
			transaction.abort();
			exports.currentTransaction = null;
		}
		else{
			if(!committing){
				context.suspend();
				exports.currentTransaction = null;
			}
		}
	}
	
};
var nextStoreId = 0;

exports.AutoTransaction = function(store, database){
	database = database || defaultDatabase;
	for(var i in store){
		if(typeof store[i] === "function" && i != "transaction" && i != "setSchema"){
			(function(i, defaultMethod){
				store[i] = function(){
					if(!exports.currentTransaction){
						var args = arguments;
						return exports.transaction(function(){
							return startAndCall(args);
						});
					}
					return startAndCall(arguments);
				};
				function startAndCall(args){
					if(!store.id){
						store.id = "__auto__" + (nextStoreId++);
					}
					if(!exports.currentTransaction.usedStores[store.id] && store.transaction){
						exports.currentTransaction.usedStores[store.id] = store.transaction();
					}
					return defaultMethod.apply(store, args);
				}
			})(i, store[i]);
		}
	}
	var transactionQueue;
	var prototype = {
		transaction: function(){
			var queue = transactionQueue = [];
			return {
				commit: function() {
					store.commitTransactionQueue(queue);
					queue.length = 0;
				},
				abort: function() {
					queue.length = 0;
				},
				suspend: function(){
					transactionQueue = null;
				},
				resume: function(){
					transactionQueue = queue;
				}
			};
		},
		addToTransactionQueue: function(action){
			transactionQueue.push(action);
		},
		commitTransactionQueue: function(queue){
			queue.forEach(function(action){
				action();
			});
		}
	};
	for(var i in prototype){
		if(!(i in store)){
			store[i] = prototype[i];
		}
	}
	return store;
}
