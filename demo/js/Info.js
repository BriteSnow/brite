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
  brite.registerComponent("Demo", {
    parent : "body",
    loadTmpl : true
  },
  // Note in this way, when a function is passed, this function will be use as the factory for the new instance it is responsible to return an instance of the Component
  function() {
    return new Demo();
  });
  // --------- /Component Registration --------- //  
  
})();