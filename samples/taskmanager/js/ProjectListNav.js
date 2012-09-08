/**
 * View: ProjectListNav
 *
 * Responsibilities:
 *   - Manage the list of project (create, delete, select, rename)
 *
 */
(function($) {

	// --------- View Interface Implementation ---------- //
	function ProjectListNav() {
	};

	ProjectListNav.prototype.create = function(data, config) {
		
		return main.projectDao.list().pipe(function(projectList){
			var html = $("#tmpl-ProjectListNav").render({projects:projectList});
			var $e = $(html);
			return $e;
		});
	}

	// This is optional, it gives a way to add some logic after the View is displayed to the user.
	// This is a good place to add all the events binding and all
	ProjectListNav.prototype.postDisplay = function(data, config) {
		var o = this;
		
		// on dataChange of a project, just refresh all for now (can be easily optimized)
		brite.dao.onDataChange("Project",function(){
			main.projectDao.list().done(function(projectList){
				var html = $("#tmpl-ProjectListNav").render({projects:projectList});
				var $e = $(html);
				o.$element.empty().append($e.children());
				showProjectSelected.call(v,o.selectedProjectId);
			});
		},o.id);
		
		// On User Click
		o.$element.on("click","li[data-obj_type='Project']",function(){
			var $li = $(this);
			var projectId = $li.attr("data-obj_id");
			$li.trigger("DO_SELECT_PROJECT",{projectId:projectId});
		});
		
		// We bind to the document events
		$(document).on("DO_SELECT_PROJECT." + o.id,function(event,extra){
			showProjectSelected.call(o,extra.projectId);
		});
		
	}
	
	ProjectListNav.prototype.destroy = function(){
		// we cleanup all the document events for this View.
		$(document).off("." + o.id);
		
		// cleanup any dao event binding for this view
		brite.dao.offAny(o.id);
	}

	// --------- /View Interface Implementation ---------- //
	
	// --------- Private Methods --------- //
	function showProjectSelected(projectId){
		var o = this;

		// deselect any eventual selection
		o.$element.find("li.sel").removeClass("sel");
		o.$element.find("i.icon-folder-open").removeClass("icon-folder-open").addClass("icon-folder-close");
		
		// select the li
		var $selectedLi = o.$element.find("li[data-obj_id='" + projectId + "']");
		$selectedLi.addClass("sel");
		$selectedLi.find("i.icon-folder-close").removeClass("icon-folder-close").addClass("icon-folder-open");
		
		// keep that for dataChangeEvent (to keep the item selected)
		o.selectedProjectId = projectId;
	}
	// --------- /Private Methods --------- //

	// --------- View Registration --------- //
	// Here we register the View
	brite.registerView("ProjectListNav", null, function() {
		return new ProjectListNav();
	});
	// --------- View Registration --------- //

})(jQuery); 