(function(){
  
  // --------- Component Interface Implementation ---------- //
  function Window(){
    
  }
  
  /**
   * Component data has this format: 
   * data.title: title of the window
   * data.contentComponentName: the component to be included in the content area of the window
   * data.contentComponentData: the data to be passed to the content component
   * 
   */
  Window.prototype.create = function(data){
    var html = $("#tmpl-Window").render(data || {});
    var $e = $(html);
    // we hide it since we will reposition it on postDisplay (otherwise, it will flicker)
    $e.hide();
    
    return $e;
  }
  
  Window.prototype.init = function(data){
    var c = this;
    
    // if we have a content component to include, then, we include it
    if (data && data.contentComponentName){
        
    }
  }  
  
  
  Window.prototype.postDisplay = function(){
    var c = this;
    
    // position the window
    var $demo = c.$element.closest(".Demo");
    var screenWidth = $demo.width();
    var screenHeight = $demo.height();
    var x = screenWidth / 2 - c.$element.width() / 2;
    var y = screenHeight / 2 - c.$element.height() / 2;
    c.$element.css({top: "" + y + "px",
                    left: "" + x + "px"}); 
    
    // now, we can show it.                 
    c.$element.show();

    setActive.call(c);
    
    // set active on click
    c.$element.on("mousedown touchstart",function(){
      setActive.call(c);
    });
                    
    // handle the window drag
    c.$element.bDrag(".Window-header",{
      drag: function(event, extra){
        var pos = c.$element.position();
        var newX = pos.left + extra.deltaPageX;
        var newY = pos.top + extra.deltaPageY;
        c.$element.css({top: "" + newY + "px",
                        left: "" + newX + "px"}); 
        
      }
    });                
    
    // handle the resize
    c.$element.bDrag(".Window-resizeHandle",{
      drag: function(event, extra){
        var w = c.$element.width() + extra.deltaPageX;
        var h = c.$element.height() + extra.deltaPageY;
        
        c.$element.width(w);
        c.$element.height(h);
      }
    }); 
    
  }
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Private Component Methods ---------- //
  function setActive(){
    var c = this;
    
    // only if it is not already active
    if (!c.$element.hasClass("Window-Active")){
      var $demo = c.$element.closest(".Demo");
      $demo.find(".Window").removeClass("Window-active");
      c.$element.addClass("Window-active");    
    }
  }
  // --------- /Private Component Methods ---------- //
  
  // --------- Component Registration --------- //
  brite.registerComponent("Window", {
    parent : "body",
    loadTemplate : true
  },
  function() {
    return new Window();
  });
  // --------- /Component Registration --------- //    

})();