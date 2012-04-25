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
    brite.display("DrawContent",null,{parent:c.$element}).done(function(drawContent){
      
      $.ajax({url:"data/draw-sample.xml",
              dataType: "text"}).done(function(result){
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(result,"text/xml");
        var $xmlDoc = $(xmlDoc.firstChild);
        drawContent.draw($xmlDoc);        
      });
    });;

  }
  
  Draw.prototype.destroy = function(){
  }
  // --------- /Component Interface Implementation ---------- //
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("Draw", null,
  function() {
    return new Draw();
  });
  // --------- Component Registration --------- //  
  
  
})();