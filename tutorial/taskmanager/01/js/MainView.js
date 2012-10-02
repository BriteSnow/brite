/**
 * View: MainView
 *
 * Responsibilities:
 *   - Main Screen for the application.
 *   - Will create all the necessary sub views
 *   - Manage all the application wide events
 */
(function($) {
	
	brite.registerView("MainView",{emptyParent:true},{
		create: function(){
			return $("#tmpl-MainView").html();
		}
			
	});

})(jQuery); 