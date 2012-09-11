/**
 * View: ProjectScreen
 *
 * Responsibilities:
 *   - Manage a single project screen
 *   - Manage the task list of a project
 *
 */
(function($) {
	
	// --------- View Registration --------- //
	// Here we register the component
	brite.registerView("ProjectScreen", null, function() {
		return new ProjectScreen();
	});
	// --------- View Registration --------- //
	
	function ProjectScreen() {
	}
		
	// --------- View Interface Implementation ---------- //
	ProjectScreen.prototype.create = function(data, config) {
		var o = this;

		var html = $("#tmpl-ProjectScreen").render({project:main.projectListTestData[0],tasks:main.taskListTestData});
		var $e = $(html);
		return $e;		
	}
	// --------- /Component Interface Implementation ---------- //

})(jQuery); 