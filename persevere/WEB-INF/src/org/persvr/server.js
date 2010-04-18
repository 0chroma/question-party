(function(){
	// setup primitive classes to be JSON Schema types
	String.type = "string";
	Boolean.type = "boolean";
	Number.type = "number";
	Integer = {type:"integer"};
	Object.type = "object";
	Array.type = "array";
	Date.type = "string";
	Date.format = "date-time";
	
	org; // initialize the package system

	// make this point correctly
	Array.prototype.constructor = Array;
	Object.prototype.constructor = Object;

	//security:
	var permissions = {
		none: 0,
		limited: 1,
		read: 2,
		execute: 3,
		append: 4,
		write: 5,
		full: 6
	}
	hasAccessLevel = function(resource, permission){
		return getAccessLevel(resource) >= permissions[permission];
	};
	hasPermission  = function(permission){
		// for all named permissions, check to see if the user has full access to the system
		return hasAccessLevel(Class, "full");
	};
	getUserName = function(){
		var user = getCurrentUser();
		// best attempt at the current user name
		return (user && user.name) || (typeof user == 'string' ? user : null);
	}
	pjs.getUserName = function(){
		return getUserName();
	}
	
	AccessError = function(){
		var error = Error.apply(this, arguments);
		error.name = "AccessError";
		return error;
	};
	AccessError.prototype = new Error;
	
	//Comet:
	onConnect = function(){
		// TODO: Change the current user's object's online status
	};
	onDisconnect = function(){
		// TODO: Change the current user's object's online status
	};

	// some nice to haves from the browser env
	alert = print = console.log;
	window = {
		navigator: {appVersion: version, userAgent: version}
	};
	// used by securable modules and the ServerJS unit tests
	environment = {
		window: window,
		print: console.log
	};

	system = {
		os: ""
	};

	
	Thread.sleep = java.lang.Thread.sleep;
	
	// ES3.1 JSON object using Persevere's {de}serialization capabilities
	JSON = {
		stringify: function(jsonValue){
			return serialize(jsonValue, "application/json");
		},
		parse: function(jsonString){
			return deserialize(jsonString);
		}
	};
	// setup an assert function
	assert = function(cond, message){
		if(!cond){
			throw new Error("assert failed" + (message ? ": " + message : ""));
		}
	};
	assertEqual = function(actual, expected, message ){
		if(expected !== actual){
			throw new Error("assert equals failed, expected: " + expected + " and got: " + actual + (message ? ": " + message : ""));
		}
	};
	assertNotEqual = function(actual, unwanted, message ){
		if(unwanted == actual){
			throw new Error("assert not equals failed, unwanted: " + unwanted + (message ? ": " + message : "") );
		}
	};
	assertException = function(trythis, message){
    try {
      trythis();
    } catch ( e )  {
      return
    } 
    throw new Error("assert exception function failed to fail" + (message ? ": " + message : ""));
	};
	
	Query = function(){
		throw new TypeError("Can not directly instantiate a Query");
	};
	Query.prototype = [];
	
	QueryString = function(string, params){
		this.string = string;
		this.params = params;
	};
	QueryString.prototype = new String("");
	// its easier to write (and read) these as regular expressions (since that is how they are used)
	var $prop = /(?:@?\.?([a-zA-Z_$][\w_$]*))/.source;
	var $value = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/[\w_$]+\/[\w]+|\-?[0-9]+(?:\.[0-9]+)?(?:[eE]\-?[0-9]+)|true(?![\w])|false(?![\w])|null(?![\w]))/.source;
	var $comparator = /(===|!==|==|!=|>=|<=|=|<|>)/.source;
	var $operator = /([\+\-\*\/\&\|\?\:])/.source;
	var $logic = /([\&\|])/.source;
	var $expression = /((?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\[(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\]])*\]|[^\]])*)/.source;
	var $filter = "(?:\\[?\\?" + $expression + "\\]?)";
	var $sort = "(?:\\[[\\\\\\/]" + $expression + "\\])";
	function convertRegex(regexp){
		return new RegExp((regexp.source || regexp).replace(/\$[a-z]+/g, function(t){
			switch(t){
				case "$prop" : return $prop; 
				case "$value" : return $value; 
				case "$comparator" : return $comparator; 
				case "$operator" : return $operator; 
				case "$logic" : return $logic;
				case "$expression" : return $expression;
				case "$filter" : return $filter;
				case "$sort" : return $sort;
			}
			return t;
		}), (regexp.global ? "g" : "") + (regexp.ignoreCase ? "m" : ""));
	}
	for each (let i in ["charAt", "toString", "valueOf"]){
		QueryString.prototype[i] = function(){
			return String.prototype[i].apply(this.string, arguments);
		} 
	}
	QueryString.prototype.match = function(regexp){
		var matches = String.prototype.match.call(this.string, convertRegex(regexp));
		for each(let i in matches){
			matches[i] = new QueryString(i);
		}
		return matches;
	};
	QueryString.prototype.replace = function(regexp, newStr){
		if(typeof newStr == 'function'){
			var func = newStr;
			newStr = function(){
				for(var i = 0; i < arguments.length; i++){
					arguments[i] = new QueryString(arguments[i]);
				}
				return func.apply(this, arguments);
			}
		}
		return new QueryString(String.prototype.replace.call(this.string, convertRegex(regexp), newStr));
	};
	QueryString.prototype.execute = function(target){
		return jsonQuery(this, this.params)(target);
	}
	onRemoteRequest = function(xhr, method, url){
		// console.log("onRemoteRequest ", url);
	};
	
	var clientId = Math.random() + "";
	//var hostSeqId = {};
	// remote request handling
	remoteRequest = function(method, url, body, start, end){
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, false);
		xhr.setRequestHeader("Accept", "application/javascript;q=1,application/json;q=0.8");
		xhr.setRequestHeader("Client-Id", clientId);
		//var host = url.match(/^\w+:\/\/[^\/]+/)[0];
		//var seqId = hostSeqId[host] = (hostSeqId[host] || 0) + 1; 
		//xhr.setRequestHeader("Seq-Id", seqId);
		xhr.setRequestHeader("Server-Methods", "false");
		if(start || end){
			xhr.setRequestHeader("Range", "items=" + start + "-" + end);
		}
		onRemoteRequest(xhr, method, url);
		xhr.send(body);
		return xhr;
	};
	function throwMaxIterations(){
		throw new AccessError("Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
	}
	
	// persevere edit
	var tempQuery = function(/*String*/query, args){// persevere edit
		// summary:
		// 		Performs a JSONQuery on the provided object and returns the results. 
		// 		If no object is provided (just a query), it returns a function that evaluates objects
		// 		according to the provided query.
		// query:
		// 		Query string
		// 	obj:
		// 		Target of the JSONQuery
		// 	description:
		// 	|	dojox.json.query("foo",{foo:"bar"}) - > "bar"
		// |	evaluator = dojox.json.query("?foo='bar'&rating>3");
		query = query.toString();
		var iterations = 0;
		var maxIterations = org.persvr.data.PersistableArray.maxIterations;
		// setup JSONQuery library
		function slice(obj,start,end,step){
			var i, results = [];
			if(step < 5){
				// do an iterator friendly
				i = 0;
				for each(var item in obj){
					if(i >= end){
						return results;
					}
					if(i >= start && i % step == 0){
						results.push(item);
					}
					i++;
					if(i > maxIterations){
						throwMaxIterations();
					}
				}
				return results;
			}
			var len=obj.length;
			end = end || len;
			
			start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
			end = (end < 0) ? Math.max(0,end+len) : Math.min(len,end);
			iterations += end - start;
			if(iterations > maxIterations){
				throwMaxIterations();
			}
		  	for(i=start; i<end; i+=step){
		  		results.push(obj[i]);
		  	}
			return results;
		}
		function expand(obj,name){
			// name can be a property to search for, undefined for full recursive, or an array for picking by index
			var results = [];
			function walk(obj){
				if(name){
					if(name===true && !(obj instanceof Array)){
						//recursive object search
						results.push(obj);
					}else if(obj[name]){
						// found the name, add to our results
						results.push(obj[name]);
					}
				}
				for each(var val in obj){
					if(iterations++ > maxIterations){
						throwMaxIterations();
					}
					if(!name){
						// if we don't have a name we are just getting all the properties values (.* or [*])
						results.push(val);
					}else if(val && typeof val == 'object'){
						walk(val);
					}
				}
			}
			if(name instanceof Array){
				// this is called when multiple items are in the brackets: [3,4,5]
				if(name.length==1){
					// this can happen as a result of the parser becoming confused about commas 
					// in the brackets like [@.func(4,2)]. Fixing the parser would require recursive 
					// analsys, very expensive, but this fixes the problem nicely. 
					return obj[name[0]];
				}
				for(var i = 0; i < name.length; i++){
					if(iterations++ > maxIterations){
						throwMaxIterations();
					}
					results.push(obj[name[i]]);
				}
			}else{
				// otherwise we expanding
				walk(obj);
			}
			return results;
		}
			
		var _this = this; // persevere edit
		// persevere edit
		function filter(array,func){
			if(array.filter){
				return array.filter(func)
			}
			throw new Error("Can only filter on arrays, not objects");
		}
		// TODO: need some way to mark this as a date-string for comparison at the DB level
		function date(dateValue){
			return (arguments.length ? new Date(dateValue) : new Date()).getTime();
		}
		function map(array,func){
			return array.map(func);
		}
		var depth = 0;	
		var str = [];
		var __ids__={};
		var idNum = 0;
		query = query.replace(/\/([\w_$]+\/[\w]+)/,function(t,a){
				// TODO: load the object first and then store it so it doesn't need to be loaded on each iteration
				// handle object id literals
				if(pjs.absolutePathPrefix && ('/' + a).substring(pjs.absolutePathPrefix)){
					a = a.substring(pjs.absolutePathPrefix.length - 1);
				}
				__ids__['a' + idNum] = load(a);
				return "('" + a + "'&&__ids__.a" + (idNum++) + ')'; 
			}).
			replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|[\[\]]/g,function(t){
			depth += t == '[' ? 1 : t == ']' ? -1 : 0; // keep track of bracket depth
			return (t == ']' && depth > 0) ? '`]' : // we mark all the inner brackets as skippable
					(t.charAt(0) == '"' || t.charAt(0) == "'") ? "`" + (str.push(t) - 1) :// and replace all the strings
						t;     
		});
		var prefix = '';
		function call(name){
			// creates a function call and puts the expression so far in a parameter for a call 
			prefix = name + "(" + prefix;
		}
		function makeRegex(t,a,b,c,d,e,f,g){
			// creates a regular expression matcher for when wildcards and ignore case is used 
			return str[g].match(/[\*\?]/) || f == '~' ?
					"/^" + str[g].substring(1,str[g].length-1).replace(/\\([btnfr\\"'])|([^\w\*\?])/g,"\\$1$2").replace(/([\*\?])/g,".$1") + (f == '~' ? '$/i' : '$/') + ".test(" + a + ")" :
					t;
		}
		query.replace(/(\]|\)|push|pop|shift|splice|sort|reverse)\s*\(/,function(){
			throw new Error("Unsafe function call");
		});
		
		query = query.replace(/([^=<>]=)([^=])/g,"$1=$2"). // change the equals to comparisons
			replace(/@|(\.\s*)?[a-zA-Z\$_]+(\s*:)?/g,function(t){
				return t.charAt(0) == '.' ? t : // leave .prop alone 
					t == '@' ? "$obj" :// the reference to the current object 
					//Persevere edit
					(t.match(/:|^(\$|Math|args|true|false|null|instanceof|date|__ids__)$/) ? "" : "$obj.") + t; // plain names should be properties of root... unless they are a label in object initializer
			}).
			replace(/\.?\.?\[(`\]|[^\]])*\]|[\(\,]?\?.*|\.\.([\w\$_]+)|\.\*/g,function(t,a,b){
				var oper = t.match(/^\.?\.?(\[\s*\?|\?|\[\s*==)(.*?)\]?$/); // [?expr] and ?expr and [=expr and =expr
				if(oper){
					var prefix = '';
					if(t.match(/^\./)){
						// recursive object search
						call("expand");
						prefix = ",true)";
					}
					call(oper[1].match(/\=/) ? "map" : "filter");//persevere edit
					return prefix + ",function($obj){try{return " + oper[2] + "}catch(e){}})"; 
				}
				oper = t.match(/^\[\s*([\/\\].*)\]/); // [/sortexpr,\sortexpr]
				if(oper){
					// make a copy of the array and then sort it using the sorting expression
					var first = true;
					return ".fastSort(" + oper[1].replace(/\s*,?\s*([\/\\])\s*([^,\\\/]+)/g,function(t,a,b){
						return (first ? (first=false) || '': ',') + "function($obj){return " + b + "}," + (a== "/");
					}) + ")";
				}
				oper = t.match(/^\[(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)\]/); // slice [0:3]
				if(oper){
					call("slice");
					return "," + (oper[1] || 0) + "," + (oper[2] || 0) + "," + (oper[3] || 1) + ")"; 
				}
				if(t.match(/^\.\.|\.\*|\[\s*\*\s*\]|,/)){ // ..prop and [*]
					call("expand");
					return (t.charAt(1) == '.' ? 
							",'" + b + "'" : // ..prop 
								t.match(/,/) ? 
									"," + t : // [prop1,prop2]
									"") + ")"; // [*]
				}
				return t;
			}).
			replace(/([\(\,])\?(((\([^\)]*\))|[^\),])*)([\),])/,function(t,a,b,c,d,e){
				// handle func(?expr)
				return a + "function($obj){try{return " + b + "}catch(e){}}" + e; 
			}).
			replace(/\.(class|this|null|function|extends|instanceof|var)(\W)/,function(t,a,b){
				// fix reserved words
				return '["' + a + '"]' + b;
			}).
			replace(/(\$obj\s*((\.\s*[\w_$]+\s*)|(\[\s*`([0-9]+)\s*`\]))*)(==|~)\s*`([0-9]+)/g,makeRegex). // create regex matching
			replace(/`([0-9]+)\s*(==|~)\s*(\$obj\s*((\.\s*[\w_$]+)|(\[\s*`([0-9]+)\s*`\]))*)/g,function(t,a,b,c,d,e,f,g){ // and do it for reverse =
				return makeRegex(t,c,d,e,f,g,b,a);
			});
		query = prefix + (query.charAt(0) == '$' ? "" : "$") + query.replace(/`([0-9]+|\])/g,function(t,a){
			//restore the strings
			return a == ']' ? ']' : str[a];
		});
		// create a function within this scope (so it can use expand and slice)
		
		return eval("1&&function($,$1,$2,$3,$4,$5,$6,$7,$8,$9){var $obj=$;return " + query + "}");
	};
	tempQuery.privileged = false;
	jsonQuery = tempQuery;
})();