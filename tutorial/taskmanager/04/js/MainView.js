/**
 * View: MainView
 * 
 * Main view of the application. Create and manage the sub views. 
 */
(function() {
	
	brite.registerView("MainView",{emptyParent:true},{
		
		create: function(){
			return render("tmpl-MainView");
		},
		
    // Called after the view is displayed to the user
    postDisplay: function(){
      var view = this;
      
			// Create and display the ProjectListNav view and add it to the .MainView-content
			brite.display("ProjectListNav", view.$el.find(".MainView-left")).done(function(){
				// When the ProjectListNav is displayed, we trigger the DO_SELECT_PROJECT with 
				// the hardcoded (for now) project ID.				
				view.$el.trigger("DO_SELECT_PROJECT",{projectId:"001"});
			});
    }, 
    
    events: {
    	
    	// 2) on DO_PROJECT_CHANGE trigger PROJECTION_SELECTION_CHANGE
    	// Note: It is often more efficient for the action event handler to fetch the data
    	//       and trigger the corresponding status event with the full data. This is 
    	//       why we are fetching project before triggering the PROJECT_SELECTION_CHANGE.
    	"DO_SELECT_PROJECT": function(event,extra){
    		var view = this;
    		main.projectDao.get(extra.projectId).done(function(project){
    			view.$el.trigger("PROJECT_SELECTION_CHANGE",{project:project});
    		});
    	}
    },
    
    docEvents: {
    	
    	// 4) On PROJECT_SELECTION_CHANGE replace the ProjectView
    	"PROJECT_SELECTION_CHANGE": function(event,extra){
    		var view = this;
    		
    		// NOTE: Call the brite jQuery .bEmpty() to make sure that brite destroy
    		//       properly any views below this element 
    		$projectViewPanel = view.$el.find(".MainView-projectViewPanel").bEmpty();
    		// display the new projectView
    		brite.display("ProjectView",$projectViewPanel,{project:extra.project});
    	}
    }
			
	});

})(); 