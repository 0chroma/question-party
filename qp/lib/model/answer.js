var Model = require("perstore/model").Model,
    DefaultStore = require("perstore/stores").DefaultStore,
    answerStore = DefaultStore("Answer");

exports.Answer = Model(answerStore, {
    properties: {
        text: String,
        score: Number,
        questionId: {
            type: Number,
            indexed: true
        }
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

