;(function(){
  
  // --------- Component Interface Implementation ---------- //
  function DrawToolbar(){
    
  }
  
  DrawToolbar.prototype.create = function(data, config){
    var html = $("#tmpl-DrawToolbar").render({apps:demo.apps});
    return $(html);
  }
  
  DrawToolbar.prototype.postDisplay = function(){
    var c = this;
    

  }
  
  DrawToolbar.prototype.destroy = function(){
  }
  // --------- /Component Interface Implementation ---------- //
  
  
  // --------- Component Registration --------- //
  brite.registerComponent("DrawToolbar", null,
  function() {
    return new DrawToolbar();
  });
  // --------- Component Registration --------- //  
  
  
})();