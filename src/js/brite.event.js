var brite = brite || {};

/**
 * @namespace brite.event convenient touch/mouse event helpers.
 */
brite.event = brite.event || {};

// ------ brite event helpers ------ //
(function($){
	/**
	 * if it is a touch device, populate the event.pageX and event.page& from the event.touches[0].pageX/Y
	 * @param {jQuery Event} e the jquery event object 
	 */
	brite.event.fixTouchEvent = function(e){
			if (brite.ua.hasTouch()) {
					var oe = e.originalEvent;
					if (oe.touches.length > 0) {
							e.pageX = oe.touches[0].pageX;
							e.pageY = oe.touches[0].pageY;
					}
			}
			
			return e;
	};
		
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
		};
	};

})(jQuery);
// ------ /brite event helpers ------ //

// ------ transition helper ------ //
;(function($){
	
	/**
	 * simple and convenient methods to perform css3 animations (takes care of the css prefix)
	 * opts.transition: this will be the transition value added as css style (e.g.,: "all 0.3s ease;")
	 * opts.transform: the css transform instruction (e.g.,: "scale(.01)")
	 * opts.onTimeout: (optional, default false). If true or >= 0, then the transformation will be performed on timeout)  
	 */
	
	$.fn.bTransition = function(opts) {
		
		return this.each(function() {
			var $this = $(this);
			var timeout = -1;
			if (typeof opts.onTimeout === "boolean"){
				timeout = (opts.onTimeout)?0:-1;
			}else if (typeof opts.onTimeout === "number"){
				timeout = opts.onTimeout;
			}
			if (timeout > -1){
				setTimeout(function(){
					performTransition($this,opts);
				},timeout);
			}else{
				performTransition($this,opts);
			} 
			// add the transition
		});
	};
	
	// helper function
	function performTransition($this,opts){
		$this.css("transition",opts.transition);
		$this.css("transform",opts.transform);
	}
})(jQuery);  
// ------ /transition helper ------ //

// ------ /brite special events ------ //
(function($){
	
	// to prevent other events (i.e., btap) to trigger when dragging.
	var _dragging = false;
	
	var mouseEvents = {
			start: "mousedown",
			move: "mousemove",
			end: "mouseup"
	};

	var touchEvents = {
			start: "touchstart",
			move: "touchmove",
			end: "touchend"
	};
	
	 

	function getTapEvents(){
		if (brite.ua.hasTouch()){
			return touchEvents;
		}else{
			return mouseEvents;
		}
	}  
	
	// --------- btap & btaphold --------- //
	$.event.special.btap = {
		add: btabAddHandler
	}; 
	
	$.event.special.btaphold = {
		add: btabAddHandler
	}; 
	
	function btabAddHandler(handleObj) {

		var tapEvents = getTapEvents();

		$(this).on(tapEvents.start, handleObj.selector, function(event) {
			var elem = this;
			var $elem = $(elem);
			
			var origTarget = event.target, startEvent = event, timer;
			
			function handleEnd(event){
				clearAll();
				if (event.target === origTarget && !_dragging){
					// use event.eventPhase because we should ignore bubbling event when triggering this meta event
					var ep = event.eventPhase;
					var pass = (elem === origTarget && ep === 2) || (elem !== origTarget && ep === 3);
					if (pass && !event.originalEvent.b_processed){
						// we take the pageX and pageY of the start event (because in touch, touchend does not have pageX and pageY)
						brite.event.fixTouchEvent(startEvent);
						triggerCustomEvent(elem, event,{type:"btap",pageX: startEvent.pageX,pageY: startEvent.pageY});
						// flag this originalEvent as processed
						// Note: this allow to prevent multiple triggering without having to use the stopPropagation which will be too
						//       destructive for other event handlers
						event.originalEvent.b_processed = true;
					}
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


	linkSpecialEventsTo(["btaphold"],"btap");
	
	// --------- /btap & btaphold --------- //
	
	
	// --------- bdrag* --------- //
	var BDRAGSTART="bdragstart",BDRAGMOVE="bdragmove",BDRAGEND="bdragend";
	
	// Note: those below are part of the drop events, but are not supported yet.
	//       Need to think some more.
	var BDRAGENTER="bdragenter",BDRAGOVER="bdragover",BDRAGLEAVE="bdragleave",BDROP="bdrop";
	
	var dragThreshold = 5;
	

	$.event.special[BDRAGSTART] = {
		add : bdragAddHandler
	};

	$.event.special[BDRAGMOVE] = {
		add : bdragAddHandler
	};

	$.event.special[BDRAGEND] = {
		add : bdragAddHandler
	};
	
	function bdragAddHandler(handleObj) {
		
		var tapEvents = getTapEvents();

		$(this).on(tapEvents.start, handleObj.selector, function(event) {
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
				var bextra;
				var currentPagePos = brite.event.eventPagePosition(event);
				// fix a bug on Chrome that always change the cursor to text
				$("body").css("-webkit-user-select","none");
				
				if (!dragStarted){
					if(Math.abs(startPagePos.pageX - currentPagePos.pageX) > dragThreshold || Math.abs(startPagePos.pageY - currentPagePos.pageY) > dragThreshold) {
						dragStarted = true;
						_dragging = true;
						$origTarget.data("bDragCtx", {});
						bextra = buildDragExtra(event, $origTarget, BDRAGSTART);
						triggerCustomEvent( origTarget, event,{type:BDRAGSTART,target:origTarget,bextra:bextra});  
						
						event.stopPropagation();
						event.preventDefault();
						
					}
				}
				
				if(dragStarted) {
					bextra = buildDragExtra(event, $origTarget, BDRAGMOVE);
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
	// Note: even if jQuery 1.8 add the prefix, it still does not normalize the transitionend event.
	$.event.special.btransitionend = {

		setup : function(data, namespaces) {
			var eventListener = "transitionend";
			if (this.addEventListener){
				if (!brite.ua.browser.mozilla){
					eventListener = brite.ua.cssVarPrefix().toLowerCase() + "TransitionEnd";
				}
				this.addEventListener(eventListener,function(event){
					triggerCustomEvent(this,event,{type:"btransitionend"});
				});
				
			}else{
				// old browser, just trigger the event since transition should not be supported anyway
				triggerCustomEvent(this,jQuery.Event("btransitionend"),{type:"btransitionend"});
			}
		 

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
// ------ /brite special events ------ //
