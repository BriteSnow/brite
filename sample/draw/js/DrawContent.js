/**
 * Component: DrawContent
 * 
 * Responsibilities: 
 *   - Create a canvas that draws 
 *   - Manage the content controls layers for selection, move and such. 
 * 
 * Public APIs: 
 *   - getCanvas(): TODO: probably need to remove this. Should not be needed. 
 *  
 * Events: 
 *   none
 * 
 * Other Events:
 *  - Draw_XML_DOC_LAYERS_CHANGE: Listen to this event to refresh the content 
 *   
 */
;(function(){
  
  // --------- Component Interface Implementation ---------- //
  function DrawContent(){
    
    // array of {layerId:Number,gtx:gtx} for each layer with their hotZone. 
    // Note: this will get deleted on redraw, and rebuilt on first click
    this._cacheHotzoneCanvasList = null;
  }
  
  DrawContent.prototype.create = function(data, config){
    return $("#tmpl-" + this.name).render({});
  }
  
  DrawContent.prototype.postDisplay = function(){
    var c = this;
    
    //console.log("webkitRequestAnimationFrame: " + window.webkitRequestAnimationFrame);
    c.gtx = brite.gtx(c.$element.find("canvas"));
    
    var draw = c.$element.bComponent("Draw");
    
    // Refresh on xml layers change
    if (draw){
      draw.$element.on("Draw_XML_DOC_LAYERS_CHANGE." + c.cid,function(){
        drawLayers.call(c);
      });
    }else{
      throw new "DrawContent cannot find Draw parent";
    } 

    // Refresh on resize of parent
    c.$element.closest(".trigger-element_resize").on("element_resized." + c.cid,function(){
      drawLayers.call(c);
    });
    
    // tap to select item
    c.$element.on("btap",function(event){
      
      var enable = ($(event.target).closest(".Draw-selectPoint").length === 0); 
      
      if (enable){
        // compute the position relative to this location
        var pos = brite.substract({top:event.pageY,left:event.pageX},c.$element.offset());
        canvasList = getHotzoneCanvasList.call(c);
        var selectedLayerIdx = -1;
        var minDim = 100000; // this will allow to select the smaller click object
        $.each(canvasList,function(idx,item){
          if (item.gtx.context.isPointInPath(pos.left,pos.top)){
            var node = item.$layer.children()[0];
            
            var shapeDimFunc = shapeDims[node.nodeName];
            var shapeDim = shapeDimFunc(node);
            var dim = shapeDim.width + shapeDim.height;
            if (dim < minDim){
              selectedLayerIdx = idx;
              minDim = dim;
            }
          }
        });
        
        if (selectedLayerIdx > -1){
          c.$element.trigger("Draw_DO_SELECT_LAYER",selectedLayerIdx);
        }
      }
    });
  }
  
  DrawContent.prototype.destroy = function(){
    var c = this;
    c.$element.bComponent("Draw").$element.off("." + c.cid);
    
    c.$element.closest(".trigger-element_resize").off("." + c.cid);
  }
  
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Public API --------- //
  DrawContent.prototype.getCanvas = function(){
    var c = this;
    return c.$element.find("canvas")[0];
  }
  // --------- /Component Public API --------- //
  
  // --------- Private Methods --------- //
  function drawLayers(){
    var c = this; 
    
    // clear the eventual this._cacheHotzoneCanvasList
    delete c._cacheHotzoneCanvasList;
    
    var $xmlDoc = getXmlDoc.call(c); 
    
    var g = c.gtx;
    g.fitParent();
    g.clear();
    
    $xmlDoc.children().each(function(idx,layer){
      var $layer = $(this);
      $layer.children().each(function(idx,node){
        var renderer = renderers[node.nodeName];
        renderer(g,node);
      });
    });
    
    brite.flushUI();
  }
  
  // return the $xmlDoc from the parent Draw component
  function getXmlDoc(){
    var c = this;
    var draw = c.$element.bComponent("Draw");
    var $xmlDoc = draw.getXmlDoc();
    
    return $xmlDoc;   
  }
  
  function getHotzoneCanvasList(){
    var c = this;
    
    if (!c._cacheHotzoneCanvasList){
      c._cacheHotzoneCanvasList = [];
      var $xmlDoc = getXmlDoc.call(c);
      
      $xmlDoc.children().each(function(idx,layer){
        var item = {layerId:idx};
        c._cacheHotzoneCanvasList.push(item);
        var $layer = $(this);
        var $canvas = $("<canvas></canvas>");
        var g = brite.gtx($canvas);
        item.gtx = g;
        item.$layer = $layer;
        $layer.children().each(function(idx,node){
          var renderer = renderers[node.nodeName];
          renderer(g,node);
        });
      });      
    }
    
    return c._cacheHotzoneCanvasList;
  }
  // --------- /Private Methods --------- //  
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("DrawContent", null,
  function() {
    return new DrawContent();
  });
  // --------- Component Registration --------- //  
  
  
  
  // --------- Renderers --------- //
  var renderers = {
    
    path: function(g,node,hotzone){
      g.beginPath().strokeStyle("rgba(50, 50, 50, 0.3)").lineWidth(20);
      $(node).children().each(function(idx,node){
        var $node = $(node);
        if (idx === 0){
          g.moveTo($node.attr("x"),$node.attr("y"));
        }else{
          g.lineTo($node.attr("x"),$node.attr("y"));
        }
      });
      g.stroke();
    },
    
    circle: function(g,node,hotzone){
      g.beginPath().strokeStyle("rgba(200, 50, 50, 0.3)").lineWidth(2);
      var $node = $(node);
      g.arc($node.attr("x"),$node.attr("y"),$node.attr("r"),0,Math.PI*2,true).stroke();
    },

    square: function(g,node,hotzone){
      g.beginPath().strokeStyle("rgba(200, 50, 50, 0.3)").lineWidth(2);
      var $node = $(node);
      g.rect($node.attr("x"),$node.attr("y"),$node.attr("w"),$node.attr("h")).stroke();
    }
  }
  // --------- /Renderers --------- //
  
  // --------- Shape Dim --------- //
  // for each xml node, return the .width and .height of the given shape
  var shapeDims = {
    
    // for now, support only the first node
    path: function(node){
      var r = {};
      var $node = $(node);
      var minX = 10000 , maxX = 0, minY = 10000, maxY = 0;
      $(node).children().each(function(idx,p){
        var $p = $(p);
        var x = $p.attr("x") * 1;
        var y = $p.attr("y") * 1;
        minX = Math.min(minX,x);
        maxX = Math.min(maxX,x);
        minY = Math.min(minY,y);
        maxY = Math.min(maxY,y);
      });
      
      return {
        width: maxX - minX,
        height: maxY - minY
      }
      return r;
    }, 
    
    circle: function(node){
      var $node = $(node);
      var r2 = $node.attr("r") * 2;
      return {
        width: r2,
        height: r2
      }
    },
    
    square: function(node){
      var $node = $(node);
      return {
        width: $node.attr("w") * 1,
        height: $node.attr("h") * 1
      }
    }
    
  }
  // --------- /Shape Dim --------- //
  
  
  
})();