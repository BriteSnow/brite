/**
 * View: ProjectEdit
 *
 * Responsibilities:
 *   - Allow to edit the properties of a project
 *
 */
(function($) {

	// --------- View Interface Implementation ---------- //
	function ProjectEdit() {
	};

	ProjectEdit.prototype.create = function(data, config) {
		
		return main.projectDao.get(data.projectId).pipe(function(project){
			var html = $("#tmpl-ProjectEdit").render({project:project});
			var $e = $(html);
			return $e;
		});
	}

	// This is optional, it gives a way to add some logic after the View is displayed to the user.
	// This is a good place to add all the events binding and all
	ProjectEdit.prototype.postDisplay = function(data, config) {
		var o = this;
		
		var $cancel = o.$element.find("header [data-action='cancel']");
		$cancel.on("btap",function(){
			o.$element.trigger("ProjectEdit_DONE");
		});		
	}
	
	// --------- /View Interface Implementation ---------- //
	
	// --------- View Registration --------- //
	// Here we register the View
	brite.registerView("ProjectEdit", {emptyParent:true}, function() {
		return new ProjectEdit();
	});
	// --------- View Registration --------- //

})(jQuery); 