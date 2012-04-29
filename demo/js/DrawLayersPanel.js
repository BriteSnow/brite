;(function(){

    
  // --------- Component Interface Implementation ---------- //
  function DrawLayersPanel(){
    
  }
  
  DrawLayersPanel.prototype.create = function(data, config){
    var html = $("#tmpl-" + this.name).render({});
    return $(html);
  }
  
  DrawLayersPanel.prototype.postDisplay = function(){
    var c = this;
   
    refreshLayers.call(c);
    
    c.draw = c.$element.bComponent("Draw");

    // handle layer btap 
    c.$element.on("btap",".DrawLayersPanel-layer", function(){
      var $layerDiv = $(this);
      var index = $layerDiv.prevAll(".DrawLayersPanel-layer").length;
      c.$element.trigger(demo.draw.event.LAYER_SELECT_CHANGE,index);
    });
        
    // respond to layer event
    c.draw.$element.on(demo.draw.event.LAYER_SELECT_CHANGE + "." + c.cid, function(event,layeridx){
        c.$element.find(".DrawLayersPanel-layer").removeClass("sel").eq(layeridx).addClass("sel");
    });  
    
  }
  
  DrawLayersPanel.prototype.destroy = function(){
    var c = this;
    if (c.draw && c.draw.$element){
      c.draw.$element.off("." + c.cid);
    }
  }
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Private Methods --------- //
  function refreshLayers(){
    var c = this;
    
    var draw = c.$element.bComponent("Draw");
    
    var $xmlDoc = draw.getXmlDoc();
    var idSeq = 0;
    var layers = [];
    $xmlDoc.find("layer").each(function(idx,layerXml){
      var layer = {};
      layer.name = "layer " + idSeq++;
      layers.push(layer);
    });
    var contentHtml = $("#tmpl-DrawLayersPanel-layers").render({layers:layers});
    c.$element.empty().append(contentHtml);    
  }
  // --------- /Component Private Methods --------- //

  // --------- Component Registration --------- //
  brite.registerComponent("DrawLayersPanel", null, function() {
    return new DrawLayersPanel();
  });
  // --------- Component Registration --------- //

})();