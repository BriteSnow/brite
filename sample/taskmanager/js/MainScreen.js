/**
 * Component: MainScreen
 *
 * Responsibilities:
 *   - MainScreen of the application.
 *   - Will create all the necessary sub components
 *   - Manage all the application wide events
 *
 */
(function($) {

	// --------- Component Interface Implementation ---------- //
	function MainScreen() {
	};

	// This is the MUST-HAVE component function that must return the new html element for this component instances
	MainScreen.prototype.create = function(data, config) {
		var html = $("#tmpl-MainScreen").render(data);
		var $e = $(html);
		return $e;
		// always return the newly created HTML element (here wrapped in a jQuery object)
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	MainScreen.prototype.postDisplay = function(data, config) {
		var o = this; // convention, set 'o' to be this for the view (to avoid bugs when in closures). 

		// Create a ProjectListNav view and add it to the .MainScreen-content
		var projectListNavPromise = brite.display("ProjectListNav", null, {
			parent : o.$element.find(".MainScreen-left")
		});
	
		// When the projectListNav is created, we get the list of project, and select the first one 
		// by triggering the DO_SELECT_PROJECT application event 		
		projectListNavPromise.done(function(){
			// Once the ProjectListNav is displayed, we select the first project 
			main.projectDao.list().done(function(projectList){
				o.$element.trigger("DO_SELECT_PROJECT",{projectId:projectList[0].id});
			});			
	 	});
		
		// On "DO_SELECT_PROJECT" application event, swap the ProjectScreen
		// Note: brite add the .$element property on the view object (which is the element returned by .create)		
		o.$element.on("DO_SELECT_PROJECT",function(event,extra){
			brite.display("ProjectScreen", {projectId:extra.projectId}, {
				emptyParent: true,
				parent : o.$element.find(".MainScreen-content")
			});
		});
		
	}
	// --------- /Component Interface Implementation ---------- //

	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("MainScreen", {emptyParent:true}, function() {
		return new MainScreen();
	});
	// --------- Component Registration --------- //

})(jQuery); 