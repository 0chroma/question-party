var Model = require("model").Model,
    DefaultStore = require("perstore/stores").DefaultStore,

var answerStore = DefaultStore("Answer");

exports.Answer = Model("Answer", answerStore, {
    properties: {
        text: String,
        score: Number,
        questionId: Number
    }
}
