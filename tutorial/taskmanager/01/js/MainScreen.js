/**
 * View: MainScreen
 *
 * Responsibilities:
 *   - Main Screen for the application.
 *   - Will create all the necessary sub views
 *   - Manage all the application wide events
 */
(function($) {
	
	// --------- View Registration --------- //
	// Here we register the component
	brite.registerView("MainScreen", {emptyParent:true}, function() {
		return new MainScreen();
	});
	// --------- Vew Registration --------- //

	function MainScreen() {
	};	
	
	// --------- View Interface Implementation ---------- //
	// This is the MUST-HAVE component function that must return the new html element for this component instances
	MainScreen.prototype.create = function(data, config) {
		var html = $("#tmpl-MainScreen").render(data);
		var $e = $(html);
		return $e;
		// always return the newly created HTML element (here wrapped in a jQuery object)
		// can return a promise that will resolved with the $element as well. 
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	MainScreen.prototype.postDisplay = function(data, config) {
		var o = this; // convention, set 'o' to be this for the view (to avoid bugs when in closures). 

		// this object as now 2 added properties: 
		// o.id : unique id for this view instance (can be used to namespace event binding)
		// o.$element: the jquery wrap HTML element returned (or resolved) by this view create method 
			
			
		// Create a ProjectListNav view and add it to the .MainScreen-content
		brite.display("ProjectListNav", null, {
			parent : o.$element.find(".MainScreen-left")
		});
	
		
		brite.display("ProjectScreen", null, {
			emptyParent: true,
			parent : o.$element.find(".MainScreen-content")
		});
	}
	// --------- /View Interface Implementation ---------- //



})(jQuery); 