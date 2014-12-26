(function(){
	
	brite.registerView("AddTaskPopup",{emptyParent: true}, {

		create: function(data, cfg){
			var view = this;

			// Here, we display the Popup view, and return a new Deferred (per jQuery.then) that will resolve with the 
			// HTML of the AddTaskPopup and we override the AddTaskPopup config.parent with the .dialog-inner
			// of the Popup
			return brite.display("Popup").then(function(popup){
				// change the parent of this AddTaskPopup instance
				cfg.parent = popup.$el.find(".dialog-inner");
				return render("tmpl-AddTaskPopup");
			});
		},

		onOk: function(onOkFunc){
			var view = this;
			view.onOkFunc = onOkFunc;
		},

		onCancel: function(onCancelFunc){
			var view = this;
			view.onCancelFunc = onCancelFunc;
		},

		events: {

			"click; .action-cancel": function(){
				this.$el.trigger("Popup_DO_CLOSE");				
			},

			"click; .action-ok": function(){
				var view = this;
				var data = {
					title: view.$el.find("input[name='title']").val()
				};
				if (view.onOkFunc){
					view.onOkFunc.call(window,data);
					view.onCloseFuncCalled = true;
				}
				view.$el.trigger("Popup_DO_CLOSE");
			}

		}, 

		parentEvents: {
			"Popup": {
				"Popup_CLOSING": function(){
					var view = this;
					// calling cancel when close and no onCloseFunc was called
					if (!view.onCloseFuncCalled){
						view.onCancelFunc.call(window);
						view.onCloseFuncCalled = true;
					}
				}
			}
		}
	});	

})();