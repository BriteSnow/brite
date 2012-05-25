var brite = brite || {};

/**
 * @namespace brite.event convenient touch/mouse event helpers.
 */
brite.event = brite.event || {};

// ------ brite event helpers ------ //
(function($){
	var hasTouch = brite.ua.hasTouch();
	/**
     * if it is a touch device, populate the event.pageX and event.page& from the event.touches[0].pageX/Y
     * @param {jQuery Event} e the jquery event object 
     */
    brite.event.fixTouchEvent = function(e){
        if (hasTouch) {
            var oe = e.originalEvent;
			
            if (oe.touches.length > 0) {
                e.pageX = oe.touches[0].pageX;
                e.pageY = oe.touches[0].pageY;
            }
        }
        
        return e;
    }
    
    /**
     * Return the event {pageX,pageY} object for a jquery event object (will take the touches[0] if it is a touch event)
     * @param {jQuery Event} e the jquery event object
     */
    brite.event.eventPagePosition = function(e){
      var pageX, pageY;
  		if (e.originalEvent && e.originalEvent.touches){
  			pageX = e.originalEvent.touches[0].pageX;
  			pageY = e.originalEvent.touches[0].pageY;
  		}else{
  			pageX = e.pageX;
  			pageY = e.pageY;
  		}
  		return {
  			pageX: pageX,
  			pageY: pageY
  		}
    }
})(jQuery);

// ------ /brite special events ------ //
;(function($){
  
  // to prevent other events (i.e., btap) to trigger when dragging.
  var _dragging = false;
  
  var mouseEvents = {
      start: "mousedown",
      move: "mousemove",
      end: "mouseup"
  }
  
  var touchEvents = {
      start: "touchstart",
      move: "touchmove",
      end: "touchend"
  }
  
  function getTapEvents(){
    if (brite.ua.hasTouch()){
      return touchEvents;
    }else{
      return mouseEvents;
    }
  }  
  
  // --------- btap & btaphold --------- //
  $.event.special.btap = {

    setup : function(data, namespaces) {

      var tapEvents = getTapEvents();

      $(this).on(tapEvents.start, function(event) {
        var elem = this;
        var $elem = $(elem);
        
        var origTarget = event.target, startEvent = event, timer;
        
        function handleEnd(event){
          clearAll();
          if (event.target === origTarget && !_dragging){
            brite.event.fixTouchEvent(startEvent);
            triggerCustomEvent(elem, startEvent,{type:"btap"});
          }
        }
        
        function clearAll(){
          clearTimeout(timer);
          $elem.off(tapEvents.end,handleEnd);
        }  
        
        $elem.on(tapEvents.end,handleEnd);
        
        timer = setTimeout(function() {
          if (!_dragging){
            brite.event.fixTouchEvent(startEvent);
            triggerCustomEvent( elem, startEvent,{type:"btaphold"});
          }
        }, 750 );
      });

    }

  }; 


  linkSpecialEventsTo(["btaphold"],"btap");
  
  // --------- /btap & btaphold --------- //
  
  
  // --------- bdrag* --------- //
  var BDRAGSTART="bdragstart",BDRAGMOVE="bdragmove",BDRAGEND="bdragend";
  var BDRAGENTER="bdragenter",BDRAGOVER="bdragover",BDRAGLEAVE="bdragleave",BDROP="bdrop";
  
  var dragThreshold = 5;
  
  $(function(){
    //$("body").css("-webkit-user-select","none");
  });
  $.event.special[BDRAGMOVE] = {

    setup : function(data, namespaces) {
      
      var tapEvents = getTapEvents();
      
      $(this).on(tapEvents.start, function(event) {
        var elem = this;
        var $elem = $(this);
        var dragStarted = false;
        var startEvent = event;
        var startPagePos = brite.event.eventPagePosition(startEvent);
        var origTarget = event.target;
        var $origTarget = $(origTarget);
        
        var $document = $(document);
        var uid = "_" + brite.uuid(7);
        
        // drag move (and start)
        $document.on(tapEvents.move + "." + uid,function(event){
          
          var currentPagePos = brite.event.eventPagePosition(event);
          // fix a bug on Chrome that always change the cursor to text
          $("body").css("-webkit-user-select","none");
          
          if (!dragStarted){
            if(Math.abs(startPagePos.pageX - currentPagePos.pageX) > dragThreshold || Math.abs(startPagePos.pageY - currentPagePos.pageY) > dragThreshold) {
              dragStarted = true;
              _dragging = true;
              $origTarget.data("bDragCtx", {});
              var bextra = buildDragExtra(event, $origTarget, BDRAGSTART);
              triggerCustomEvent( origTarget, event,{type:BDRAGSTART,target:origTarget,bextra:bextra});  
              
              event.stopPropagation();
              event.preventDefault();
              
            }
          }
          
          if(dragStarted) {
            var bextra = buildDragExtra(event, $origTarget, BDRAGMOVE);
            triggerCustomEvent( origTarget, event,{type:BDRAGMOVE,target:origTarget,bextra:bextra});
            event.stopPropagation();
            event.preventDefault();
          }
        });
        
        // drag end
        $document.on(tapEvents.end + "." + uid, function(event){
          // chrome fix cleanup (remove the hack)
          $("body").css("-webkit-user-select","");
          if (dragStarted){
            var bextra = buildDragExtra(event, $origTarget, BDRAGEND);
            triggerCustomEvent( origTarget, event,{type:BDRAGEND,target:origTarget,bextra:bextra});
            event.stopPropagation();
            event.preventDefault();            
          }  
          $document.off("." + uid);
          _dragging = false;
        });
            
      });
    }
  };
  
  linkSpecialEventsTo([BDRAGSTART,BDRAGEND],BDRAGMOVE);
  
   /**
   * Build the extra event info for the drag event. 
   */
  function buildDragExtra(event,$elem,dragType){
    brite.event.fixTouchEvent(event);
    var hasTouch = brite.ua.hasTouch();
    var extra = {
      eventSource: event,
      pageX: event.pageX,
      pageY: event.pageY      
    };
    
    var oe = event.originalEvent;
    if (hasTouch){
      extra.touches = oe.touches;
    }
    
    var bDragCtx = $elem.data("bDragCtx");
    
    if (dragType === BDRAGSTART){
      bDragCtx.startPageX = extra.startPageX = extra.pageX;
      bDragCtx.startPageY = extra.startPageY = extra.pageY;
      
      bDragCtx.lastPageX = bDragCtx.startPageX = extra.startPageX;
      bDragCtx.lastPageY = bDragCtx.startPageY = extra.startPageY;
    }else if (dragType === BDRAGEND){
      // because, on iOs, the touchEnd event does not have the .touches[0].pageX
      extra.pageX = bDragCtx.lastPageX;
      extra.pageY = bDragCtx.lastPageY;
    }
    
    extra.startPageX = bDragCtx.startPageX;
    extra.startPageY = bDragCtx.startPageY;
    extra.deltaX = extra.pageX - bDragCtx.lastPageX;
    extra.deltaY = extra.pageY - bDragCtx.lastPageY;
    
    bDragCtx.lastPageX = extra.pageX;
    bDragCtx.lastPageY = extra.pageY;
    return extra;
  }
  // --------- /bdrag* --------- //
  
  
  
  // --------- btransitionend --------- //
  $.event.special.btransitionend = {

    setup : function(data, namespaces) {
      var eventListener = "transitionend";
      if (!$.browser.mozilla){
        eventListener = brite.ua.cssVarPrefix().toLowerCase() + "TransitionEnd";
      }
      this.addEventListener(eventListener,function(event){
        triggerCustomEvent(this,event,{type:"btransitionend"});
      });
     

    }

  };   
  // --------- /btransitionend --------- //
  
  // --------- Event Utilities --------- //
  
  // Link
  function linkSpecialEventsTo(eventNames,eventRef){
    $.each(eventNames,function(idx,val){
      $.event.special[ val ] = {
        setup: function() {
          $( this ).bind( eventRef, $.noop );
        }
      };      
    });
  }
    
  function triggerCustomEvent( elem, nativeEvent, override ) {
    var newEvent = jQuery.extend(
      new jQuery.Event(),
      nativeEvent,override
    );
    $(elem).trigger(newEvent);    
  }
  // --------- /Event Utilities --------- //  
    
})(jQuery);





