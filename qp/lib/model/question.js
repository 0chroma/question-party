var Model = require("model").Model,
    DefaultStore = require("perstore/stores").DefaultStore,
    questionStore = DefaultStore("Question");

exports.Question = Model("Question", questionStore, {
    properties: {
        text: String,
        answers: Array,
        skips: Number,
        sourceName: String,
        sourceUrl: String
    },
    construct: function(question, directives){
        question.skips = 0;
        question.answers = [];
        return question.save(directives);
    }
});

