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
  
  // --------- Component Interface Implementation ---------- //
  function Demo(){
    
  }
  
  Demo.prototype.create = function(){
    var html = $("#tmpl-Demo").render({});
    return $(html);
  }
  
  Demo.prototype.postDisplay = function(){
    var c = this; 
    
    registerActionEventHandlers.call(c);
    
    // display the dock
    brite.display("Dock",null,{parent:c.$element});

    // launch the default app
    c.$element.trigger("Demo_DO_LAUNCH_APP","Draw");    
  }  
  // --------- /Component Interface Implementation ---------- //

  // --------- Private Methods --------- //
  function registerActionEventHandlers(){
    var c = this;
    
    // Demo_DO_LAUNCH_APP 
    c.$element.on("Demo_DO_LAUNCH_APP",function(event,appName){
      var appInfo = brite.array.getItem(demo.apps, "name", appName );
      var windowInfo = {
        header : appInfo.title
      }
      if (appInfo.name){
        windowInfo.componentName = appInfo.name;
      } 
      brite.display("Window", windowInfo, {
        parent : c.$element
      });           
    });
    
    
    // Demo_DO_LAUNCH_APP
    c.$element.on("Demo_DO_CLOSE_WINDOW",function(event,windowElement){
      var $wind = $(windowElement);
      
      $wind.bTransition({transition:"all 0.3s ease",transform:"scale(.01)"}).on("btransitionend",function(){
        $wind.bRemove();
      });
      
    });
    
  }
  // --------- /Private Methods --------- //
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("Demo", {
    parent : "body"
  },
  // Note in this way, when a function is passed, this function will be use as the factory for the new instance it is responsible to return an instance of the Component
  function() {
    return new Demo();
  });
  // --------- /Component Registration --------- //  
  
})();