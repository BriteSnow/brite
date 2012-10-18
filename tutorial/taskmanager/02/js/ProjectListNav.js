/**
 * View: ProjectListNav
 *
 * Projects navigation view
 *
 */
(function() {
	
	brite.registerView("ProjectListNav",{

		create: function(){
			return $("#tmpl-ProjectListNav").render({projects:main.projectListTestData});
		}
		
	});

})(); 