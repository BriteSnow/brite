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
			
			return main.projectDao.get(data.projectId).pipe(function(project){
				view.project = project;
				view.projectId = data.projectId;
				return render("tmpl-ProjectView",{project:project});
			});		
		}, 
		
		postDisplay: function(){
			var view = this;
			
			// Persist this element at the view for future use
			view.$sectionContent = view.$el.find("section.content");
			
			refreshTable.call(view); 	
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
	
	// --------- Private Methods --------- //
	function refreshTable(){
		var view = this;
		
		return main.taskDao.list({match:{projectId:view.projectId}}).done(function(taskList){
			var taskTableHtml = render("tmpl-ProjectView-taskList",{tasks:taskList});
			view.$sectionContent.html(taskTableHtml);			
		});
	}
	// --------- /Private Methods --------- // 
	
})(); 