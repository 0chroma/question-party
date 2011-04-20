var parse = require("./parse").parse,
    when = require("promise").when,
    defaultRules = require("./rules"),
    toJSON = require("commonjs-utils/json-ext").stringify;

var Template = exports.Template = function(source, options, noWrapper){
	var options = options || {};

	options.resolver = options.resolver || require("./resolver").Resolver;

	var state = {
		resolver: options.resolver
	};
	
	options.rules=options.rules || require("./rules").Rules(options);

	if (options.extension){
		state.extension  = options.extension ;
	}

	// header for compiled template function
	options.header = 'return { forEach: function(_write) { with($data){';

	// footer for compiled template function
	options.footer = '}}}'; 

	return when(source, function(source){
		var parsed = parse(source, state, options); 
		return when(parsed, function(parsed){
			if (!noWrapper){
				var wrapped = [options.header,parsed, options.footer].join('');
				return new Function('$data', wrapped);
			}else{
				return parsed;
			}
		});
	});
}

var extendTemplate=function(state,options){
	var templateString = options.resolver(state.extension.templateName, true)
	return Template(templateString, options, state.extension, true);
};

