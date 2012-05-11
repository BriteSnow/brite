/**
 * Component: DrawContent
 * 
 * Responsibilities: 
 *   1) Draw and refresh the layers
 *   2) Manage the content controls layers for selection, move and such. 
 * 
 * Public APIs: 
 *   
 * 
 * Trigger Action Events:
 *   - DrawContent_DO_DELETE_POINT {layerId,pointIdx}: When the user press delete on a selected point (for the <path/> element)
 * 
 * Trigger Status Events: 
 *   - Draw_LAYER_CHANGE {layerId}: When a layer change 
 * 
 * Process Action Events:
 *   - DrawContent_DO_DELETE_POINT: Will process and consume the delete  
 * 
 * Listen Status Events: 
 *   - Draw_TOOL_CHANGE: will add the necessary control layers when tool change. 
 *   - Draw_LAYER_SELECT_CHANGE: 
 *   
 */
;(function(){
  
  // --------- Component Interface Implementation ---------- //
  function DrawContent(){
    
  }
  
  DrawContent.prototype.create = function(data, config){
    var html = $("#tmpl-" + this.name).render({});
    return $(html);
  }
  
  DrawContent.prototype.postDisplay = function(){
    var c = this;
    c.gtx = brite.gtx(c.$element.find("canvas"));
    
  }
  
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Public API --------- //
  DrawContent.prototype.draw = function($xmlDoc){
    var c = this; 
    
    
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
  
  DrawContent.prototype.getCanvas = function(){
    var c = this;
    return c.$element.find("canvas")[0];
  }
  // --------- /Component Public API --------- //
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("DrawContent", null,
  function() {
    return new DrawContent();
  });
  // --------- Component Registration --------- //  
  
  
  
  // --------- Renderers --------- //
  var renderers = {
    
    path: function(g,node){
      g.beginPath().strokeStyle("rgba(50, 50, 50, 0.3)").lineWidth(2);
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
    
    circle: function(g,node){
      g.beginPath().strokeStyle("rgba(200, 50, 50, 0.3)").lineWidth(2);
      var $node = $(node);
      //g.arc(100,100,50,0,Math.PI*2,true).stroke();
      g.arc($node.attr("x"),$node.attr("y"),$node.attr("r"),0,Math.PI*2,true).stroke();
      //g.moveTo(100,100).lineTo(300,300).stroke();
    },

    square: function(g,node){
      g.beginPath().strokeStyle("rgba(200, 50, 50, 0.3)").lineWidth(2);
      var $node = $(node);
      g.rect($node.attr("x"),$node.attr("y"),$node.attr("w"),$node.attr("h")).stroke();
    }
  }
  // --------- /Renderers --------- //
  
  
})();