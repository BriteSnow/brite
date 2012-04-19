/*
 * Commons modules and functions for the demo application
 */
var demo = demo || {};

// --------- appLauncher --------- //
(function() {

  // define the sub module
  demo.appLauncher = {};

  demo.appLauncher.launch = function(appName) {

    var appInfo = brite.array.getItem(demo.apps, "name", appName );

    var windowInfo = {
      header : appInfo.title
    }
    if (appInfo.name){
      windowInfo.componentName = appInfo.name;
    }
    // NOTE: for now, just assume a single Demo container
    brite.display("Window", windowInfo, {
      parent : $(".Demo:first")
    });

  }

})();

// --------- /appLauncher --------- //