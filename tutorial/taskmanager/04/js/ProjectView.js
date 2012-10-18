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
		}, 
		
		events: {
			
			// 1) on click of a td .icon-trash of this view
			"click; td .icon-trash": function(event){
				// get the enclosing data-entity="Task" html element to get its id
				var entityRef = $(event.currentTarget).bEntity("Task");
				
				// 2) Delete the task by using the taskDao 
				main.taskDao.remove(entityRef.id);
			} 
		},
		
		daoEvents: {
			// 3) on the dao event dataChange on Task, refresh the task table
			"dataChange; Task": refreshTable
		}
	});
	
	function refreshTable(){
		var view = this;
		var $sectionContent = view.$el.find("section.content");
		
		// get the latest list of task for the project of this view. 
		return main.taskDao.list({match:{projectId:view.projectId}}).done(function(taskList){
			// recreate the table content, and refresh the $sectionContent element
			var taskTableHtml = $("#tmpl-ProjectView-taskList").render({tasks:taskList});
			$sectionContent.html(taskTableHtml);			
		});
	} 
	
})(); 