;(function() {

  // --------- Component Interface Implementation ---------- //
  function DrawSide() {
  }


  DrawSide.prototype.create = function(data, config) {
    return $("#tmpl-" + this.name).render({});
  }
  
  DrawSide.prototype.postDisplay = function(data, config) {
    var c = this; 
    
    brite.display("DrawLayersPanel",c.$el);
  }

  // --------- /Component Interface Implementation ---------- //

  // --------- Component Registration --------- //
  brite.registerComponent("DrawSide", null, function() {
    return new DrawSide();
  });
  // --------- Component Registration --------- //

})();