/**
 * View: ProjectListNav
 *
 * Responsibilities:
 *   - Manage the list of project (create, delete, select, rename)
 *
 */
(function($) {

	// --------- View Registration --------- //
	// Here we register the View
	brite.registerView("ProjectListNav", null, function() {
		return new ProjectListNav();
	});
	// --------- View Registration --------- //

	function ProjectListNav() {
	};
	
	// --------- View Interface Implementation ---------- //
	ProjectListNav.prototype.create = function(data, config) {
		var html = $("#tmpl-ProjectListNav").render({projects:main.projectListTestData});
		var $e = $(html);
		return $e;
	}
	// --------- /View Interface Implementation ---------- //


})(jQuery); 