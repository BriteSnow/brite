/**
 * Component: MainView
 *
 * Responsibilities:
 *   - MainView of the application.
 *   - Will create all the necessary sub components
 *   - Manage all the application wide events
 *
 */
(function($) {

	brite.registerView("MainView", {emptyParent:true}, {
		
		create: function(data, config) {
			return render("tmpl-MainView");
		},
		
		postDisplay: function(data,config){
			var view = this;
			
			// caching some fixed jQuery elements that will be used later 
			view.$mainContent = view.$el.find(".MainView-content");
			view.$mainPanels = view.$el.find(".MainView-panels");
			view.$mainPanelsInner = view.$el.find(".MainView-panels-inner");
			
			// Create and display the ProjectListNav view and add it to the .MainView-content
			var projectListNavPromise = brite.display("ProjectListNav", view.$el.find(".MainView-left"));
			
			// When the projectListNav is created, we get the list of project, and select the first one 
			// by triggering the DO_SELECT_PROJECT application event 		
			projectListNavPromise.done(function(){
				// Once the ProjectListNav is displayed, we select the first project 
				main.projectDao.list().done(function(projectList){
					view.projectList = projectList; // keep the list in this object. TODO: needs to keep this list fresh
					view.$el.trigger("DO_SELECT_PROJECT",{projectId:projectList[0].id});
				});			
		 	});			
		 	
		 	// clean the old child on transitionend
			view.$mainPanelsInner.on("btransitionend",function(){
				view.$mainPanelsInner.find("[data-state='old']").bRemove();
			});
	 	},
	 	
	 	events: {
	 		"DO_SELECT_PROJECT": doSelectProject,
	 		
	 		"btap; .MainView-next": goNext, 
	 		
	 		"btap; .MainView-prev": goPrev
	 	} 
		
	});
	
	
	// --------- events --------- //
	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all	
	function doSelectProject(event,extra){
		var view = this;
		
		var $projectViewPanel = $("<div class='MainView-projectViewPanel current'></div>");
		
		var oldIdx = brite.array.getIndex(view.projectList,"id",view.currentProjectId);
		view.currentProjectId = extra.projectId;
		var newIdx = brite.array.getIndex(view.projectList,"id",view.currentProjectId);
		
		var forward = (oldIdx < newIdx);

		// get the full project object		
		main.projectDao.get(extra.projectId).done(function(project){

			// display the new view, and do the animation
			brite.display("ProjectView",$projectViewPanel, {project:project}).done(function(){
				var lastChild = view.$mainPanelsInner.children().filter(":last").attr("data-state","old");
				var w = lastChild.width();
				var newLeft = 0;
				if (lastChild.length > 0){
					if (forward){
						newLeft = lastChild.position().left + w + 10;
					}else{
						newLeft = lastChild.position().left - w - 10;
					}
				}
				$projectViewPanel.css("left",newLeft + "px");
				view.$mainPanelsInner.append($projectViewPanel);
				view.$mainPanelsInner.css("transform","translateX(" + (-1 * newLeft) + "px)");
			});	
			
			// trigger the project selection change	
			view.$el.trigger("PROJECT_SELECTION_CHANGE",{project:project});
		});
				
	}
	
	function goNext(){
		var view = this;
		var idx = brite.array.getIndex(view.projectList,"id",view.currentProjectId);
		if (idx < view.projectList.length - 1){
			var nextProject = view.projectList[idx + 1];
			// just trigger the DO_SELECT_PROJECT
			view.$el.trigger("DO_SELECT_PROJECT",{projectId:nextProject.id});
		}	 				
	}
	
	function goPrev(){
		var view = this;
		var idx = brite.array.getIndex(view.projectList,"id",view.currentProjectId);
		if (idx > 0){
			var nextProject = view.projectList[idx - 1];
			// just trigger the DO_SELECT_PROJECT
			view.$el.trigger("DO_SELECT_PROJECT",{projectId:nextProject.id});
		}	 			
		
	}
	// --------- /events --------- //

})(jQuery); 