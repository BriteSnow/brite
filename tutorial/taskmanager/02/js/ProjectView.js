/**
 * View: ProjectView
 *
 * View showing the project panel and manage all the edits related to a project and its tasks.
 *
 */
(function() {
	
	brite.registerView("ProjectView",{
		create: function(){
			return render("tmpl-ProjectView",{project:main.projectListTestData[0],tasks:main.taskListTestData});
		}
	});
	
})(); 