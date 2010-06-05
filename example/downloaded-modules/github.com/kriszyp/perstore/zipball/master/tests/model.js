var assert = require("assert"),
	store = require("stores").DefaultStore("TestStore"),
	model = require("model").Model("TestStore", store, {
		prototype: {		
			testMethod: function(){
				return this.foo;
			}
		},
		staticMethod: function(id){
			return this.get(id);
		},
		properties: {
			foo: {
				type: "number"
			},
			bar: {
				optional: true,
				unique: true
			}
		},
		links: [
			{
				rel: "foo",
				href: "{foo}"
			}
		]
	});

exports.model = model;
exports.CreateTests = function(model){
	return {
		testGet: function(){
			assert.equal(model.get(1).foo, 2);
		},

		testLoad: function(){
			var object = model.get(1);
			object = object.load();
			assert.equal(object.foo, 2);
		},

		testQuery: function(){
			var count = 0;
			model.query("bar=hi").forEach(function(item){
				assert.equal(item.bar, "hi");
				count++;
			});
			assert.equal(count, 1);
		},
		
		testSave: function(){
			var object = model.get(1);
			var newRand = Math.random();
			object.rand = newRand;
			object.save();
			object = model.get(1);
			assert.equal(object.rand, newRand);
		},

		testGetProperty: function(){
			var bar = model.get(2).get("bar");
			assert.equal(bar, "hi");
		},

		testLink: function(){
			var fooTarget = model.get(1).get("foo");
			assert.equal(fooTarget.id, 2);
			assert.equal(fooTarget.bar, "hi");
		},

		testSchemaEnforcement: function(){
			var object = model.get(1);
			object.foo = "not a number";
			assert["throws"](function(){
				object.save();
			});
		},

		testSchemaUnique: function(){
			assert["throws"](function(){
				model.put({foo:3, bar:"hi"});
			});
		},

		testMethod: function(){
			var object = model.get(1);
			assert.equal(model.get(1).testMethod(), 2);
		},

		testStaticMethod: function(){
			var object = model.staticMethod(1);
			assert.equal(object.id, 1);
		}
	};
};
var modelTests = exports.CreateTests(model);
for(var i in modelTests){
	exports[i] = modelTests[i];
}
if (require.main === module.id)
    os.exit(require("test/runner").run(exports));