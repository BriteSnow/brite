/**
 * Component: Demo
 * 
 * Responsibilities: 
 *   - Top component of all the demo mini apps and components
 *   - launch/close application logic
 * 
 * Component Events: 
 *   - Demo_DO_LAUNCH_APP(appName): Launch an mini application given an app name
 *   - Demo_DO_CLOSE_WINDOW($wind): Close an application
 *  
 */
;(function(){
  
  
  brite.registerView("Demo",{parent: "body"},{
  	create: function(){
	    return  $("#tmpl-Demo").render({});
  	},
  	
  	postDisplay: function(){
	    var view = this; 
	    
	    // display the dock
	    brite.display("Dock",view.$el);
	    
			// launch the default app
    	view.$el.trigger("Demo_DO_LAUNCH_APP","Draw");	      		
  	},
  	
  	events:{
  		"Demo_DO_LAUNCH_APP": function(event,appName){
  			var view = this;
	      var appInfo = brite.array.getItem(demo.apps, "name", appName );
	      var windowInfo = {
	        header : appInfo.title
	      }
	      if (appInfo.name){
	        windowInfo.componentName = appInfo.name;
	      } 
	      brite.display("Window", view.$el, windowInfo);           
	   	},
	    
	    "Demo_DO_CLOSE_WINDOW": function(event, windowElement){
	      var $wind = $(windowElement);
	      
	      $wind.bTransition({transition:"all 0.3s ease",transform:"scale(.01)"}).on("btransitionend",function(){
	        $wind.bRemove();
	      });	    	
	    }
	    
  	}
  		
  });
  

  
})();