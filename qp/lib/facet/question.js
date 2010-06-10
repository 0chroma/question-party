
var Question = require("model/question").Question,
    Restrictive = require("facet").Restrictive;

exports.PublicFacet = Restrictive(Question, {
    query: function(query, options){
        //Question.checkQuery(query);
        return Question.query(query, options);
    },
    put: function(props, directives){
        //make sure only score can be modified
        return Question.put(props, directives);
    },
    post: function(props, directives){ return Question.post(props, directives); }, //TEMPORARY
    prototype: {
    },
    quality: 0.5
});
