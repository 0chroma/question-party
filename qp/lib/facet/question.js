
var Question = require("model/question").Question,
    Restrictive = require("facet").Restrictive;

exports.PublicFacet = Restrictive(Question, {
    query: function(query, options){
        Question.checkQuery(query);
        return Question.query(query, options);
    },
    prototype: {

    },
    quality: 0.5
});
