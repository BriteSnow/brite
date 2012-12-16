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
      
      // Display the two sub-views
      brite.display("ProjectListNav",view.$el.find(".MainView-left"));
      brite.display("ProjectView",view.$el.find(".MainView-projectViewPanel"));
    }
			
	});

})(); 