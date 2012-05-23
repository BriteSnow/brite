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
      c.$element.trigger("Draw_LAYER_SELECT_CHANGE",index);
    });
        
    // respond to layer event
    c.draw.$element.on("Draw_LAYER_SELECT_CHANGE" + "." + c.cid, function(event,layeridx){
        c.$element.find(".DrawLayersPanel-layer").removeClass("sel").eq(layeridx).addClass("sel");
    });
    
    c.draw.$element.on("Draw_XML_DOC_LAYERS_CHANGE" + "." + c.cid, function(event){
      refreshLayers.call(c);
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
    
    // to preserve the selected index
    var selectedIdx = c.$element.find(".DrawLayersPanel-layer.sel").prevAll(".DrawLayersPanel-layer").length;
    
    var $xmlDoc = draw.getXmlDoc();
    var idSeq = 0;
    var layers = [];
    $xmlDoc.find("layer").each(function(idx,layerXml){
      var layer = {};
      layer.name = "layer " + idSeq++;
      layers.push(layer);
    });
    var contentHtml = $("#tmpl-DrawLayersPanel-layers").render({layers:layers});
    
    var $newContent = $(contentHtml);
    
    // reset the selected state
    $newContent.find(".DrawLayersPanel-layer").eq(selectedIdx).addClass("sel");
    
    c.$element.empty().append($newContent);    
  }
  // --------- /Component Private Methods --------- //

  // --------- Component Registration --------- //
  brite.registerComponent("DrawLayersPanel", null, function() {
    return new DrawLayersPanel();
  });
  // --------- Component Registration --------- //

})();