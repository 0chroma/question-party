var request = require("./nodules-utils/node-http-client").request,
	promiseModule = require("./nodules-utils/promise"),
	when = promiseModule.when,
	fs = require("./nodules-utils/fs-promise"),
	system = require("./nodules-utils/system"),
	Unzip = require("./nodules-utils/unzip").Unzip,
	zipInflate = require("./nodules-utils/inflate").zipInflate,
	print = system.print,
	paths = require.paths,
	defaultRequire = require,
	moduleExports = {
		promise: promiseModule,
		"fs-promise": fs,
		"nodules": exports,
		system: system
	},
	modules = {},
	factories = {},
	waitingOn = 0,
	inFlight = {},
	monitored = [],
	overlays = {},
	callbacks = [],
	useSetInterval = false,
	packages = {},
	filePathMappings = [],
	defaultPath = "",
	main = null,
	WorkerConstructor = typeof Worker !== "undefined" ? Worker : null;
	SharedWorkerConstructor = typeof SharedWorker !== "undefined" ? SharedWorker : null;
	defaultMap = {
		"http://github.com/([^/]+)/([^/]+)/raw/([^/]+)/(.*)": "zip:http://github.com/$1/$2/zipball/$3!/$4"
	};

function EnginePackage(engine){
	var enginePackage = this;
	this.useLocal= function(){
		try{
			var packageJson = fs.read("package.json");
		}catch(e){
			packageJson = "{}";
		}
		try{
			var parsed = JSON.parse(packageJson);
		}catch(e){
			e.message += " trying to parse local package.json";
			throw e;
		}
		return enginePackage.usePackage(parsed, "file://" + fs.realpathSync("."));
	};
	this.usePackage= function(packageData, path){
		processPackage(path, packageData, engine); 
		if(path){
			packageData.mappings.defaultPath = path + "/lib/";
		}
		for(var i in packageData){
			enginePackage[i] = packageData[i];
		}
		return enginePackage;
	};
	
	this.getModuleSource = function(id){
		try{
			return fs.read(enginePackage.getCachePath(id));
		}catch(e){
			if(id.indexOf(":") === -1 && moduleExports[id.substring(0, id.length - 3)]){
				try{
					return fs.read(__dirname+ "/nodules-utils/" + id);
				}
				catch(e){}
			}
		}
	};
	this.getCachePath= function(id){
		if(id.substring(id.length - 3) == ".js"){
			id = id.substring(0, id.length - 3);
		}
		var uri = resolveUri("", id, enginePackage.mappings);
		if(id.charAt(id.length -1) == "/"){
			uri = uri.substring(0, uri.lastIndexOf("."));
		}
		if(uri.substring(0,7) == "file://"){
			return uri.substring(7);
		}
		return cachePath(uri);
	};	
}

packages[""] = exports;
exports.mappings = [];
exports.mappings.defaultPath = "";

exports.forEngine = function(engine){
	return new EnginePackage(engine);
}

exports.ensure = makeRequire("").ensure;
exports.runAsMain = function(uri){
	if(!uri || uri.indexOf(":") === -1){
		uri = "file://" + fs.realpathSync(uri || "lib/index.js");
	}
	main = modules[uri] = modules[uri] || new Module(uri); 
	return exports.ensure(uri, function(require){
		require(uri);
	});
};

EnginePackage.call(exports, exports.usingEngine = typeof process !== "undefined" ? "node" : "narwhal");

function Module(uri){
	this.id = uri;
	this.dependents = {};
}

Module.prototype.supportsUri = true;

exports.baseFilePath = system.env.NODULES_PATH || "downloaded-modules";
try{
	var filePathMappingsJson = fs.read(exports.baseFilePath + "/paths.json");
}catch(e){
	
}
if(filePathMappingsJson){
	var filePathMappingsObject = JSON.parse(filePathMappingsJson);
	useSetInterval = filePathMappingsObject.useSetInterval;
	for(var i in filePathMappingsObject){
		filePathMappings.push({
			from: RegExp(i),
			to: filePathMappingsObject[i]
		});
	}
}

function reloadable(onload){
	var onChange = function(){
		monitored.push(onChange);
		onload();
	}
	onChange();
}
function resolveUri(currentId, uri, mappings){
	if(uri.charAt(0) === '.'){
		var extension = currentId.match(/\.[\w]+$/);
		extension = extension ? extension[0] : "";
		uri = currentId.substring(0, currentId.lastIndexOf('/') + 1) + uri;
		while(lastUri !== uri){
			var lastUri = uri;
			uri = uri.replace(/\/[^\/]*\/\.\.\//,'/');
		}
		return [uri.replace(/\/\.\//g,'/')] + extension;
	}
	else if(uri.indexOf(":") > -1){
		return uri;
	}else{
		if(mappings){
			for(var i = 0; i < mappings.length; i++){
				var mapping = mappings[i];
				var from = mapping.from;
				if(mapping.exact ? uri === from : uri.substring(0, from.length) === from){
					uri = mapping.to + uri.substring(from.length);
					return uri.match(/\.\w+$/) ? uri : uri + (getPackage(uri).extension || ".js");
				}
			}
			if(!uri.match(/\.\w+$/)){
				uri = mappings.defaultPath +uri + (getPackage("").extension || ".js");
			}
		}
		return uri;
	}
}
function getPackage(uri){
	if(uri.substring(0,4) == "jar:"){
		// if it is an archive, the root should be the package URI
		uri = uri.substring(0, uri.lastIndexOf('!') + 2);
	}
	else{
		// else try to base it on the path
		uri = uri.substring(0, uri.lastIndexOf('/lib/') + 1);
	}
	return packages[uri] || packages[""];
}
function makeWorker(Constructor, currentId){
	return Constructor && function(script, name){
		var worker = Constructor("nodules-worker.js", name);
		var mappings = getPackage(currentId).mappings;
		worker.postMessage(resolveUri(currentId, script, mappings));
		return worker;
	}
}
function makeRequire(currentId){
	var require = function(id){
		var uri = resolveUri(currentId, id, getPackage(currentId).mappings);
		if(moduleExports[uri]){
			modules[uri].dependents[currentId] = true;
			return moduleExports[uri];
		}
		if(factories[uri]){
			var exports = moduleExports[uri] = {};
			try{
				var module = modules[uri] = modules[uri] || new Module(uri);
				module.dependents[currentId] = true;
				var currentFile = cachePath(uri);
				exports = factories[uri].call(exports, makeRequire(uri), exports, module, 
						currentFile, currentFile.replace(/\/[^\/]*$/,''),
						makeWorker(WorkerConstructor, uri), makeWorker(SharedWorkerConstructor, uri)) 
							|| exports;
				var successful = true;
			}
			finally{
				if(!successful){
					delete moduleExports[uri];
				}
			}
			return exports;
		}
		if(uri.indexOf(":") === -1){
			id = uri;
			if(id.substring(id.length - 3) == ".js"){
				id = id.substring(0, id.length - 3);
			}
		}
		try{
			return moduleExports[id] || defaultRequire(id);
		}catch(e){
			throw new Error("Can not find module " + uri);
		}
	};
	require.main = main;
	require.define = function(moduleSet, dependencies){
		require.ensure(dependencies);
		for(var i in moduleSet){
			// TODO: Verify that id is an acceptably defined by the requested URL (shouldn't allow cross-domain definitions) 
			factories[i] = moduleSet[i];
		}
	};
	require.paths = paths;
	require.reloadable = reloadable;
	require.resource = function(uri){
		uri = resolveUri(currentId, uri, getPackage(currentId).mappings);
		return factories[uri];
	}
	require.ensure = function(id, callback){
		if(id instanceof Array){
			id.forEach()
		}
		var uri = resolveUri(currentId, id, getPackage(currentId).mappings),
			require = makeRequire(uri),
			i = 0;
		if(factories[uri]){
			if(callback){
				callback(require);
			}
			return;
		}
		if(callback){
			callbacks.unshift(callback);
		}
		if(uri.indexOf(':') > 0 && !inFlight[uri]){
			waitingOn++;
			inFlight[uri] = true;
			var source = exports.load(uri, require);
			return when(source, function(source){
				try{
					if(source !== undefined){
						var packageData = getPackage(uri);
						if(packageData && packageData.compiler){
							var deferred = promiseModule.defer();
							require.ensure(packageData.compiler.module, function(){
								try{
									var rewrittenSource = require(packageData.compiler.module)[packageData.compiler["function"] || "compile"](source);
									createFactory(uri, rewrittenSource);
									deferred.resolve();
								}catch(e){
									deferred.reject(e);
								}
							});
							return deferred.promise;
						}
						createFactory(uri, source);
						return exports;
					}
				}finally{
					decrementWaiting();
				}
			}, function(error){
				if(uri.indexOf(":") === -1){
					id = uri;
					if(id.substring(id.length - 3) == ".js"){
						id = id.substring(0, id.length - 3);
					}
				}
				try{
					//check to see if it is a system module
					moduleExports[id] || defaultRequire(id);
				}catch(e){
					factories[uri] = function(){
						throw new Error(error.message + " failed to load " + uri);
					};
				}				
				decrementWaiting();
			});
			function decrementWaiting(){
				waitingOn--;
				if(waitingOn === 0){
					var calling = callbacks;
					callbacks = [];
					inFlight = {};
					calling.forEach(function(callback){
						callback(require);
					});
				}
			}
		}
	};
	return require;
}
function processPackage(packageUri, packageData, engine){
	engine = engine || exports.usingEngine;
	var mappings = packageData.mappings || {};
	var mappingsArray = packages[""].mappings;
	var defaultPath = mappingsArray.defaultPath;
	function addMappings(mappings){
		if(mappings){
			mappingsArray = mappingsArray.concat(Object.keys(mappings).map(function(key){
				var to = mappings[key];
				// if it ends with a slash, only match paths
				if(to.charAt(to.length - 1) === '/' && key.charAt(key.length - 1) !== '/'){
					key += '/';
				}
				// for backwards compatibility with regex exact matches
				else if(key.charAt(0) === "^" && key.charAt(key.length - 1) === "$"){
					to += packageData.extension || ".js";
					key = key.substring(1, key.length - 1);
				}
				return {
					from: key,
					exact: to.match(/\.\w+$/),
					to: resolveUri(packageUri, typeof to == "string" ? to : to.to)
				};
			}).sort(function(a, b){
				return a.from.toString().length < b.from.toString().length ? 1 : -1;
			}));
		}
	}
	if(packageData.overlay){
		Object.keys(packageData.overlay).forEach(function(condition){
			try{
				var matches = (engine == condition) || eval(condition);
			}catch(e){}
			if(matches){
				addMappings(packageData.overlay[condition].mappings);
			}
		});
	}
	addMappings(packageData.mappings);
	mappingsArray.defaultPath = defaultPath; 
	packageData.mappings = mappingsArray;
	return packageData;
}



exports.load = function(uri, require){
	var protocolLoader = exports.protocols[uri.substring(0, uri.indexOf(":"))];
	// do this so that we don't timeout on adding the error handler for the source
	if(!protocolLoader){
		throw new Error("Protocol " + uri.substring(0, uri.indexOf(":")) + " not implemented for accessing " + uri);
	}
	var source = protocolLoader(uri);
	return when(source, function(source){
		if(!source){
			throw new Error("Not found");
		}
		// check for source defined package URI
		var packageUri = source.match(/package root: (\w+:.*)/);
		if(packageUri){
			packageUri = packageUri[1];
		}
		else if(uri.substring(0,4) == "jar:"){
			// if it is an archive, the root should be the package URI
			var packageUri = uri.substring(0, uri.lastIndexOf('!') + 2);
		}
		else{
			// else try to base it on the path
			var packageUri = uri.substring(0, uri.lastIndexOf('/lib/') + 1);
		}
		var packageData = packages[packageUri];
		if(!packageData){
	//			idPart = uri;
	//		function tryNext(){
		//		idPart = idPart.substring(0, idPart.lastIndexOf('/') + 1);
			// don't watch json files or changes will create a new factory
			dontWatch[packageUri + "package.json"] = true;
			packageData = when(protocolLoader(packageUri + "package.json"), function(packageJson){
				if(!packageJson){
					return packages[packageUri] = processPackage(packageUri, {});
				}
				try{
					var parsed = JSON.parse(packageJson);
				}catch(e){
					e.message += " trying to parse " + packageUri + "package.json";
					throw e;
				}
				return packages[packageUri] = processPackage(packageUri, parsed);
			}, function(error){
				return packages[packageUri] = processPackage(packageUri, {});
			});
			if(!packages[packageUri]){
				packages[packageUri] = packageData;
			} 
		}
		return when(packageData, function(packageData){
			if(source){
				source.replace(/require\s*\(\s*['"]([^'"]*)['"]\s*\)/g, function(t, moduleId){
					if(require){
						require.ensure(moduleId);
					}
				});
				if(packageData.compiler){
					require.ensure(packageData.compiler.module);
				}
			}
			return source;
		});
	});
};

function createFactory(uri, source){
	try{
		factories[uri] = compile("(function(require, exports, module, __filename, __dirname, Worker, SharedWorker){" + source + "\n;return exports;})", uri);
	}catch(e){
		factories[uri] = function(){
			throw new Error(e.message + " in " + uri);
		}
	}
}
exports.protocols = {
	http: cache(function(uri){
		return getUri(uri);
	}, true),
	jar: cache(function(uri){
		uri = uri.substring(4);
		var exclamationIndex = uri.indexOf("!");
		var target = uri.substring(exclamationIndex + 2);
		
		var targetContents;
		uri = uri.substring(0, exclamationIndex);
		return when(fs.stat(cachePath(uri)), function(){
			// archive has already been downloaded, but the file was not found
			return null;
		},
		function(){
			return when(getUri(uri),function(source){
				if(source === null){
					throw new Error("Archive not found " + uri);
				}
				var unzip = new Unzip(source);
				unzip.readEntries();
				var rootPath = unzip.entries[0].fileName;
				unzip.entries.some(function(entry){
					if(target == entry.fileName){
						rootPath = "";
						return true;
					}
					if(entry.fileName.substring(0, rootPath.length) !== rootPath){
						rootPath = "";
					}
				});
				unzip.entries.forEach(function(entry){
					var fileName = entry.fileName.substring(rootPath.length); 
					var path = cachePath(uri + "!/" + fileName);
					if (entry.compressionMethod <= 1) {
						// Uncompressed
						var contents = entry.data; 
					} else if (entry.compressionMethod === 8) {
						// Deflated
						var contents = zipInflate(entry.data);
					}else{
						throw new Error("Unknown compression format");
					}
					ensurePath(path);
					if(path.charAt(path.length-1) != '/'){
						// its a file
						try{
							fs.writeFileSync(path, contents, "binary");
						}catch(e){
							 // make sure we immediately let the user know if a write fails
							throw e;
						}
					}
					if(target == fileName){
						targetContents = contents;
					}
				});
				if(!targetContents){
					throw new Error("Target path " + target + " not found in archive " + uri);
				}
				return targetContents;
			});
		});
	}),
	file: function(uri){
		return readModuleFile(uri.substring(7), uri);
	},
	data: function(uri){
		return uri.substring(uri.indexOf(","));
	}
};
exports.protocols.zip = exports.protocols.jar;

var requestedUris = {};
function getUri(uri, tries){
	tries = tries || 1;
	if(requestedUris[uri]){
		return requestedUris[uri];
	}
	print("Downloading " + uri + (tries > 1 ? " attempt #" + tries : ""));
	return requestedUris[uri] = request({url:uri, encoding:"binary"}).then(function(response){
		if(response.status == 302){
			return getUri(response.headers.location);
		}
		if(response.status < 300){
			return response.body.join("");
		}
		if(response.status == 404){
			return null;
		}
		throw new Error(response.status + response.body);
	}, function(error){
		tries++;
		if(tries > 3){
			throw error;
		}
		// try again
		delete requestedUris[uri];
		return getUri(uri, tries);
	});
}

function onFileChange(uri){
	// we delete all module entries and dependents to ensure proper referencing
	function removeDependents(module){
		if(module){
			delete moduleExports[module.id];
			var dependents = module.dependents; 
			module.dependents = {};
			for(var i in dependents){
				removeDependents(modules[i]);
			}
		}
	}
	removeDependents(modules[uri]);
	var calling = monitored;
	monitored = [];
	calling.forEach(function(callback){
		callback();
	});
}
function ensurePath(path){
	var index = path.lastIndexOf('/');
	if(index === -1){
		return;
	}
	var path = path.substring(0, index);
	try{
		fs.statSync(path);
	}catch(e){
		ensurePath(path);
		fs.mkdirSync(path, 0777);
	}
}
var watching = {};
var dontWatch = {};

function promiseReadFileSync(path){
	var deferred = promiseModule.defer();
	process.nextTick(function(){
		try{
			deferred.resolve(fs.read(path));
		}catch(e){
			e.message += " " + path;
			deferred.reject(e);
		}
	});
	return deferred.promise;
}
var watchedFiles;
function readModuleFile(path, uri){
	return when(promiseReadFileSync(path), function(source){
		if(!watching[path] && !dontWatch[uri]){
			watching[path] = true;
			if(fs.watchFile && !useSetInterval){
				fs.watchFile(path, {persistent: false, interval: process.platform == "darwin" ? 300 : 0}, possibleChange);
			}else{
				if(!watchedFiles){
					watchedFiles = [];
					setInterval(function(){
						watchedFiles.forEach(function(watched){
							if(!watched.pending){
								watched.pending = true;
								// a hack to get the OS to reread from the network paths
								fs.closeSync(fs.openSync(watched.path, "r"));
								fs.stat(watched.path).then(function(stat){
									watched.pending = false;
									watched.callback(watched.oldstat, stat);
									watched.oldstat = stat;
								}, print);
							}
						});
					}, 300);
				}
				watchedFiles.push({
					oldstat: fs.statSync(path),
					path: path,
					callback: possibleChange
				});
			}
		}
		return source;
		function possibleChange(oldstat, newstat){
				if(oldstat.mtime.getTime() !== newstat.mtime.getTime() && waitingOn === 0){
					print("Reloading " + uri);
					delete factories[uri];
					exports.ensure(uri, function(){
						onFileChange(uri);
					});
				}
			}
	});
}
function cachePath(uri){
	var path = uri;
	if(path.indexOf(exports.defaultUri) === 0){
		path = path.substring(exports.defaultUri.length);
	}
	filePathMappings.forEach(function(pathMapping){
		path = path.replace(pathMapping.from, pathMapping.to);
	});
	return (path.charAt(0) == '/' ? '' : exports.baseFilePath + '/') + path.replace(/^\w*:(\w*:)?\/\//,'').replace(/!\/?/g,'/').replace(/:/g,'_'); // remove protocol and replace colons and add base file path
}
function cache(handler, writeBack){
	return function(uri){
		return when(readModuleFile(cachePath(uri), uri), function(source){
				if(source === "Not Found"){
					return null;
				}
				return source;
			}, function(error){
				var source = handler(uri);
				if(writeBack){
					when(source, function(source){
						var path =cachePath(uri);
						ensurePath(path);
						fs.writeFileSync(path, source === null ? "Not Found" : source, "binary");
					});
				}
				return source;
			});
	};
};


// create compile function for different platforms
var compile = typeof process === "object" ? 
	process.compile :
	typeof Package === "object" ?
	function(source, name){
		return Packages.org.mozilla.javascript.Context.getCurrentContext().compileFunction(this, source, name, 1, null);
	} : eval;
	

if(require.main == module){
	exports.useLocal().runAsMain(system.args[2]);
}