dojo.provide("qp.QuestionForm");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.TextBox");
dojo.require("dojox.form.BusyButton");

dojo.declare("qp.QuestionForm", [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templatePath: dojo.moduleUrl("qp", "templates/QuestionForm.html"),
    questionItem: null,
    _item: null,
    _oldSourceLink: "#",
    _callCounter: 0,
    answerPrefill: "Enter your answer here...",
    postCreate: function(){
        this._callCounter = 0;
        this.answerBox.attr("value", this.answerPrefill);
    },
    loadQuestion: function(){
        this._disable();
        this._hideQuestion();
        this.answerBox.attr("value", this.answerPrefill);
        qp.questionStore.fetch({
            query: "?random()",
            onComplete: dojo.hitch(this, function(item){
                this.setQuestion(item);
            }),
        });
    },
    setQuestion: function(item){
        this._item = item;
        var text = qp.questionStore.getValue(item, "text");
        this._showQuestion(text);
        this._oldSourceLink = qp.questionStore.getValue(item, "sourceUrl");
        this._enable();
    },
    onSubmit: function(){
        this.lameButton.attr("disabled", true);
        this.answerBox.attr("disabled", true);
        var store = qp.answerStore;
        var questionId = qp.questionStore.getValue(this._item, "id");
        store.newItem({
            text: this.answerBox.attr("value"),
            questionId: questionId
        });
        store.save({onComplete: dojo.hitch(this, function(){
            qp.showAnswers(this._item);
        })});
    },
    onLame: function(){
        this._callCounter++;
        this.submitButton.attr("disabled", true);
        this.answerBox.attr("disabled", true);
        dojo.xhrPost({
            postData: "{'method': 'addSkip', 'id': 'call"+this._callCounter+"', params: []}", 
            url: "/Question/" + qp.questionStore.getValue(this._item, "id"),
            load: dojo.hitch(this, function(data){
                this.loadQuestion();
            }),
            error: dojo.hitch(this, function(){
                alert("Whoops! Something is messed up. Try again later.");
                this._enable();
            })
        });
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
    },
    textClear: function(){
        var a =this.answerBox;
		if(a.getValue() == this.answerPrefill){
			a.setValue('');
            a.focus();
		}
	},
    textFill: function(){
        var a = this.answerBox;
        if(a.getValue() == ""){
            a.setValue(this.answerPrefill);
        }
    }
});
