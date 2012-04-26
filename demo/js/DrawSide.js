;(function() {

  // --------- Component Interface Implementation ---------- //
  function DrawSide() {
  }


  DrawSide.prototype.create = function(data, config) {
    var html = $("#tmpl-" + this.name).render({});
    return $(html);
  }

  // --------- /Component Interface Implementation ---------- //

  // --------- Component Registration --------- //
  brite.registerComponent("DrawSide", null, function() {
    return new DrawSide();
  });
  // --------- Component Registration --------- //

})();