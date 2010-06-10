dojo.provide("qp.QuestionForm");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.TextBox");
dojo.require("dojox.form.BusyButton");

dojo.declare("qp.QuestionForm", [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templatePath: dojo.moduleUrl("qp", "templates/QuestionForm.html"),
    questionItem: null,
    _oldSourceLink: "#",
    postCreate: function(){
        
    },
    loadQuestion: function(){
        qp.questionStore.fetch({
            query: "?random()",
            onComplete: dojo.hitch(this, function(item){
                this.setQuestion(item);
            }),
        });
    },
    setQuestion: function(item){
        var text = qp.questionStore.getValue(item, "text");
        this._showQuestion(text);
        this._oldSourceLink = qp.questionStore.getValue(item, "sourceUrl");
        this._enable();
    },
    onSubmit: function(){
        this.lameButton.attr("disabled", true);
        this.answerBox.attr("disabled", true);
        //submit answer
    },
    onLame: function(){
        this.submitButton.attr("disabled", true);
        this.answerBox.attr("disabled", true);
        //mark as lame
        this.loadQuestion();
    },
    _enable: function(){
        this.lameButton.cancel();
        this.submitButton.cancel();
        this.lameButton.attr("disabled", false);
        this.submitButton.attr("disabled", false);
        this.answerBox.attr("disabled", false);
        this.sourceLinkNode.href=this._oldSourceLink;
    },
    _disable: function(){
        this.lameButton.attr("disabled", false);
        this.submitButton.attr("disabled", false);
        this.answerBox.attr("disabled", false);
        this._oldSourceLink = this.sourceLinkNode.href;
        this.sourceLinkNode.href="#";
    },
    _showQuestion: function(text){
        this.questionNode[dojo.isIE ? "innerText" : "textContent"] = text;
        dojo.style(this.questionNode, "display", "block");
        dojo.style(this.loadingNode, "display", "none");
    },
    _hideQuestion: function(){
        dojo.style(this.questionNode, "display", "none");
        dojo.style(this.loadingNode, "display", "block");
    }
});
