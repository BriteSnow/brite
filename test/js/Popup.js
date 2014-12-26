(function(){
	
	/**
	 * Events
	 **/
	brite.registerView("Popup",{parent: "body"}, {

		create: function(data){
			var view = this;
			view.data = this;
			return "<div class='Popup'><div class='dialog'><div class='dialog-inner'>dialog inner</div></div></div>";
		},

		events: {

			// Action Event: Popup_DO_CLOSE
			"Popup_DO_CLOSE": function(){
				var view = this;
				// we have to trigger the event before
				view.$el.trigger("Popup_CLOSING");
				view.$el.bRemove();	
			},

			// when click outside the dialog, we close
			"click": function(event){
				var view = this;
				// close only if the target click is the root Popup element (the overlay)
				if (view.$el.is(event.target)){
					view.$el.trigger("Popup_DO_CLOSE");
				}
			}
		}


	});	
})();