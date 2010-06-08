// This file fills the models with questions.
var defer = require("promise").defer,
    request = require("jsgi-client").request,
    sources = require("settings").questionSources;


var filler = {
    interval: 1000*60*15, //fifteen minutes
    start: function(){
        var looper = function(){
            this.fillModels().addCallback(function(result){
                setTimeout(looper, filler.interval);
            });
        }
        looper();
    },
    fillModels: function(){
        var d = defer();
        //do fill, then call d.resolve(result)
        for(var i in sources){
            var source = sources[i];
            
        }
        return d;
    },
    fetchFeed: function(source){
        //calls parseResult
    },
    parseResult: function(data){

    },
    addQuestion: function(question){
        //adds a question to the db
    }
}
