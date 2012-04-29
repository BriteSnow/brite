;(function(){
  
  // --------- Component Interface Implementation ---------- //
  function Draw(){
    
  }
  
  Draw.prototype.create = function(data, config){
    var html = $("#tmpl-Draw").render({apps:demo.apps});
    return $(html);
  }
  
  Draw.prototype.postDisplay = function(){
    var c = this;
    
    brite.display("DrawToolbar",null,{parent:c.$element});
    
    brite.display("DrawSide",null,{parent:c.$element}).done(function(drawSide){
      c.drawSide = drawSide;
    });
    
    // temporary for development
    brite.display("DrawContent",null,{parent:c.$element}).done(function(drawContent){
      c.drawContent = drawContent;
      
      $.ajax({url:"data/draw-sample.xml",
              dataType: "text"}).done(function(result){
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(result,"text/xml");
        c.$xmlDoc = $(xmlDoc.firstChild);
        refreshContent.call(c);       
        
           // init the default states
          // Note: there we do it in a timeout for simplicity (99% reliability), however, it could be 
          //       done with the component init and "whenInit" for 100% reliability
          setTimeout(function(){
            c.$element.trigger(demo.draw.event.LAYER_SELECT_CHANGE,0);
            c.$element.trigger(demo.draw.event.SET_TOOL,"pointer");
          },100);
      });
    });
    
    initSaveHandler.call(c);
    
    initShortcutsHandler.call(c);
    
    // process SET_TOOL event
    c.$element.on(demo.draw.event.SET_TOOL,function(event,tool){
       changeTool.call(c,tool);  
    });

    
    // handle the layer select change
    c.$element.on(demo.draw.event.LAYER_SELECT_CHANGE,function(event,layerIdx){
      c.currentLayerIdx = layerIdx;
      changeTool.call(c);
    });
    
    
    // Prevent browser hot keys overlap
    $(window).on("keydown." + c.cid,function(event){
      
      if (event.which === 65 && event.metaKey){
        event.stopPropagation();
        event.preventDefault();
      }
      if (event.which == '8' && !event.metaKey && !event.shiftKey){
        event.stopPropagation();
        event.preventDefault();
      }
    });
    
    
    
  } // /Draw.prototype.postDisplay
  
  Draw.prototype.destroy = function(){
    $(document).off("." + this.cid);
    $(window).off("." + this.cid);
    if (c.currentTool){
      toolHandlers[c.currentTool].destroy.call(c);
    }    
  }
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Public API --------- //
  Draw.prototype.getXmlDoc = function(){
    var c = this;
    return c.$xmlDoc;
  }
  // --------- /Component Public API --------- //
  
  // --------- Component Private Methods --------- //
  
  function changeTool(newTool){
    var c = this;
    // destroy the eventual previous tool
    if (c.currentTool){
      toolHandlers[c.currentTool].destroy.call(c);
    } 
    
    // init the current tool (allow refresh)
    c.currentTool = newTool || c.currentTool || "pointer";
    toolHandlers[c.currentTool].init.call(c);       
  }
  
  function getSelectedLayer(){
    var c = this;
    var layerIdx = c.currentLayerIdx || 0;
    var $layer = c.$xmlDoc.find("layer").eq(layerIdx);
    return $layer.children().eq(0);
  }
  
  function initSaveHandler(){
    var c = this;
    
    // Note: no need to namespace this event since it is bound to this component element 
    c.$element.on("btap","[data-action='save']",function(){
      var canvas = c.drawContent.getCanvas();
      
      canvas.toBlob(function(blob) {
        
        var $a = $("<a></a>");
        var a = $a[0];
        a.download = "someCustomName.png";
        var URL = window.URL || window.webkitURL;
        a.href = URL.createObjectURL(blob);
        
        // trigger the event;
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
          "click", true, false, window, 0, 0, 0, 0, 0
          , false, false, false, false, 0, null
        );
        a.dispatchEvent(event);
        
        
      }, "image/png");   
       
    });
    
  }  
  
  
  function initShortcutsHandler(){
    var c = this;
    
    // Note: here we need to namespace it to make sure it get cleaned up by the Draw.prototype.destroy
    $(document).on("keydown." + c.cid,function(event){
      // 'v' to pointer
      if (event.which === 86){
        c.$element.trigger(demo.draw.event.SET_TOOL,"pointer");
      }
      
      // 'p' to pen
      else if (event.which === 80){
        c.$element.trigger(demo.draw.event.SET_TOOL,"pen");
      }
    });
  }
  
  function refreshContent(){
    c = this;
    
    c.drawContent.draw(c.$xmlDoc);
  }
  
  // --------- /Component Private Methods --------- //  
  
  // --------- Component Events --------- //
  demo.draw = {event:{}};
  
  // Fired when a new tool is selected
  // arguments: tool (the name-id of the tool)
  demo.draw.event.SET_TOOL = "DRAW-SET_TOOL"; // to set a tool
  
  // Fired when the xmlDoc change
  // arguments: $node (the jquery xml node that has changed)
  demo.draw.event.XML_DOC_CHANGE = "DRAW-XML_DOC_CHANGE"; // on XML doc change (param is
    
  // Fired when a layer section change   
  // arguments: layeridx (the index of the layer that had changed)
  demo.draw.event.LAYER_SELECT_CHANGE = "DRAW-LAYER_SELECT_CHANGE"; // on XML doc change
  
  // --------- /Component Events --------- //  
  
  // --------- Component Registration --------- //
  brite.registerComponent("Draw", null,
  function() {
    return new Draw();
  });
  // --------- Component Registration --------- //  
  
  
  // --------- ToolHandlers --------- //
  /*
   * ToolHandlers are handler called when a specific tool has been selected.
   * All their methods are called in the Draw context (so, the "this" is the "draw" component).
   *  
   * Their responsibility is to: 
   * 
   * - init: this will be called when a tool (via the toolbar or via the keyboard shortcut)
   * - destroy: this will be called when annother tool is selected   
   */
  var toolHandlers = {};
  
  // pointer tool logic
  toolHandlers.pointer = {
    init: function(){
      var c = this; // this is the Draw component
      
      var $layer = getSelectedLayer.call(c);
      
      var $selectLayer = $("<div class='Draw-selectLayer'></div>");
      // we hide it when we build the content (to avoid flickers)
      $selectLayer.css("opacity",0);
      c.drawContent.$element.append($selectLayer);
      
      // calculate the offsets for the selectPoin t box
      var $tmp = $("<div class='Draw-selectPoint'></div>");
      $selectLayer.append($tmp);
      var xOffset =  $tmp.width() / 2;
      var yOffset =  $tmp.height() / 2;
      $tmp.remove();
      
      // add teh select points
      $layer.children().each(function(){
        var $p = $(this);
        var $selectPoint = $("<div class='Draw-selectPoint'></div>");
        $selectPoint.data("$p",$p);
        $selectLayer.append($selectPoint);
        var top = ($p.attr("y") - yOffset) + "px";
        var left = ($p.attr("x") - xOffset) + "px";
        $selectPoint.css({top: top,left: left});
      });
      
      // we show the select layers
      $selectLayer.css("opacity",1);
      
      
      $selectLayer.on("btap",function(event){
        if (!$(event.target).is(".Draw-selectPoint")){
          $selectLayer.find(".Draw-selectPoint").removeClass("sel");
        }
      });
      // --------- Select selectPoint --------- //
      // select by tapping
      $selectLayer.on("btap",".Draw-selectPoint",function(event){
        var $selectPoint = $(this);
        // if shift or meta key are on, then, we do not remove the other selection
        $selectPoint.toggleClass("sel");  
      });
      
      // select all with meta key
      $(document).on("keydown.tool_pointer",function(event){
        if (event.which === 65 && (event.metaKey)){
          $selectLayer.find(".Draw-selectPoint").addClass("sel");
        }
      });      
      // --------- /Select selectPoint --------- //
      
      
      // --------- Deleting selectPoint --------- //
      $(document).on("keydown.tool_pointer",function(event){
        if (event.which === 8){
          $selectLayer.find(".Draw-selectPoint.sel").each(function(){
            var $selectPoint = $(this);
            var $p = $selectPoint.data("$p");
            $p.remove();
            $selectPoint.remove();
          });
          
          refreshContent.call(c);           
        }
      });
      // --------- /Deleting selectPoint --------- //
      
      // --------- Moving selectPoint --------- //
      // make sure the selected point is selected
      $selectLayer.on("bdragstart",".Draw-selectPoint",function(event){
        var $selectPoint = $(this);
        $selectPoint.addClass("sel");  
      });
      
      // bind the drag events
      $selectLayer.on("bdragmove",handleMove);
      
      function handleMove(event){
        var bextra = event.bextra;
        $selectLayer.find(".Draw-selectPoint.sel").each(function(){
          var $selectPoint = $(this);
          var pos = $selectPoint.position();
          $selectPoint.css({top: pos.top + bextra.deltaY,left: pos.left + bextra.deltaX});
          var $p = $selectPoint.data("$p");
          var x = ($p.attr("x") * 1) + bextra.deltaX;
          var y = ($p.attr("y") * 1) + bextra.deltaY;
          $p.attr("x",x).attr("y",y);          
        });
        
        refreshContent.call(c);        
      }
      // --------- /Moving selectPoint --------- //
    },
    
    destroy: function(){
      // remove the selectLayer
      c.drawContent.$element.find(".Draw-selectLayer").remove();
      $(document).off(".tool_pointer");
    }
    
  }
  
  // pen tool logic
  toolHandlers.pen = {
    init: function(){
      var c = this;
      
      var $penLayer = $("<div class='Draw-penLayer'></div>");
      c.drawContent.$element.append($penLayer);      
       
      // handle the draw event
      $penLayer.on("btap.tool_pen",function(event){
        var $content = $(this);
        
        var $path = getSelectedLayer.call(c);
        var $p = $("<p></p>");
        
        var contentOffset = $content.offset();
        var x = event.pageX - contentOffset.left;
        var y = event.pageY - contentOffset.top;         
        $p.attr("x",x).attr("y",y);
        
        $path.append($p);
        
        c.drawContent.draw(c.$xmlDoc);
        
      });    
      
      // key binding
      $(document).on("keyup.tool_pen",function(event){
        // Delete the last none
        if (event.which == '8'){
          var $path = getSelectedLayer.call(c);
          $path.find("p:last").remove();
          refreshContent.call(c);
        }
      });       
    },
    
    destroy: function(){
      var c = this;
      c.$element.off(".tool_pen");
      $(document).off(".tool_pen");
      c.drawContent.$element.find(".Draw-penLayer").remove();
    }
    
  }  
  // --------- /ToolHandlers --------- //
  
  
})();