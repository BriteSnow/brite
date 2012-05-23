/**
 * Component: Draw
 * 
 * Responsibilities: 
 *   - Main Component for the Draw application
 *   - Create all the sub Draw components
 *   - Process all the action events
 *   - Maintain the current xmlDoc representing the layers
 * 
 * API: 
 *   - getXmlDoc(): Return the $XmlDoc for the layers
 *   
 * Events:
 *   Owner | Trigger | Process | Name                        | Arguments (for owners only)
 *     Y   |    Y    |    Y    | Draw_DO_DELETE_LAYER        | (layerId)
 *     Y   |    Y    |         | Draw_DO_SET_TOOL            | (toolName)
 *     Y   |    N    |    Y    | Draw_DO_SELECT_LAYER        | (layerId)
 *     Y   |    Y    |   n/a   | Draw_LAYER_SELECT_CHANGE    | (layerId)
 *     Y   |    Y    |   n/a   | Draw_XML_DOC_LAYERS_CHANGE  |
 * 
 *   - Draw_XML_DOC_LAYERS_CHANGE: is fired when anything in the xmldoc has changed
 *     TODO: probably need to make it more granular to allow better optimization 
 *           (e.g., the DrawLayersPanel should not have to refresh all the layers on existing layer modification)
 * 
 */
;(function(){
  
  // --------- Component Interface Implementation ---------- //
  function Draw(){
    var c = this;
    // current selected layer (null if none)
    c.currentLayerIdx = null;
    // the xmlDoc
    c.$xmlDoc = null;
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
          c.$element.trigger("Draw_LAYER_SELECT_CHANGE",0);
          c.$element.trigger("Draw_DO_SET_TOOL","select");
        },100);
      });
    });
    
    initSaveHandler.call(c);
    
    initShortcutsHandler.call(c);
    
    
    // --------- Process the Action Events --------- //
    // process Draw_DO_SET_TOOL event
    c.$element.on("Draw_DO_SET_TOOL",function(event,tool){
       changeTool.call(c,tool);  
    });
    
    // process the Draw_DO_SELECT_LAYER
    c.$element.on("Draw_DO_SELECT_LAYER",function(event,layerId){
      console.log("Draw DO_SELECT_LAYER: " + layerId + " " + c.$xmlDoc.children().eq(layerId).attr("name"));
      c.$element.trigger("Draw_LAYER_SELECT_CHANGE",layerId);
    });

    // process the DO delete layer event
    c.$element.on("Draw_DO_DELETE_LAYER", function(event,layeridx){
      if (typeof layeridx === "undefined"){
        layeridx = c.currentLayerIdx;
      }
      console.log("do delete: " + layeridx);
      if (layeridx > -1){
        c.$xmlDoc.find("layer").eq(layeridx).remove();
        c.$element.trigger("Draw_XML_DOC_LAYERS_CHANGE");
        refreshContent.call(c);
        if (layeridx > 1){
          c.$element.trigger("Draw_LAYER_SELECT_CHANGE",layeridx - 1);
        }
      }
    });
    // --------- /Process the Action Events --------- // 
    
    // handle the layer select change
    c.$element.on("Draw_LAYER_SELECT_CHANGE",function(event,layerIdx){
      c.currentLayerIdx = layerIdx;
      if (!c._drawing){
        changeTool.call(c);
      }
    });
    
    
    // Prevent browser hot keys overlap
    $(window).on("keydown." + c.cid,function(event){
      
      if (event.which === 65 && event.metaKey){
        event.stopPropagation();
        event.preventDefault();
      }
      
      // prevent the delete key for back page
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
    c.currentTool = newTool || c.currentTool || "select";
    toolHandlers[c.currentTool].init.call(c);       
  }
  
  function getSelectedLayer(){
    var c = this;
    var layerIdx = c.currentLayerIdx || 0;
    var $layer = c.$xmlDoc.find("layer").eq(layerIdx);
    return $layer;
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
      // 'v' to select
      if (event.which === 86){
        c.$element.trigger("Draw_DO_SET_TOOL","select");
      }
      
      // 'p' to pen
      else if (event.which === 80){
        c.$element.trigger("Draw_DO_SET_TOOL","pen");
      }
      
      // 'c' to circle
      else if (event.which === 67){
        c.$element.trigger("Draw_DO_SET_TOOL","circle");
      }
      
      // 's' to square (83)
      else if (event.which === 83){
          c.$element.trigger("Draw_DO_SET_TOOL","square");
      }
    });
  }
  
  function refreshContent(){
    c = this;
    //console.log("refreshContent");
    //c.drawContent.draw(c.$xmlDoc);
    c.$element.trigger("Draw_XML_DOC_LAYERS_CHANGE");
  }
  
  // --------- /Component Private Methods --------- //  
  
  // --------- Component Registration --------- //
  brite.registerComponent("Draw", null,
  function() {
    return new Draw();
  });
  // --------- Component Registration --------- //  
  
  
 
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
  
  // --------- Select ToolHandler --------- //
  var currentSelectNodeType;
  // select tool logic
  toolHandlers.select = {
    init: function(){
      var c = this; // this is the Draw component
      
      var $layer = getSelectedLayer.call(c);
      
      var $selectLayer = $("<div class='Draw-selectLayer'></div>");
      // we hide it when we build the content (to avoid flickers)
      $selectLayer.css("opacity",0);
      c.drawContent.$element.append($selectLayer);
      
      
      var $node = $layer.children(":first");
      var nodeType = $node[0].tagName;
      
      if (currentSelectNodeType){
        selectHandlers[currentSelectNodeType].destroy();
      }
      
      // init the nodeTypeHandler
      currentSelectNodeType = nodeType;
      
      if (selectHandlers[nodeType]){
        selectHandlers[nodeType].init(c,$selectLayer,$node);
      }else{
        console.log("error no selectHandlers for nodeType: " + nodeType);  
      }
      
    },
    
    destroy: function(){
      // destroy the nodeTypehandler
      if (currentSelectNodeType){
        selectHandlers[currentSelectNodeType].destroy();
      }
      // remove the selectLayer
      c.drawContent.$element.find(".Draw-selectLayer").remove();
      $(document).off(".tool_select");
    }
    
  }
  
  
  var selectHandlers = {
    
    path: {
      init: function(c,$selectLayer, $path){
        
        // calculate the offsets for the selectPoint div
        var $tmp = $("<div class='Draw-selectPoint'></div>");
        $selectLayer.append($tmp);
        var xOffset =  $tmp.width() / 2;
        var yOffset =  $tmp.height() / 2;
        $tmp.remove();
        
        if ($path.length > 0){
          // add teh select points
          $path.children().each(function(){
            var $p = $(this);
            var $selectPoint = $("<div class='Draw-selectPoint'></div>");
            $selectPoint.data("$p",$p);
            $selectLayer.append($selectPoint);
            var top = ($p.attr("y") - yOffset) + "px";
            var left = ($p.attr("x") - xOffset) + "px";
            $selectPoint.css({top: top,left: left});
          });
        }
              
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
        $(document).on("keydown.tool_select",function(event){
          if (event.which === 65 && (event.metaKey)){
            $selectLayer.find(".Draw-selectPoint").addClass("sel");
          }
        });      
        // --------- /Select selectPoint --------- //
        
        
        // --------- Deleting selectPoint --------- //
        $(document).on("keydown.tool_select",function(event){
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
      }, // /selectHandlers.path.init
      
      destroy: function($selectLayer){
        $(document).off(".tool_select");
      }
    },
    
    circle: {
      
      init: function(c,$selectLayer,$circle){
        
        // calculate the offsets for the selectPoint div
        var $tmp = $("<div class='Draw-selectPoint'></div>");
        $selectLayer.append($tmp);
        var xOffset =  $tmp.width() / 2;
        var yOffset =  $tmp.height() / 2;
        $tmp.remove();
        
        // show the select box
        var $selectBox = $("<div class='Draw-selectBox'></div>");
        var r = $circle.attr("r") * 1;
        var top =  1 * $circle.attr("y") - r;
        var left = 1 * $circle.attr("x") - r;
        $selectBox.css({top:top + "px", left:left + "px", width: (2 * r) + "px", height: (2 * r) + "px"});
        $selectLayer.append($selectBox);
        
        var $bottomRightPoint = $("<div class='Draw-selectPoint'></div>");
        $bottomRightPoint.css({right: - xOffset, bottom: - yOffset});
        $selectBox.append($bottomRightPoint);                   
        
        var dontdragmove = false; 
        var orgRadius;
        $bottomRightPoint.on("bdragmove",function(event){
          dontdragmove = true;
          orgRadius = orgRadius || 1 * $circle.attr("r");
          var x = 1 * $circle.attr("x");
          var y = 1 * $circle.attr("y");
          var delta = Math.max(event.pageX - event.bextra.startPageX, event.pageY - event.bextra.startPageY);
          var r = orgRadius + (delta);
          var top =  y - r;
          var left = x - r;
          $selectBox.css({top:top + "px", left:left + "px", width: (2 * r) + "px", height: (2 * r) + "px"});          
          $circle.attr("r",r);
          
          refreshContent.call(c);
        });
        
        $bottomRightPoint.on("bdragend",function(event){
          orgRadius = null;
          dontdragmove = false;
        });
        
        // we show the select layers
        $selectLayer.css("opacity",1);
        
        $selectLayer.on("bdragmove",function(event){
          if (!dontdragmove){
            var bextra = event.bextra;
            var r = $circle.attr("r") * 1;
            var x = 1 * $circle.attr("x");
            var y = 1 * $circle.attr("y");
            x = x + bextra.deltaX;
            y = y + bextra.deltaY;
            $circle.attr("x",x).attr("y",y);
            var top = y - r, left = x - r;
            $selectBox.css({top:top + "px", left:left + "px"});
            
            refreshContent.call(c);
          }
        });
      }, 
      
      destroy: function(){
        
      }
      
    },
    
    square: {
      init:  function(c,$selectLayer,$circle){
        // TODO
      },
      
      destroy: function(){
      }
    }
    
  }
  // --------- /Select ToolHandler --------- //
  
  // --------- Pen ToolHandler --------- //
  // pen tool logic
  toolHandlers.pen = {
    init: function(){
      var c = this;
      
      var $penLayer = $("<div class='Draw-penLayer'></div>");
      c.drawContent.$element.append($penLayer);      
      
      var $layer = getSelectedLayer.call(c);
      var $path = $layer.find("path:first");
         
      // handle the draw event
      $penLayer.on("btap.tool_pen",function(event){
        var $content = $(this);
        
        
        if ($path.length > 0){
          var $p = $(document.createElementNS(null,"p"));
          
          var contentOffset = $content.offset();
          var x = event.pageX - contentOffset.left;
          var y = event.pageY - contentOffset.top;         
          $p.attr("x",x).attr("y",y);
          
          $path.append($p);
          
          refreshContent.call(c);
        }
        
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
  // --------- /Pen ToolHandler --------- //
  
  
  // --------- Circle ToolHandler --------- //
  // circle tool logic
  toolHandlers.circle = {
    init: function(){
      var c = this;
      
      var $circleLayer = $("<div class='Draw-circleLayer'></div>");
      c.drawContent.$element.append($circleLayer);      
      
      var $layers = getSelectedLayer.call(c).parent();
      
      var $circle;
      $circleLayer.on("bdragmove",function(event){
          
          c._drawing = true;
          if (!$circle){
            $circle = $(document.createElementNS(null,"circle"));
            var $layer = $(document.createElementNS(null,"layer"));
            $layer.append($circle);
            $layers.append($layer);
            // select this layer
            c.$element.trigger("Draw_XML_DOC_LAYERS_CHANGE");
            c.$element.trigger("Draw_LAYER_SELECT_CHANGE",$layers.find("layer").length - 1 );
          }
          
          var contentOffset = $circleLayer.offset();
          var r = Math.min(event.pageX - event.bextra.startPageX,event.pageY - event.bextra.startPageY);
          var x = event.bextra.startPageX - contentOffset.left; 
          var y = event.bextra.startPageY - contentOffset.top;  
          $circle.attr("x",x).attr("y",y).attr("r",r);
          refreshContent.call(c);
      });
      
      $circleLayer.on("bdragend",function(){
        $circle = null;
        c._drawing = false;
      });
      
      $(document).on("keydown.tool_circle",function(event){
        if (event.which == '8' && !event.metaKey){
          c.$element.trigger("Draw_DO_DELETE_LAYER");
        }
      });

    },
    
    destroy: function(){
      var c = this;
      c.$element.off(".tool_circle");
      $(document).off(".tool_circle");
      c.drawContent.$element.find(".Draw-circleLayer").remove();
    }
    
  }  
  // --------- /Circle ToolHandler --------- //


  // --------- Square ToolHandler --------- //
  // square tool logic
  toolHandlers.square = {
    init: function(){
      var c = this;

      var $squareLayer = $("<div class='Draw-squareLayer'></div>");
      c.drawContent.$element.append($squareLayer);

      var $layers = getSelectedLayer.call(c).parent();

      var square;
        $squareLayer.on("bdragmove",function(event){

          c._drawing = true;
          if (!square){
            square = $(document.createElementNS(null,"square"));
            var $layer = $(document.createElementNS(null,"layer"));
            $layer.append(square);
            $layers.append($layer);
            // select this layer
            c.$element.trigger("Draw_XML_DOC_LAYERS_CHANGE");
            c.$element.trigger("Draw_LAYER_SELECT_CHANGE",$layers.find("layer").length - 1 );
          }

          var contentOffset = $squareLayer.offset();
          var w = event.pageX - event.bextra.startPageX;
          var h = event.pageY - event.bextra.startPageY;
          var x = event.bextra.startPageX - contentOffset.left;
          var y = event.bextra.startPageY - contentOffset.top;
          square.attr("x",x).attr("y",y).attr("w",w).attr("h",h);
          refreshContent.call(c);
      });

        $squareLayer.on("bdragend", function () {
            square = null;
            c._drawing = false;
        });

      $(document).on("keydown.tool_square",function(event){
        if (event.which == '8' && !event.metaKey){
          c.$element.trigger("Draw_DO_DELETE_LAYER");
        }
      });

    },

    destroy: function(){
      var c = this;
      c.$element.off(".tool_square");
      $(document).off(".tool_square");
      c.drawContent.$element.find(".Draw-squareLayer").remove();
    }

  };
  // --------- /Rect ToolHandler --------- //
  
})();