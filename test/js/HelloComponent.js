// BEST-PRACTICE: ways put your class in a 
(function($) {

	var helloWorlCount = 0;

	// BEST-PRACTICE: by convention, component name start with Upper Case 
	//                because it is like a definition/class every brite.display("HelloComponent") will create a new instance

	// Note 1: in this example, we inline the component definition in the HTML, 
	//       but look at the DialogPrompt.html/.js to see the recommended way (Object Oriented).
	brite.registerComponent("HelloComponent", {
		// Tell to empty the parent before adding this one
		emptyParent: true,
		// Tell to load the template (by default template/[ComponentName].html so, here it will be template/HelloComponent).
		loadTmpl: true
	},
	//Component factory build the component $element.
	//Note: since this is just a JS Structure it will be clone when brite create an instance of this component (on brite.display...)
	{
		create : function(data) {
			helloWorlCount++;
			data.count = helloWorlCount;
			// we can assume that the template/HelloComponent.html has been loaded and added to the DOM
			var $e = $($("#tmpl-HelloComponent").render(data));
			return $e;
		},

		// The postDisplay will be called after the display
		postDisplay : function(data) {
			this.$element.click(function() {
				alert("You clicked on " + $(this).html());
			});

		}

	});

})(jQuery)