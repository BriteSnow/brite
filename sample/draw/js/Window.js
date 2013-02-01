/**
 * Component: Window
 * 
 * Responsibilities: 
 *   - Display and Manage all aspect of a "Window" component
 * 
 * Constructor Data: 
 *   data.componentName : This specify the component name that need to be included in this window
 * 
 * Component API:  
 *   - show(): make the component visible (use
 *  
 * Component Events
 *   - Window_DO_SET_ACTIVE: Triggered on the Window element or children to set a Window active. 
 *   - Window_DO_MAXIMIZE: Triggered on the Window element children to maximize the Window
 *   - Window_DO_RESTORE: Triggered on the Window element or children to restore the window  
 * 
 * Other Events: 
 *   - element_resizing: Fired on c.$element when the window is getting resize (for each drag move)
 *   - element_resized: Fired when the resizing is done
 *   - Demo_DO_CLOSE_WINDOW: Fire when the user close the window
 * 
 * CSS: 
 *   - trigger-element_resize: to tell children that it fires element_resize event
 */
(function(){
  
  // --------- Component Interface Implementation ---------- //
  function Window(){
    // the app name contain in this window
    this.appName = null;
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
    var $e = $(html.trim());
    
    $e.addClass("trigger-element_resize");
    
    // we hide it since we will reposition it on postDisplay (otherwise, it will flicker)
    $e.hide();
    return $e;
  }
  
  Window.prototype.init = function(data){
    var c = this;
    
    var dfd;
    // if we have a content component to include, then, we include it
    if (data && data.componentName){
        var $windowContent = c.$element.find(".Window-content");
        
        this.appName = data.componentName;
        
        dfd = brite.display(data.componentName,$windowContent).whenInit;
        dfd.fail(function(){
          console.log("failing");
        });
    }    
    
    
    return $.when(dfd);
  }  
  
  
  Window.prototype.postDisplay = function(data){
    var c = this;
    var $e = c.$element;
    

    // Very simple default positioning logic (just to avoid the common overlap)
    var space = 32;
    var $demo = c.$element.closest(".Demo");
    var x = $demo.innerWidth() * 0.1;
    var y = $demo.innerHeight() * 0.1;
    $demo.find(".Window").each(function(){
      var $window = $(this);
      if (!$window.is($e)){
        var winPos = $window.position();
        if (x > winPos.left -8 && x < winPos.left + 8 && 
            y > winPos.top -8 && y < winPos.top + 8){
          x += space;
          y += space;
        }
      }
    });
    // todo: need to check that width or height is not over screen
    $e.css({top:y+"px",left:x+"px",width:"60%",height:"60%"});
    
    // now, we can show it.                 
    $e.show();

    setActive.call(c);
    
    // set active on click
    $e.on("mousedown touchstart",function(){
      setActive.call(c);
    });
    
    // window-controls
    $e.on("btap",".ico-window",function(){
      var $controls = c.$element.find(".Window-controls");
      // if we have a popup, then close it
      if ($controls.length > 0){
        hideControls.call(c);
      }
      // otherwise, we create it
      else{
        showControls.call(c);
      }
    });
    
    $e.on("bdragmove",".Window-header",function(event){
        var pos = c.$element.position();
        var newX = pos.left + event.bextra.deltaX;
        var newY = pos.top + event.bextra.deltaY;
        c.$element.css({top: "" + newY + "px",
                        left: "" + newX + "px"}); 
    });
    
    $e.on("bdragmove",".Window-resizeHandle",function(event){
        var w = c.$element.width() + event.bextra.deltaX;
        var h = c.$element.height() + event.bextra.deltaY;
        
        c.$element.width(w);
        c.$element.height(h);    
        
        c.$element.trigger("element_resizing");  
    });
    
    $e.on("bdragend",".Window-resizeHandle",function(event){
      c.$element.trigger("element_resized");
    });
    
  }
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Public API --------- //
  // --------- /Component Public API --------- //
  
  // --------- Component Private Methods ---------- //
  function maximize(){
    var c = this;
    var $e = c.$element;
    
    // record the position
    var pos = $e.position();
    $e.data("lastPosition",{left:pos.left,top:pos.top,w:$e.width(),h:$e.height()});
    
    var $parent = $e.parent();
    var w = $parent.innerWidth();
    var h = $parent.innerHeight() - 64; // for now, harcode dock height
    
    $e.css({top:0,left:0});
    $e.width("100%").height("100%");
    
    hideControls.call(c,true);
  }
  
  function restore(){
    c = this;
    var $e = c.$element;
    
    var pos = $e.data("lastPosition");
    if (pos){
      $e.css({top:pos.top,left:pos.left});
      $e.width(pos.w).height(pos.h);
    }
    $e.data("lastPosition",null);
    hideControls.call(c,true);
  }
  
  function setActive(){
    var c = this;
    
    // only if it is not already active
    if (!c.$element.hasClass("Window-Active")){
      var $demo = c.$element.closest(".Demo");
      $demo.find(".Window").removeClass("Window-active");
      c.$element.addClass("Window-active");    
    }
  }
  
  function showControls(){
    var c = this;
    
    var isMaximized = c.$element.data("lastPosition") && true;
    
    var tmplData = {maximized:isMaximized};
    
    var html = $("#tmpl-Window-controls").render(tmplData);
    $controls = $(html.trim());
    var $inner = $controls.find(".Window-controls-inner");
    $controls.css("opacity","0");
    c.$element.append($controls);
    
    // do the animation
    var startLeft = -$inner.outerWidth();
    $inner.css("left",startLeft);
    $controls.css("opacity","1");
    
    $inner.bTransition({transition:"all 0.3s ease",transform:"translate(" + (-1 * startLeft) + "px,0px)",onTimeout:true});
    
    c.$element.find(".Window-header h2").fadeOut();
    
    $controls.on("btap","[data-action='close']",function(){
      c.$element.trigger("Demo_DO_CLOSE_WINDOW",c.$element[0]);
    });
    
    $controls.on("btap","[data-action='maximize']",function(){
      maximize.call(c);
    });  
    
    $controls.on("btap","[data-action='restore']",function(){
      restore.call(c);
    });    
  }
  
  function hideControls(instant){
    var c = this;
    
    var $controls = c.$element.find(".Window-controls");
    
    if (instant){
      $controls.bRemove();
      c.$element.find(".Window-header h2").fadeIn();
    }else{
      var $inner = $controls.find(".Window-controls-inner");
      var endLeft = -$inner.outerWidth();
      $inner.css("-webkit-transform","");
      $inner.on("btransitionend",function(){
        $controls.remove();
      });
      c.$element.find(".Window-header h2").fadeIn();
    }
  }
  // --------- /Component Private Methods ---------- //
  

  
  // --------- Component Registration --------- //
  brite.registerComponent("Window", {
    parent : "body"
  },
  function() {
    return new Window();
  });
  // --------- /Component Registration --------- //    

})();