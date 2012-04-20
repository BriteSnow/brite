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
    if (data && data.componentName){
        var $windowContent = c.$element.find(".Window-content");
        brite.display(data.componentName,null,{parent:$windowContent});
    }
  }  
  
  
  Window.prototype.postDisplay = function(){
    var c = this;
    
    // position the window
    var $demo = c.$element.closest(".Demo");
    var screenWidth = $demo.width();
    var screenHeight = $demo.height();
    var w = screenWidth / 3;
    var h = screenHeight / 3;
    c.$element.width(w);
    c.$element.height(h);
    var x = screenWidth / 2 - w;
    var y = screenHeight / 2 - h;
    c.$element.css({top: "" + y + "px",
                    left: "" + x + "px"}); 
    
    // now, we can show it.                 
    c.$element.show();

    setActive.call(c);
    
    // set active on click
    c.$element.on("mousedown touchstart",function(){
      setActive.call(c);
    });
    
    // action dialog
    c.$element.on("touchstart mousedown",".ico-window",function(){
      console.log("click");
      var $popupScreen = c.$element.find(".Window-popupScreen");
      // if we have a popup, then close it
      if ($popupScreen.length > 0){
        closePopup.call(c);
      }
      // otherwise, we create it
      else{
        console.log("add popup");
        var html = $("#tmpl-Window-actionsPopup").render({});
        $popupScreen = $(html);
        $popupScreen.css("opacity",0);
        var $popup = $popupScreen.find(".Window-popup");
        c.$element.append($popupScreen);
        var h = $popup.outerHeight();
        $popup.css("top",-h);
        $popupScreen.css("opacity",1);
        $popup.animate({top:0});
        
        $popup.on("click","[data-action='close']",function(){
          c.$element.bRemove();
        });
        
        $popup.on("click","[data-action='maximize']",function(){
          // remove the width/height to have the position take effect
          c.$element.css({width:"",height:""});
          c.$element.css({top:0,right:0,bottom:80,left:0});
        });
      }
    });
    
    // closing the popup
    c.$element.on("click",".Window-popupScreen, .Window-closePopup",function(event){
      var $target = $(event.target);
      if ($target.hasClass("Window-popupScreen") || $target.hasClass("Window-closePopup")){ 
          closePopup.call(c);
      }
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
  
  function closePopup(){
    var c = this;
    
    var $popupScreen = c.$element.find(".Window-popupScreen");
    var $popup = $popupScreen.find(".Window-popup");
    var h = $popup.outerHeight();
    $popup.animate({top:-h},function(){
      $popupScreen.bRemove();
    });
  }
  // --------- /Private Component Methods ---------- //
  

  
  // --------- Component Registration --------- //
  brite.registerComponent("Window", {
    parent : "body"
  },
  function() {
    return new Window();
  });
  // --------- /Component Registration --------- //    

})();