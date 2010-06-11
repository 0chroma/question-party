dojo.provide("qp.AnswerForm");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("qp.AnswerForm", [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templatePath: dojo.moduleUrl("qp", "templates/AnswerForm.html"),
    questionItem: null,
    _radios: [],
    _callCounter: 0,
    postCreate: function(){
        this._callCounter=0;
        this._radios = [];
    },
    fetchAnswers: function(question){
        this._hideResult();
        this.enableButton();
        this.submitButton.attr("disabled", true);
        dojo.forEach(this._radios, function(radio){
            radio.parentNode.parentNode.removeChild(radio.parentNode); //I know this is the most idiotic way of doing it but whatever
        });
        this._radios = [];
        var questionId = qp.questionStore.getValue(question, "id");
        qp.answerStore.fetch({
            query: "?questionId="+questionId+"&sort(-score)",
            onComplete: dojo.hitch(this, function(results){
                if(results.length == 1)
                    results = [results];
                dojo.forEach(results, dojo.hitch(this, function(item){
                    var row = dojo.create("div", {class: "answerChoiceRow"});
                    var text = dojo.create("span");
                    text[dojo.isIE ? "innerText" : "textContent"] = " "+qp.answerStore.getValue(item, "text") + " (" + qp.answerStore.getValue(item, "score") +" Votes)";
                    var radio = dojo.create("input", {type: "radio", name: this.id+"_radio", value: qp.answerStore.getValue(item, "id")});
                    this._radios.push(radio);
                    dojo.connect(radio, "onclick", this, "enableButton");
                    row.appendChild(radio);
                    row.appendChild(text);
                    this.answerChoiceNode.appendChild(row);
                }));
                this._showResult(qp.questionStore.getValue(question, "text"));
            })
        });
    },
    enableButton: function(){
        this.submitButton.attr("disabled", false);
        this.submitButton.cancel();
    },
    onSubmit: function(){
        var id = null;
        for(var i in this._radios){
            if(this._radios[i].checked){
                id = this._radios[i].value;
                break;
            }
        }
        this._callCounter++;
        dojo.xhrPost({
            postData: "{'method': 'addScore', 'id': 'call"+this._callCounter+"', params: []}", 
            url: "/Answer/" + id,
            load: dojo.hitch(this, function(data){
                qp.showQuestion();
            }),
            error: dojo.hitch(this, function(){
                alert("Whoops! Something is messed up. Try again later.");
                this.enableButton();
            })
        });
    },
    _showResult: function(text){
        //hides loading indicator
        this.questionNode[dojo.isIE ? "innerText" : "textContent"] = text;
        dojo.style(this.questionNode, "display", "block");
        dojo.style(this.loadingNode, "display", "none");
    },
    _hideResult: function(){
        //shows loading indicator
        dojo.style(this.questionNode, "display", "none");
        dojo.style(this.loadingNode, "display", "block");
    }
});
