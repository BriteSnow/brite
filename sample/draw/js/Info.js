(function(){
  // --------- Component Interface Implementation ---------- //
  function Info(){
  }

  Info.prototype.create = function(){
    var html = $("#tmpl-Info").render({});
    return $(html);
  }
  
  Info.prototype.postDisplay = function(){
    var c = this; 
  }
  // --------- /Component Interface Implementation ---------- //
  
  // --------- Component Registration --------- //
  brite.registerComponent("Info", {},
  function() {
    return new Info();
  });
  // --------- /Component Registration --------- //  
  
})();