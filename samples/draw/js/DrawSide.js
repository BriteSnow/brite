;(function() {

  // --------- Component Interface Implementation ---------- //
  function DrawSide() {
  }


  DrawSide.prototype.create = function(data, config) {
    var html = $("#tmpl-" + this.name).render({});
    return $(html);
  }
  
  DrawSide.prototype.postDisplay = function(data, config) {
    var c = this; 
    
    brite.display("DrawLayersPanel",null,{parent:c.$element});
  }

  // --------- /Component Interface Implementation ---------- //

  // --------- Component Registration --------- //
  brite.registerComponent("DrawSide", null, function() {
    return new DrawSide();
  });
  // --------- Component Registration --------- //

})();