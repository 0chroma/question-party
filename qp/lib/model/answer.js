var Model = require("model").Model,
    DefaultStore = require("perstore/stores").DefaultStore,
    answerStore = DefaultStore("Answer");

exports.Answer = Model("Answer", answerStore, {
    properties: {
        text: String,
        score: Number,
        questionId: Number
    },
    construct: function(answer, directives){
        answer.score = 0;
        return answer.save(directives);
    },
    prototype: {
        addScore: function(){
            this.score++;
            this.save();
            return true;
        }
    }
});

