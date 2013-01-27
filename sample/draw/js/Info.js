(function(){
  // --------- Component Interface Implementation ---------- //
  function Info(){
  }

  Info.prototype.create = function(){
    return $("#tmpl-Info").render({});
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