/**
 * View: MainView
 * 
 * Main view of the application. Create and manage the sub views. 
 */
(function() {
	
	brite.registerView("MainView",{emptyParent:true},{
		
		create: function(){
			return $("#tmpl-MainView").html();
		},
		
    // Called after the view is displayed to the user
    postDisplay: function(){
      var view = this;
      
			// Create and display the ProjectListNav view and add it to the .MainView-content
			brite.display("ProjectListNav", view.$el.find(".MainView-left"));
			
			// for now, just hardcode the first project to display
			brite.display("ProjectView",view.$el.find(".MainView-projectViewPanel"),{projectId:"001"});
    }
			
	});

})(); 