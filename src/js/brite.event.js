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

// ------ /brite event helpers ------ //
;(function($){
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
        
        var origTarget = event.target, origEvent = event.originalEvent, timer;

        function handleEnd(event){
          clearAll();
          if (event.target === origTarget){
            triggerCustomEvent(elem, event,{type:"btap"});
          }
        }
        
        function clearAll(){
          clearTimeout(timer);
          $elem.off(tapEvents.end,handleEnd);
        }  
        
        $elem.on(tapEvents.end,handleEnd);
        
        timer = setTimeout(function() {
          triggerCustomEvent( elem, event,{type:"btaphold"});
        }, 750 );
      });

    }

  }; 


  linkSpecialEventsTo(["btaphold"],"btap");
  
  // --------- /btap & btaphold --------- //
  
  
  // --------- bdrag* --------- //
  var BDRAGSTART="bdragstart",BDRAGMOVE="bdragmove",BDRAGEND="bdragend";
  var BDRAGENTER="bdragenter",BDRAGOVER="bdragover",BDRAGLEAVE="bdragleave",BDROP="bdrop";
  
  var dragThreshold = 10;
  
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
          
          if (!dragStarted){
            if(Math.abs(startPagePos.pageX - currentPagePos.pageX) > dragThreshold) {
              dragStarted = true;
              $origTarget.data("bDragCtx", {});
              var bextra = buildDragExtra(event, $origTarget, BDRAGSTART);
              triggerCustomEvent( origTarget, event,{type:BDRAGSTART,target:origTarget,bextra:bextra});  
            }
          }
          
          if(dragStarted) {
            var bextra = buildDragExtra(event, $origTarget, BDRAGMOVE);
            triggerCustomEvent( origTarget, event,{type:BDRAGMOVE,target:origTarget,bextra:bextra});
          }
        });
        
        // drag end
        $document.on(tapEvents.end + "." + uid, function(event){
          var bextra = buildDragExtra(event, $origTarget, BDRAGMOVE);
          triggerCustomEvent( origTarget, event,{type:BDRAGEND,target:origTarget,bextra:bextra});  
          $document.off("." + uid);
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



// bDrag & sDrop
(function($){
	var BDRAGSTART="bdragstart",BDRAGDRAG="bdrag",BDRAGEND="bdragend";
	
	var BDRAGENTER="bdragenter",BDRAGOVER="bdragover",BDRAGLEAVE="bdragleave",BDROP="bdrop";
	
	
    /**
     *
     * Options optional method implementation:
     *
     *
     */
    var mouseDragEvents = {
        start: "mousedown",
        drag: "mousemove",
        end: "mouseup"
    }
    
    var touchDragEvents = {
        start: "touchstart",
        drag: "touchmove",
        end: "touchend"
    }
    
    /**
     * Drag event for mouse and touch based user agents. 
     * 
     * This fires bdragstart, bdrag, and bdragend events on the dragged element, 
     * and bdragenter, bdragleave, bdrop on the "overElement" if the opts.draggable is set to true. If opts.draggable is omitted or false, then
     * only the events on the dragged element will be fired. 
     * 
     * See code sample at /test/test_brite.event.02.bDrag.html for more infor 
     *
     * @param {String} delegate [optional] if present, this will do a delegate (not implemented yet)
     * @param {Object}   opts [optional] options and handlers
     * @param {Boolean}  opts.draggable [default false] tell if the element is draggable
     * @param {String|Function}   opts.helper [default 'original'] if opts.draggable is true, this will determine the strategy for the drag helper. 
     *                               Can be 'clone' 'original' or a function
     * @param {Function} opts.start=function(event,dragExtra) [optional] will be called when the drag is initiated (map to the 'bdragstart' event)
     * @param {Function} opts.drag=function(event,dragExtra) [optional] will be called for every drag event (map to the 'bdrag' event)
     * @param {Function} opts.end=function(event,dragExtra) [optional] called on mouseUp or touch end (map to the 'bdragend' event)
     * @param {Number} dragExtra.pageX the current pageX 
     * @param {Number} dragExtra.pageY the current pageY 
     * @param {Number} dragExtra.startPageX the pageX from the drag start
     * @param {Number} dragExtra.startPageY the pageY from the drag start
     * @param {Number} dragExtra.deltaPageX the delta between the current pageX and the last one (from the previous drag event)
     * @param {Number} dragExtra.deltaPageY the delta between the current pageY and the last one (from the previous drag event)
     * @param {DOMElement} dragExtra.overElement this is for bdrag and bdragend event, and represent the over element (the drop over element) if the opts.draggable was set to true
     * @param {DOMElement} dragExtra.helperElement this is the element that is used for the drag effect. Could be the same as the draggable element, or a clone or custom element.
     */
    $.fn.bDrag = function(delegate, opts) {
      var options = opts || delegate;
      var delegate = (opts) ? delegate : null;
      var hasTouch = brite.ua.hasTouch();
  
      options = $.extend({}, $.fn.bDrag.defaults, options);
  
      var dragEvents = (hasTouch) ? touchDragEvents : mouseDragEvents;
  
      //for now, support the not delegatable way
      // iterate and process each matched element
      return this.each(function() {
        var $this = $(this);
        // jQuery object for this element
        if(delegate == null) {
          (options.start) ? $this.bind(BDRAGSTART, options.start) : null;
          (options.drag) ? $this.bind(BDRAGDRAG, options.drag) : null;
          (options.end) ? $this.bind(BDRAGEND, options.end) : null;
  
          $this.bind(dragEvents.start, function(e) {
            handleDragEvent.call(this, e, options);
          });
        } else {
  
          (options.start) ? $this.delegate(delegate, BDRAGSTART, options.start) : null;
          (options.drag) ? $this.delegate(delegate, BDRAGDRAG, options.drag) : null;
          (options.end) ? $this.delegate(delegate, BDRAGEND, options.end) : null;
  
          $this.delegate(delegate, dragEvents.start, function(e) {
            handleDragEvent.call(this, e, options);
          })
  
        }
      });
  
      // Handler the event
      // "this" of this function will be the element
      function handleDragEvent(e, options) {
        //var $this = $(this);
  
        var $elem = $(this);
  
        var $document = $(document);
        var id = "_" + brite.uuid(7);
  
        var dragStarted = false;
        var startEvent = e;
        var startPagePos = brite.event.eventPagePosition(startEvent);
  
        // create the $helper if it is a draggable event.
        var $helper;
  
        // so far, we prevent the default, otherwise, we see some text select which can be of a distracting
        e.preventDefault();
  
        // drag
        $document.bind(dragEvents.drag + "." + id, function(e) {
  
          // if the drag has not started, check if we need to start it
          if(!dragStarted) {
            var currentPagePos = brite.event.eventPagePosition(e);
  
            // if the diff > threshold, then, we start the drag
            if(Math.abs(startPagePos.pageX - currentPagePos.pageY) > options.threshold) {
              dragStarted = true;
              //create the bDragCtx
              $elem.data("bDragCtx", {});
  
              if(options.draggable === true) {
                if($.isFunction(options.helper)) {
                  $helper = $(options.helper.call($elem.get(0)));
                } else if(options.helper === "original") {
  
                  $helper = $elem;
                } else if(options.helper === "clone") {
                  $helper = $elem.clone();
                  // make sure to remove the DOMElement ID
                  $helper.attr("id", null);
                  $helper.css("position", "absolute");
                  var elemPos = $elem.offset();
                  $helper.css({
                    top : elemPos.top,
                    left : elemPos.left
                  })
                  //todo need to allow configurable helper parent (right now, it is the body)
                  $("body").append($helper);
                }
              }
              var dragStartExtra = buildDragExtra(startEvent, $elem, $helper, BDRAGSTART);
              $elem.trigger(BDRAGSTART, [dragStartExtra]);
            }
          }
  
          if(dragStarted) {
            var dragExtra = buildDragExtra(e, $elem, $helper, BDRAGDRAG);
  
            var overElem;
            if(options.draggable === true) {
              overElem = findOverElement($helper, dragExtra);
              dragExtra.overElement = overElem;
            }
  
            $elem.trigger(BDRAGDRAG, [dragExtra]);
  
            if(options.draggable === true) {
              moveElement($helper, dragExtra);
              var dropExtra = buildDropExtra($elem, $helper);
              triggerDropEventOnOverElement(BDRAGOVER, e, $elem, overElem, dropExtra);
            }
  
            // since we create "meta events" we consume this one
            e.preventDefault();
            e.stopPropagation();
          }
        });
  
        // drag end
        $document.bind(dragEvents.end + "." + id, function(e) {
          if(dragStarted) {
            var extra = buildDragExtra(e, $elem, $helper, BDRAGEND);
            var dropExtra;
  
            var overElem;
            if(options.draggable === true) {
              overElem = findOverElement($helper, extra);
              extra.overElement = overElem;
            }
  
            $elem.trigger(BDRAGEND, [extra]);
  
            // get the $overElem
            if(options.draggable === true) {
              moveElement($helper, extra);
              dropExtra = buildDropExtra($elem, $helper);
              triggerDropEventOnOverElement(BDROP, e, $elem, overElem, dropExtra);
  
              if(!$helper.is($elem)) {
                $helper.remove();
              }
            }
  
            // delete the dragContext
            $elem.data("bDragCtx", null);
  
            // since we create "meta events" we consume this one
            e.preventDefault();
            e.stopPropagation();
          }
  
          // unbind the document event
          $(document).unbind(dragEvents.drag + "." + id);
          $(document).unbind(dragEvents.end + "." + id);
  
        });
      }
  
    }

    
    
    function moveElement($elem,extra){
    	var boxPos = $elem.position();
		$elem.css({
			left:boxPos.left + extra.deltaPageX,
			top:boxPos.top + extra.deltaPageY
		});

    }
    
    /**
     * Trigger the drop event on the overElement
     */
    function triggerDropEventOnOverElement(eventType,event,$elem,overElem,dropExtra){
    	var $overElem = $(overElem);
    	
    	//get the prevOverElem and do the enter/leave
    	var bDragCtx = $elem.data("bDragCtx");
    	var prevOverElem = bDragCtx.overElem;
    	var bdragenterEvent, bdragleaveEvent;
    	// if there are no prevOverElem then, we enter the new one
    	if (typeof prevOverElem === "undefined" ){
    		bdragenterEvent = $.Event(event);
    		bdragenterEvent.target = overElem;
    		bdragenterEvent.type = BDRAGENTER;
    		$overElem.trigger(bdragenterEvent,dropExtra);
    	}
    	// if the new one and old one does not match, then, we need to leave the old elem and enter the new one
    	else if (prevOverElem != overElem){
    		//leave the old one
    		bdragleaveEvent = $.Event(event);
    		bdragleaveEvent.target = prevOverElem;
    		bdragleaveEvent.type = BDRAGLEAVE;
    		$(prevOverElem).trigger(bdragleaveEvent,dropExtra);
    		
    		//enter the new enter event
    		bdragenterEvent = $.Event(event);
    		bdragenterEvent.target = overElem;
    		bdragenterEvent.type = BDRAGENTER;
    		$overElem.trigger(bdragenterEvent,dropExtra);
    		
    	}
    	
    	bDragCtx.overElem = overElem;
		//create the event requested
		var bdragEvent = $.Event(event);
		bdragEvent.target = overElem;
		bdragEvent.type = eventType;
		$overElem.trigger(bdragEvent,dropExtra);    	
    }
    
    function findOverElement($elem,extra){
    	$elem.hide();
		var overElem = document.elementFromPoint(extra.pageX,extra.pageY);
		$elem.show();
		return overElem;
    }
	
	/**
	 * Build the extra event info for the drag event. 
	 */
	function buildDragExtra(event,$elem,$helper,dragType){
		brite.event.fixTouchEvent(event);
		var hasTouch = brite.ua.hasTouch();
		var extra = {
			eventSource: event,
			pageX: event.pageX,
			pageY: event.pageY			
		};
		
		if ($helper){
			extra.helperElement = $helper.get(0);
		}
		
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
		extra.deltaPageX = extra.pageX - bDragCtx.lastPageX;
		extra.deltaPageY = extra.pageY - bDragCtx.lastPageY;
		
		bDragCtx.lastPageX = extra.pageX;
		bDragCtx.lastPageY = extra.pageY;
		return extra;
	}
	
	/**
	 * Build the extra event info for the drop event
	 */
	function buildDropExtra($elem,$helper){
		var extra = {};
		extra.draggableElement = $elem.get(0);
		extra.helperElement = $helper.get(0);
		return extra;
	}
    
    $.fn.bDrag.defaults = {
    	draggable: false,
    	helper: 'original',
    	threshold: 5
    	
    }
})(jQuery);

