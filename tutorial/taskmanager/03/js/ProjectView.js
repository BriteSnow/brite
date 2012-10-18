/**
 * View: ProjectView
 *
 * View showing the project panel and manage all the edits related to a project and its tasks.
 *
 */
(function() {
	
	brite.registerView("ProjectView",{
		
		create: function(data){
			var view = this;
			
			// request the project and task list for the project
			var whenBothComplete =  $.when(main.projectDao.get(data.projectId),
																		 main.taskDao.list({match:{projectId:data.projectId}}));
			
			// when both requests get completed, return another deferred with the rendered new HTMLElement
			return whenBothComplete.pipe(function(project,taskList){
				view.project = project;
				view.projectId = data.projectId;
				return $("#tmpl-ProjectView").render({project:project,tasks:taskList});
			});			
		}
	});
	
})(); 