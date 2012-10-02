/**
 * View: MainView
 * 
 * Main view of the application. Create and manage the sub views. 
 */
(function($) {
	
	brite.registerView("MainView",{emptyParent:true},{
		
		create: function(){
			return $("#tmpl-MainView").render();
		},
		
		postDisplay: function(){
			var view = this;
			
			brite.display("ProjectListNav",view.$el.find(".MainView-left"));
			brite.display("ProjectView",view.$el.find(".MainView-projectViewPanel"));
		}
			
	});
	
	

})(jQuery); 