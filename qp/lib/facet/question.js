
var Question = require("model/question").Question,
    Restrictive = require("facet").Restrictive;

exports.PublicFacet = Restrictive(Question, {
    query: function(query, options){
        //Question.checkQuery(query);
        return Question.query(query, options);
    },
    put: function(props, directives){ return Question.post(props, directives); }, //TEMPORARY
    prototype: {
        addSkip: function(source){
            return source.addSkip();
        }
    },
    quality: 0.5
});
