
var Answer = require("model/answer").Answer,
    Restrictive = require("facet").Restrictive;

exports.PublicFacet = Restrictive(Answer, {
    query: function(query, options){
        //Answer.checkQuery(query);
        return Answer.query(query, options);
    },
    put: function(props, directives){
        return Answer.post(props, directives);
    },
    prototype: {
        addScore: function(source){
            return source.addScore();
        }
    },
    quality: 0.5
});
