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
	}
}
