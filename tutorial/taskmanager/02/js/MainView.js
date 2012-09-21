/**
 * View: MainView
 *
 * Responsibilities:
 *   - Main Screen for the application.
 *   - Will create all the necessary sub views
 *   - Manage all the application wide events
 */
(function($) {
	

	function MainView() {
	};	
	
	// --------- View Interface Implementation ---------- //
	// This is the MUST-HAVE component function that must return the new html element for this component instances
	MainView.prototype.create = function(data, config) {
		// using jsrender to render the template (since no data, could have done just .html()).
		var html = $("#tmpl-MainView").render();
		return $(html);
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	MainView.prototype.postDisplay = function(data, config) {
		var o = this; // convention, set 'o' to be 'this' for the view (to avoid confusion when in closures). 

		// o.id : unique id for this view instance (can be used to namespace event binding)
		// o.$element: the jquery wrap HTML element returned (or resolved) by this view create method 
			
		// Create a ProjectListNav view and add it to the .MainView-left
		brite.display("ProjectListNav", null, {
			parent : o.$element.find(".MainView-left")
		});
		
		// Create a ProjectView view and add it to the .MainView-content
		brite.display("ProjectView", null, {
			emptyParent: true,
			parent : o.$element.find(".MainView-projectViewPanel")
		});
	}
	// --------- /View Interface Implementation ---------- //
	
	// --------- View Registration --------- //
	// Here we register the view with brite.registerView(viewName,viewConfigOverride,factoryFunction)
	brite.registerView("MainView", {emptyParent:true}, function() {
		return new MainView();
	});
	// --------- Vew Registration --------- //

})(jQuery); 