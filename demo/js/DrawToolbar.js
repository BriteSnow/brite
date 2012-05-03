;(function() {

  var tools = ["pointer","pen","circle"];//,"square","circle"];
  
  // --------- Component Interface Implementation ---------- //
  function DrawToolbar() {
  }


  DrawToolbar.prototype.create = function(data, config) {
    var html = $("#tmpl-" + this.name).render({
      tools : tools
    });
    return $(html);
  }

  DrawToolbar.prototype.postDisplay = function(data, config){
    var c = this;
    
    // when a user click on the 
    c.$element.on("btap",".DrawToolbar-tool",function(){
      var $this = $(this);
      var tool = $this.attr("data-tool");
      c.$element.trigger(demo.draw.event.SET_TOOL,tool);
    });
    
    c.$draw = c.$element.bComponent("Draw").$element;
    c.$draw.on(demo.draw.event.SET_TOOL + "." + c.cid, function(event,tool){
       c.$element.find(".DrawToolbar-tool").removeClass("sel");
       c.$element.find("[data-tool='" + tool + "']").addClass("sel");
    });
  }

  DrawToolbar.prototype.destroy = function(){
    // clean the event we bound to Draw
    c.$draw.off("." + c.cid);
  }

  // --------- /Component Interface Implementation ---------- //

  // --------- Component Registration --------- //
  brite.registerComponent("DrawToolbar", null, function() {
    return new DrawToolbar();
  });
  // --------- Component Registration --------- //

})();
