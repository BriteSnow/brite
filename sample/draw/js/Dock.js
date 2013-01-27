(function(){
  
  // --------- Component Interface Implementation ---------- //
  function Dock(){
    
  }
  
  Dock.prototype.create = function(data, config){
    return $("#tmpl-Dock").render({apps:demo.apps});
  }
  
  Dock.prototype.postDisplay = function(){
    var c = this;
    
    drawDock.call(c);
    
    $(window).on("resize." + c.cid, function(){
      drawDock.call(c);
    });
    
    
    // Handling the dock item click
    $(c.$element).on("click",".Dock-item",function(){
      var $dockItem = $(this);
      var appName = $dockItem.attr("data-appname");
      
      c.$element.trigger("Demo_DO_LAUNCH_APP",appName);
    });
  }
  
  Dock.prototype.destroy = function(){
    $(window).off("." + c.cid);
  }
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Private Methods --------- //
  function drawDock(){
    var c = this;
    var $docBarCanvas = c.$element.find(".Dock-bar canvas");
    
    var g = brite.gtx($docBarCanvas);
    g.fitParent();
    g.clear();
    var h = $docBarCanvas.height() ;
    var w = $docBarCanvas.width();
    
    
    // fill the gradient    
    var clockFillStyle = g.createLinearGradient(0,0,0,h);
    clockFillStyle.addColorStops(0, 'rgba(0, 0, 0, 0.6)',1,'rgba(50, 50, 50, 0.6)');
    g.fillStyle(clockFillStyle);
    g.beginPath().moveTo(0,h - 2).lineTo(30,0).lineTo(w - 28,0).lineTo(w, h ).lineTo(0,h);
    g.fill();

    // top border
    g.beginPath().strokeStyle("rgba(50, 50, 50, 0.3)").lineWidth(1);
    g.moveTo(0 + 28,0).lineTo(w - 28,0).stroke();

    
    // bottom border
    g.beginPath().strokeStyle("rgba(200,200,200,.5)").lineWidth(3);
    g.moveTo(0,h).lineTo(w,h).stroke();
    
    // right border
    g.beginPath().strokeStyle("rgba(50, 50, 50, 0.6)").lineWidth(1);
    g.moveTo(w - 28,0).lineTo(w -1,h -1).stroke();

    // left border
    g.beginPath().strokeStyle("rgba(50, 50, 50, 1)").lineWidth(.5);
    g.moveTo(30,0).lineTo(0,h).stroke();

  }
  // --------- /Component Private Methods --------- //  
    
  // --------- Component Registration --------- //
  brite.registerComponent("Dock", {},
  // Note in this way, when a function is passed, this function will be use as the factory for the new instance it is responsible to return an instance of the Component
  function() {
    return new Dock();
  });
  // --------- Component Registration --------- //  
  
})();