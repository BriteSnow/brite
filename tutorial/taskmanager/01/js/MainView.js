/**
 * View: MainView
 *
 * Responsibilities:
 *   - Main Screen for the application.
 *   - Will create all the necessary sub views
 *   - Manage all the application wide events
 */
(function() {
	
	brite.registerView("MainView",{emptyParent:true},{
		
		create: function(){
			// since this first view is static, no need to call js render, just a .html() on the template.
			return render("tmpl-MainView");
		}
			
	});

})(); 