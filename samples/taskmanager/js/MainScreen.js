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
		var c = this;


		// --------- Action Event Processing --------- //
		// on the action event "DO_SELECT_PROJECT" show the right project screen
		c.$element.on("DO_SELECT_PROJECT",function(event,extra){
			brite.display("ProjectScreen", {projectId:extra.projectId}, {
				emptyParent: true,
				parent : c.$element.find(".MainScreen-content")
			});
		});
		// --------- /Action Event Processing --------- //
		

		// --- Create Child Views --- //
		brite.display("ProjectListNav", null, {
			parent : c.$element.find(".MainScreen-left")
		}).done(function(){
			// Once the ProjectListNav is displayed, we select the first project 
			main.projectDao.list().done(function(projectList){
				c.$element.trigger("DO_SELECT_PROJECT",{projectId:projectList[0].id});
			});

		});
		// --- /Create Child Views --- //
		

		
		
		
	}

	// --------- /Component Interface Implementation ---------- //

	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("MainScreen", null, function() {
		return new MainScreen();
	});
	// --------- Component Registration --------- //

})(jQuery); 