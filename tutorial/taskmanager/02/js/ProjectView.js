/**
 * View: ProjectView
 *
 * View showing the project panel and manage all the edits related to a project and its tasks.
 *
 */
(function() {
	
	brite.registerView("ProjectView",{
		create: function(){
			return $("#tmpl-ProjectView").render({project:main.projectListTestData[0],tasks:main.taskListTestData});
		}
	});
	
})(); 