dojo.provide("qp._base");

dojo.require("dojo.parser");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");
dojo.require("dojoc.sandbox.rounded.Rounded");
dojo.require("dojox.data.PersevereStore");
dojo.require("dijit.layout.StackContainer");
dojo.require("dojox.rpc.Client");

var qp = {
    questionStore: null,
    answerStore: null,
    stackContainer: null,
    init: function(){
        this.createStores();
        this.stackContainer = dijit.byId("stackContainer");
        dijit.byId("questionForm").loadQuestion(); 
    },
    createStores: function(){
        qp.questionStore = new dojox.data.PersevereStore({target: "/Question"});
        qp.answerStore = new dojox.data.PersevereStore({target: "/Answer"});
    },
    showAnswers: function(question){
        qp.stackContainer.forward();
        dijit.byId("answerForm")
        //TODO: pass question onto answer widget
    },
    showQuestion: function(){
        qp.stackContainer.back();
        dijit.byId("questionForm").loadQuestion(); 
    }
}
