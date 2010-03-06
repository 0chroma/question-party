dojo.provide("qp._base");
dojo.require("dojo.parser");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");
dojo.require("dojoc.sandbox.rounded.Rounded");
dojo.require("dijit.form.TextBox");

var qp = {
    answerPrefill: "Enter your answer here...",
    textClear: function(){
		if(dijit.byId('answerEntry').getValue() == this.answerPrefill){
			dijit.byId('answerEntry').setValue('');
		}
	},
    textStart: function(){
		dijit.byId('answerEntry').setValue(this.answerPrefill);
		dojo.connect(dijit.byId('answerEntry'), 'onFocus', qp.textClear);
	}
}
