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

	// --------- Component Interface Implementation ---------- //
	function MainView() {
	};

	// This is the MUST-HAVE component function that must return the new html element for this component instances
	MainView.prototype.create = function(data, config) {
		var html = $("#tmpl-MainView").render(data);
		var $e = $(html);
		return $e;
		// always return the newly created HTML element (here wrapped in a jQuery object)
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	MainView.prototype.postDisplay = function(data, config) {
		var o = this; // convention, set 'o' to be this for the view (to avoid bugs when in closures). 

		var $mainContent = o.$element.find(".MainView-content");
		var $mainPanels = o.$element.find(".MainView-panels");
		var $mainPanelsInner = o.$element.find(".MainView-panels-inner");
		
		// Create a ProjectListNav view and add it to the .MainView-content
		var projectListNavPromise = brite.display("ProjectListNav", null, {
			parent : o.$element.find(".MainView-left")
		});
	
		// When the projectListNav is created, we get the list of project, and select the first one 
		// by triggering the DO_SELECT_PROJECT application event 		
		projectListNavPromise.done(function(){
			// Once the ProjectListNav is displayed, we select the first project 
			main.projectDao.list().done(function(projectList){
				o.projectList = projectList; // keep the list in this object. TODO: needs to keep this list fresh
				o.$element.trigger("DO_SELECT_PROJECT",{projectId:projectList[0].id});
			});			
	 	});
		
		// On "DO_SELECT_PROJECT" application event, swap the ProjectView
		// Note: brite add the .$element property on the view object (which is the element returned by .create)		
		o.$element.on("DO_SELECT_PROJECT",function(event,extra){
			var $projectViewPanel = $("<div class='MainView-projectViewPanel'></div>");
			
			var oldIdx = brite.array.getIndex(o.projectList,"id",o.currentProjectId);
			o.currentProjectId = extra.projectId;
			var newIdx = brite.array.getIndex(o.projectList,"id",o.currentProjectId);
			
			var forward = (oldIdx < newIdx);
			
			brite.display("ProjectView", {projectId:extra.projectId}, {
				parent : $projectViewPanel
			}).done(function(){
				o.lastChild = $mainPanelsInner.children().filter(":last");
				var w = o.lastChild.width();
				var newLeft = 0;
				if (o.lastChild.length > 0){
					if (forward){
						newLeft = o.lastChild.position().left + w + 10;
					}else{
						newLeft = o.lastChild.position().left - w - 10;
					}
				}
				$projectViewPanel.css("left",newLeft + "px");
				$mainPanelsInner.append($projectViewPanel);

				$mainPanelsInner.css("transform","translateX(-" + newLeft + "px)");
			});
		});
		
		// clean the old child on transitionend
		$mainPanelsInner.on("btransitionend",function(){
			o.lastChild.bRemove();
			delete o.lastChild;
		});
		
		
		// When the user click on the MainView-next
		o.$element.on("btap",".MainView-next",function(){
			var idx = brite.array.getIndex(o.projectList,"id",o.currentProjectId);
			if (idx < o.projectList.length - 1){
				var nextProject = o.projectList[idx + 1];
				// just trigger the DO_SELECT_PROJECT
				o.$element.trigger("DO_SELECT_PROJECT",{projectId:nextProject.id});
			}
		});
		
		// When the user click on the MainView-prev
		o.$element.on("btap",".MainView-prev",function(){
			var idx = brite.array.getIndex(o.projectList,"id",o.currentProjectId);
			if (idx > 0){
				var nextProject = o.projectList[idx - 1];
				// just trigger the DO_SELECT_PROJECT
				o.$element.trigger("DO_SELECT_PROJECT",{projectId:nextProject.id});
			}
		});
		
	}
	// --------- /Component Interface Implementation ---------- //

	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("MainView", {emptyParent:true}, function() {
		return new MainView();
	});
	// --------- Component Registration --------- //

})(jQuery); 