dojo.provide("qp.AnswerForm");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("qp.AnswerForm", [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templatePath: dojo.moduleUrl("qp", "templates/AnswerForm.html"),
    questionItem: null,
    postCreate: function(){
        
    }
});
