/**
 * Component: ProjectListNav
 *
 * Responsibilities:
 *   - Manage the list of project (create, delete, select, rename)
 *
 */
(function($) {

	// --------- Component Interface Implementation ---------- //
	function ProjectListNav() {
	};

	ProjectListNav.prototype.create = function(data, config) {
		
		return main.getProjectList().pipe(function(projectList){
			var html = $("#tmpl-ProjectListNav").render({projects:projectList});
			var $e = $(html);
			return $e;
		});
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	ProjectListNav.prototype.postDisplay = function(data, config) {
		var c = this;
		
		c.$element.on("click","li[data-obj_type='Project']",function(){
			var $li = $(this);
			var projectId = $li.attr("data-obj_id");
			$li.trigger("DO_SELECT_PROJECT",{projectId:projectId});
		});		
	}

	// --------- /Component Interface Implementation ---------- //

	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("ProjectListNav", null, function() {
		return new ProjectListNav();
	});
	// --------- Component Registration --------- //

})(jQuery); 