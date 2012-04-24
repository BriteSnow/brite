;(function(){
  
  // --------- Component Interface Implementation ---------- //
  function Draw(){
    
  }
  
  Draw.prototype.create = function(data, config){
    var html = $("#tmpl-Dock").render({apps:demo.apps});
    return $(html);
  }
  
  Draw.prototype.postDisplay = function(){
    var c = this;
    
    drawDock.call(c);
    
    $(window).on("resize." + c.cid, function(){
      drawDock.call(c);
    });
    
    
    // Handling the dock item click
    $(c.$element).on("click",".Dock-item",function(){
      var $dockItem = $(this);
      var appName = $dockItem.attr("data-appname");
      
      demo.appLauncher.launch(appName);
    });
  }
  
  Draw.prototype.destroy = function(){
    $(window).off("." + c.cid);
  }
  // --------- /Component Interface Implementation ---------- //
  
  
})();