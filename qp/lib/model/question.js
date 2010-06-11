require("perstore/resource-query").operators.random = function(){ return this[Math.floor(Math.random() * this.length)];}; //for getting a random question
var settings = require("commonjs-utils/settings")
var Answer = require("model/answer").Answer;

var Model = require("model").Model,
    DefaultStore = require("perstore/stores").DefaultStore,
    questionStore = DefaultStore("Question");

exports.Question = Model("Question", questionStore, {
    properties: {
        text: String,
        skips: Number,
        sourceName: String,
        sourceUrl: String
    },
    construct: function(question, directives){
        question.skips = 0;
        return question.save(directives);
    },
    prototype: {
        addSkip: function(){
            this.skips += 1;
            if(this.skips > settings.maxSkips){
                Answer.query("questionId="+this.id).forEach(function(item){
                    Answer["delete"](item.id);
                });
                Question["delete"](this.id); //V8 throws a hissy fit if you use it regularly
            }else{
                this.save();
            }
            return true; 
        }
    }
});

