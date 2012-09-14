/**
 * View: ProjectListNav
 *
 * Responsibilities:
 *   - Manage the list of project (create, delete, select, rename)
 *
 */
(function($) {

	function ProjectListNav() {
	};
	
	// --------- View Interface Implementation ---------- //
	ProjectListNav.prototype.create = function(data, config) {
		var html = $("#tmpl-ProjectListNav").render({projects:main.projectListTestData});
		var $e = $(html);
		return $e;
	}
	// --------- /View Interface Implementation ---------- //

	// --------- View Registration --------- //
	// Here we register the View
	brite.registerView("ProjectListNav", null, function() {
		return new ProjectListNav();
	});
	// --------- View Registration --------- //


})(jQuery); 