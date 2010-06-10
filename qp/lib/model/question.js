require("perstore/resource-query").operators.random = function(){ return this[Math.floor(Math.random() * this.length)];}; //for getting a random question
var settings = require("commonjs-utils/settings")

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
    },
    prototype: {
        addSkip: function(){
            this.skips += 1;
            if(this.skips > settings.maxSkips){
                Question["delete"](this.id); //V8 throws a hissy fit if you use it regularly
            }else{
                this.save();
            }
            return true; 
        }
    }
});

