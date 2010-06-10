dojo.provide("qp._base");

dojo.require("dojo.parser");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");
dojo.require("dojoc.sandbox.rounded.Rounded");
dojo.require("dojox.data.PersevereStore");
dojo.require("dijit.layout.StackContainer");

var qp = {
    questionStore: null,
    answerStore: null,
    stackContainer: null,
    answerPrefill: "Enter your answer here...",
    init: function(){
        this.textStart();
        this.createStores();
        this.stackContainer = dijit.byId("stackContainer");
    },
    textClear: function(){
        var a = dijit.byId('answerEntry')
		if(a.getValue() == this.answerPrefill){
			a.setValue('');
		}
	},
    textFill: function(){
        var a = dijit.byId('answerEntry');
        if(a.getValue() == ""){
            a.setValue(this.answerPrefill);
        }
    },
    textStart: function(){
		dijit.byId('answerEntry').setValue(this.answerPrefill);
		dojo.connect(dijit.byId('answerEntry'), 'onFocus', qp, "textClear");
		dojo.connect(dijit.byId('answerEntry'), 'onBlur', qp, "textFill");
	},
    createStores: function(){
        qp.questionStore = new dojox.data.PersevereStore({target: "/Question"});
        qp.answerStore = new dojox.data.PersevereStore({target: "/Answer"});
    },
    showAnswers: function(question){
        qp.stackContainer.forward();
        //TODO: pass question onto answer widget
    },
    showQuestion: function(){
        qp.stackContainer.back();
    }
}
