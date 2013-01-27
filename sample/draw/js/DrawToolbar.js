;(function() {

  var tools = ["select","pen","circle","square"];
  
  // --------- Component Interface Implementation ---------- //
  function DrawToolbar() {
  }


  DrawToolbar.prototype.create = function(data, config) {
    return $("#tmpl-" + this.name).render({
      tools : tools
    });
  }

  DrawToolbar.prototype.postDisplay = function(data, config){
    var c = this;
    console.log("postDisplay",c);
    // when a user click on the 
    c.$element.on("btap",".DrawToolbar-tool",function(){
      var $this = $(this);
      var tool = $this.attr("data-tool");
      c.$element.trigger("Draw_DO_SET_TOOL",tool);
    });
    
    c.$draw = c.$element.bComponent("Draw").$element;
    c.$draw.on("Draw_DO_SET_TOOL" + "." + c.cid, function(event,tool){
       c.$element.find(".DrawToolbar-tool").removeClass("sel");
       c.$element.find("[data-tool='" + tool + "']").addClass("sel");
    });
  }

  DrawToolbar.prototype.destroy = function(){
    var c = this;
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
