// BEST-PRACTICE: enclose all the component code in a immediate JS function (and make it $ safe by passing the jQuery as param)

(function($) {

	// --------- View Interface Implementation ---------- //
	function DialogPrompt() {
	};

	DialogPrompt.prototype.create = function(data, config) {
		this._answerCallBacks = [];
		var html = $("#tmpl-DialogPrompt").render(data);
		var $e = $(html);
		return $e;
	}

	DialogPrompt.prototype.events = {
		"click button.ok": onOk,
		"click button.cancel": onCancel,
 	}
 	
 	DialogPrompt.prototype.docEvents = {
 		"click": function(event){
 			console.log("clicking somewhere on the $document");
 		}
 	}
 	
	// --------- /View Interface Implementation ---------- //
	
	// --------- View Events Handling --------- //
	function onOk(event){
		var view = this;
		setAnswer.call(view,true);
	}
	
	function onCancel(event){
		var view = this;
		setAnswer.call(view,false);
	}	
	// --------- /View Events Handling --------- //
	

	// --------- View Public API --------- //
	// register a callback on answer
	DialogPrompt.prototype.onAnswer = function(answerCallBack) {
		var view = this;
		view._answerCallBacks.push(answerCallBack);
	}

	// this will be call by this component when the user close the dialog by answering or pressing esc
	DialogPrompt.prototype.close = function() {
		var view = this;
		view.$el.bRemove();
	}
	// --------- /View Public API --------- //

	// --------- View Private Methods --------- //
	// Note: this can be any API the developers was to expose
	// this will be called by this component (from the postDisplay logic) when the user answer the prompt dialog
	function setAnswer(answer) {
		var view = this;
		view.answer = answer;
		$.each(view._answerCallBacks, function(idx, callback) {
			callback.call(null, answer);
		});

		view.close();
	}
	// --------- /View Private Methods --------- //

	// --------- View Registration --------- //
	brite.registerComponent("DialogPrompt", {
		parent : "body",
		loadTmpl : true
	},
	// Note in this way, when a function is passed, this function will be use as the factory for the new instance it is responsible to return an instance of the Component
	function() {
		return new DialogPrompt();
	});
	// --------- View Registration --------- //

})(jQuery);
