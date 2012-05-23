/**
 * Component: DrawContent
 * 
 * Responsibilities: 
 *   - Create a canvas that draws 
 *   - Manage the content controls layers for selection, move and such. 
 * 
 * Public APIs: 
 * 
 * Events:
 * Owner | Trigger | Process | Name                        | Arguments (for owners only)
 *   N   |    Y    |   n/a   | Draw_XML_DOC_LAYERS_CHANGE  | 
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
    var html = $("#tmpl-" + this.name).render({});
    return $(html);
  }
  
  DrawContent.prototype.postDisplay = function(){
    var c = this;
    
    c.gtx = brite.gtx(c.$element.find("canvas"));
    
    var draw = c.$element.bComponent("Draw");
     
    if (draw){
      draw.$element.on("Draw_XML_DOC_LAYERS_CHANGE." + c.cid,function(){
        drawLayers.call(c);
      });
    }else{
      throw new "DrawContent cannot find Draw parent";
    } 
    
    c.$element.on("btap",function(event){
      
      // compute the position relative to this location
      var pos = brite.substract({top:event.pageY,left:event.pageX},c.$element.offset());
      
      canvasList = getHotzoneCanvasList.call(c);
      console.log("//");
      var selectedLayerIdx = -1;
      $.each(canvasList,function(idx,item){
        if (item.gtx.context.isPointInPath(pos.left,pos.top)){
          console.log("x: " + pos.left + " y: " + pos.top + " "  +  item.$layer.attr("name"));
          selectedLayerIdx = idx;
        }
      });
      
      if (selectedLayerIdx > -1){
        c.$element.trigger("Draw_DO_SELECT_LAYER",selectedLayerIdx);
      }
      
      
    });
  }
  
  DrawContent.prototype.destroy = function(){
    var c = this;
    c.$element.bComponent("Draw").$element.off("." + c.cid);
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
  
  
})();