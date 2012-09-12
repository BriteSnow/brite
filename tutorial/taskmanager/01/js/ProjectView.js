/**
 * View: ProjectView
 *
 * Responsibilities:
 *   - Manage a single project screen
 *   - Manage the task list of a project
 *
 */
(function($) {
	
	function ProjectView() {
	}
		
	// --------- View Interface Implementation ---------- //
	ProjectView.prototype.create = function(data, config) {
		var o = this;

		var html = $("#tmpl-ProjectView").render({project:main.projectListTestData[0],tasks:main.taskListTestData});
		var $e = $(html);
		return $e;		
	}
	// --------- /Component Interface Implementation ---------- //

	// --------- View Registration --------- //
	// Here we register the component
	brite.registerView("ProjectView", null, function() {
		return new ProjectView();
	});
	// --------- View Registration --------- //
	
})(jQuery); 