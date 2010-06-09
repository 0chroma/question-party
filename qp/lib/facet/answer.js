
var Answer = require("model/answer").Answer,
    Restrictive = require("facet").Restrictive;

exports.PublicFacet = Restrictive(Answer, {
    query: function(query, options){
        Answer.checkQuery(query);
        return Answer.query(query, options);
    },
    post: function(props, directives){
        return Answer.post(props, directives);
    },
    put: function(props, directives){
        //make sure only score can be modified
        return Answer.put(props, directives);
    },
    prototype: {

    },
    quality: 0.5
});
