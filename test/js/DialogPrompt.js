// BEST-PRACTICE: enclose all the component code in a immediate JS function (and make it $ safe by passing the jQuery as param)

(function($) {

	// --------- Component Interface Implementation ---------- //
	function DialogPrompt() {
	};


	DialogPrompt.prototype.create = function(data, config) {
		this._answerCallBacks = [];

		var html = $("#tmpl-DialogPrompt").render(data);
		var $e = $(html);
		return $e;
	}


	DialogPrompt.prototype.postDisplay = function(data, config) {
		//always reassign the component "this" to "c" to avoid closure scope confusion
		var c = this;

		// Note: after the create, brite will add the created HTML Element as a jquery Element property to the component instance named $element
		c.$element.on("click","button.ok",function() {
			setAnswer.call(c,true);
		});

		c.$element.on("click","button.cancel",function() {
			setAnswer.call(c,false);
		});

	}

	// --------- /Component Interface Implementation ---------- //

	// --------- Component Public API --------- //
	// register a callback on answer
	DialogPrompt.prototype.onAnswer = function(answerCallBack) {
		var c = this;
		c._answerCallBacks.push(answerCallBack);
	}

	// this will be call by this component when the user close the dialog by answering or pressing esc
	DialogPrompt.prototype.close = function() {
		var c = this;
		c.$element.bRemove();
	}

	// --------- /Component Public API --------- //

	// --------- Component Private Methods --------- //
	// Note: this can be any API the developers was to expose
	// this will be called by this component (from the postDisplay logic) when the user answer the prompt dialog
	function setAnswer(answer) {
		var c = this;
		c.answer = answer;
		$.each(c._answerCallBacks, function(idx, callback) {
			callback.call(null, answer);
		});

		c.close();
	}
	// --------- /Component Private Methods --------- //


	// --------- Component Registration --------- //
	brite.registerComponent("DialogPrompt", {
		parent : "body",
		loadTemplate : true
	},
	// Note in this way, when a function is passed, this function will be use as the factory for the new instance it is responsible to return an instance of the Component
	function() {
		return new DialogPrompt();
	});

	// --------- Component Registration --------- //

})(jQuery);
