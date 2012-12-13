/**
 * View: ProjectListNav
 *
 * Responsibilities:
 *   - Manage the list of project (create, delete, select, rename)
 *
 */
(function($) {
	
	brite.registerView("ProjectListNav",{
		
		create: function(){
			return render("tmpl-ProjectListNav");
		},
		
		postDisplay: function(){
			var view = this;
			view.$listContainer = view.$el.find(".list-container");
			
			refreshList.call(view);
		},
		
		events: {
			"btap; li[data-entity='Project']" : function(event){
				var $li = $(event.currentTarget);
				var projectId = $li.bEntity("Project").id;
				$li.trigger("DO_SELECT_PROJECT",{projectId:projectId});
			}
		},
		
		docEvents: {
			"PROJECT_SELECTION_CHANGE": function(event,extra){
				showProjectSelected.call(this,extra.projectId);
			}
		},
		
		daoEvents: {
			"dataChange; Project": refreshList
		} 
		
	});


	function refreshList(){
		var view = this;
		main.projectDao.list().done(function(projectList){
			view.$listContainer.html(render("tmpl-ProjectListNav-list",{projects:projectList}));
		});		
	}

	function showProjectSelected(projectId){
		var view = this;

		// deselect any eventual selection
		view.$el.find("li.sel").removeClass("sel");
		view.$el.find("i.icon-folder-open").removeClass("icon-folder-open").addClass("icon-folder-close");
		
		// select the li
		var $selectedLi = view.$el.find("li[data-entity-id='" + projectId + "']");
		$selectedLi.addClass("sel");
		$selectedLi.find("i.icon-folder-close").removeClass("icon-folder-close").addClass("icon-folder-open");
		
		// keep that for dataChangeEvent (to keep the item selected)
		view.selectedProjectId = projectId;
	}

})(jQuery); 