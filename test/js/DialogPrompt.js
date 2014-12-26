// BEST-PRACTICE: enclose all the component code in a immediate JS function (and make it $ safe by passing the jQuery as param)
 
(function($) {
	
	brite.registerView("DialogPrompt",{parent: "body"}, {
		create: function(data){
			this._answerCallBacks = [];
			// render is a little handlebars wrapper 
			return render("tmpl-DialogPrompt",data);
		}, 

		events: {
			"click; button.ok": onOk,
			"click; button.cancel": onCancel
		}, 

		docEvents: {
			"click": function(event){
				console.log("clicking somewhere on the $document");
			}, 
		},

		winEvents: {
			"resize": function(event){
				console.log("window is resizing",event);
			}
		},

		// --------- Public DialogPrompt API --------- //
		onAnswer: function(answerCallBack) {
			var view = this;
			view._answerCallBacks.push(answerCallBack);
		},

		close: function() {
			var view = this;
			view.$el.bRemove();
		}
		// --------- /Public DialogPrompt API --------- //

	});

	// --------- Private View Events Handling --------- //
	function onOk(event){
		var view = this;
		setAnswer.call(view,true);
	}
	
	function onCancel(event){
		var view = this;
		setAnswer.call(view,false);
	}	
	// --------- /Private View Events Handling --------- //
	
	// --------- Private Methods --------- //
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
	// --------- /Private Methods --------- //

})(jQuery);
