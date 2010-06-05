var assert = require("assert"),
	testStore = require("store/readonly-memory").ReadonlyMemory({
		index: {
			1: {id: 1, foo: 2}
		}
	});
exports.testGet = function(){
	assert.equal(testStore.get(1).foo, 2);
};
