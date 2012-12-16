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
		}, 
		
		// Bind DOM events at the view level with key = "event_types; selector"
		events: {
			// 1) On LI click, trigger the application action event DO_SELECTION			
			"click; li[data-entity='Project']": function(event){
				var $li = $(event.currentTarget);
				// get the project id from the "data-entity-id" attribute
				var projectIdClicked = $li.attr("data-entity-id");
				// trigger the action event
				this.$el.trigger("DO_SELECT_PROJECT",{projectId:projectIdClicked});
			}
		},
    
    // bind DOM events at the Document level same key format as .events
    // Note: those event will be automatically namespaced with the view id
    //       and cleaned up on view destroy
    docEvents: {
    	// 3) on PROJECT_SELECTION_CHANGE select the appropriate LI
      "PROJECT_SELECTION_CHANGE": function(event,extra){
      	showProjectSelected.call(this,extra.projectId);
      }
    }
	});
	
	// DOC NOTE: step 2 and 4 are implemented in MainView.js
	
	function showProjectSelected(projectId){
		var view = this;
	
		// deselect any eventual selection
		view.$el.find("li.sel").removeClass("sel");
		
		// get the new selectedLi and update it class
		var $selectedLi = view.$el.find("li[data-entity-id='" + projectId + "']");
		$selectedLi.addClass("sel");
	} 
		
	// Private view method: refresh the project list. 
	function refreshList(){
		var view = this;
		
		// from the projectDao, list all the project, and when done
		// update the view.$listContainer with the new HTML elements
		main.projectDao.list().done(function(projectList){
			view.$listContainer.html(render("tmpl-ProjectListNav-list",{projects:projectList}));
		});		
	}	

})(); 