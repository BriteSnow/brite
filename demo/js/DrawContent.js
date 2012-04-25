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
    
    console.log("drawing: " + $xmlDoc);
    ttt = $xmlDoc;
    $xmlDoc.children().each(function(idx,node){
      console.log("drawing: " + node.nodeName);
    });
    /*
    // fill the gradient    
    var fillStyle = g.createLinearGradient(0,0,0,h);
    fillStyle.addColorStops(0, 'rgba(23, 0, 0, 0.6)',1,'rgba(200, 50, 50, 0.6)');
    g.fillStyle(fillStyle);
    g.beginPath().moveTo(0,h).lineTo(30,0).lineTo(w,0).lineTo(w - 30, h).lineTo(0,h);
    g.fill();
*/
    
  }
  // --------- /Component Public API --------- //
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("DrawContent", null,
  function() {
    return new DrawContent();
  });
  // --------- Component Registration --------- //  
  
  
})();