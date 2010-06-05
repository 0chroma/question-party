var LazyArray = require("lazy-array").LazyArray;
var FullText = exports.FullText = function(store, name){
	searcher = new org.persvr.store.LuceneSearch("lucene/" + name);
	var defaultPut = store.put;
	store.put = function(object, id){
		id = defaultPut.call(store, object, id);
		searcher.remove(id);
		searcher.create(id, object);
		return id;
	};
	store.fulltext = function(query, field, options){
		var idResults = LazyArray(searcher.query(query, field, options.start || 0, options.end || 100000000, null));
		return {
			query: "?id.in(" + idResults.join(",") + ")",
			totalCount: idResults.totalCount
		};
		/*return LazyArray({
			some: function(callback){
				idResults.some(function(id){
					try{
						callback(store.get(id));
					}
					catch(e){
						print(e.message);	
					}
				});
			},
			totalCount: idResults.totalCount
		});*/
	};
	var defaultCommitTransaction = store.commitTransaction;
	store.commitTransaction = function(){
		if(defaultCommitTransaction){
			defaultCommitTransaction.call(store);
		}
		searcher.commitTransaction();
	}
	var defaultDelete = store["delete"];
	store["delete"] = function(id){
		defaultDelete.call(store, id);
		searcher.remove(id);
	};
	return store;
};

var QueryRegExp = require("../json-query").QueryRegExp;

var FullTextRegExp = exports.FullTextRegExp = QueryRegExp(/\?(.*&)?fulltext\($value\)(&.*)?/);
exports.JsonQueryToFullTextSearch = function(tableName, indexedProperties){
	return function(query, options){
		var matches;
		query = decodeURIComponent(query);
		if((matches = query.match(FullTextRegExp))){
			print(matches);
			var fulltext = eval(matches[2]);
			if(matches[1] || matches[3]){
				(matches[1] || matches[3]).replace(QueryRegExp(/&?$prop=$value&?/g), function(t, prop, value){
					fulltext += " AND " + prop + ":" + value;
				});
			}
			return fulltext;
		}
	};
};