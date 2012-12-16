/**
 * View: ProjectListNav
 *
 * Responsibilities:
 *   - Manage the list of project (create, delete, select, rename)
 *
 */
(function() {
	
	brite.registerView("ProjectListNav",{
		
		create: function(){
			return render("tmpl-ProjectListNav");
		},
		
		postDisplay: function(){
			var view = this;
			
			// caching for future use
			view.$listContainer = view.$el.find(".list-container");

			// call the view's private method to refresh the project list. 			
			refreshList.call(view);
		}
	});
	
	// --------- Private Methods --------- //
	// Private view method: refresh the project list. 
	function refreshList(){
		var view = this;
		
		// from the projectDao, list all the project, and when done
		// update the view.$listContainer with the new HTML elements
		main.projectDao.list().done(function(projectList){
			view.$listContainer.html(render("tmpl-ProjectListNav-list",{projects:projectList}));
		});		
	}	
	// --------- /Private Methods --------- //

})(); 