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
    
    brite.display("DrawContent",null,{parent:c.$element}).done(function(drawContent){
      c.drawContent = drawContent;
      
      $.ajax({url:"data/draw-sample.xml",
              dataType: "text"}).done(function(result){
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(result,"text/xml");
        c.$xmlDoc = $(xmlDoc.firstChild);
        refreshContent.call(c);       
      });
    });
    
    
    handleDrawingLogic.call(c);
    
    handleSave.call(c);
    
    // prevent the "delete" key to be back
    $(window).on("keydown." + c.cid,function(event){
      if (event.which == '8'){
        event.stopPropagation();
        event.preventDefault();
      }
    });
    
  }
  
  Draw.prototype.destroy = function(){
    $(document).off("." + this.cid);
    $(window).off("." + this.cid);
  }
  // --------- /Component Interface Implementation ---------- //
  
  
  // --------- Component Private Methods --------- //
  
  function handleSave(){
    var c = this;
    
    c.$element.on("btap","[data-action='save']",function(){
      var canvas = c.drawContent.getCanvas();
      
      console.log("will save: " + c.drawContent.getCanvas());
      
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
  
  function handleDrawingLogic(){
    var c = this;
    
    // handle the draw event
    c.$element.on("btap",".DrawContent canvas",function(event){
      var $path = c.$xmlDoc.find("path:first");
      var $p = $("<p></p>");
      $p.attr("x",event.offsetX).attr("y",event.offsetY);
      $path.append($p);
      c.drawContent.draw(c.$xmlDoc);
    });    
    
    // key binding
    $(document).on("keyup." + c.cid,function(event){
      //console.log("event: " + event.which);
      
      // support the delete
      if (event.which == '8'){
        var $path = c.$xmlDoc.find("path:first");
        $path.find("p:last").remove();
        refreshContent.call(c);
      }
    });    
  }
  
  function refreshContent(){
    c = this;
    
    c.drawContent.draw(c.$xmlDoc);
  }
  
  // --------- /Component Private Methods --------- //  
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("Draw", null,
  function() {
    return new Draw();
  });
  // --------- Component Registration --------- //  
  
  
})();