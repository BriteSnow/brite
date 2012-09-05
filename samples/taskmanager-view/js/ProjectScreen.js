/**
 * Component: ProjectScreen
 *
 * Responsibilities:
 *   - Manage a single project screen
 *   - Manage the task list of a project
 *
 */
(function($) {

	// --------- Component Interface Implementation ---------- //
	function ProjectScreen() {
	}

	ProjectScreen.prototype.create = function(data, config) {
		return main.getTaskList(data.projectId).pipe(function(taskList){
			var html = $("#tmpl-ProjectScreen").render({tasks:taskList});
			var $e = $(html);
			return $e;
	 	});
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	ProjectScreen.prototype.postDisplay = function(data, config) {
		var c = this;
		
		// handle the change task state (done true/false)
		c.$element.on("change","input[data-prop='done']",function(){
			var $check = $(this);
			
			// the object type and id are store in the DOM, so, just look for the parent element for this
			var taskId = $check.closest("[data-obj_id]").attr("data-obj_id");
			
			var done = $check.prop("checked");
		});
		
		// handle the create new task
		c.$element.on("focus",".newTask input[data-prop='title']",function(){
			var $input = $(this);
			$input.off();
			
			$input.on("keyup",function(event){
				
				// press ENTER
				if (event.which === 13){
					var newTask ={
						id: brite.uuid(), 
						title: $input.val()
					}
					main.data.tasks.push(newTask);
					refreshTable.call(c);
					c.$element.find(".newTask input").focus();
				}
				// press ESC
				else if (event.which === 27) {
					$input.trigger("blur");
				}
			});
			c.$element.find(".newTask .helper").show();
		});
		
		
		// handle the cancel add new task
		c.$element.on("blur",".newTask input[data-prop='title']",function(){
			var $input = $(this);
			$input.val("");
			c.$element.find(".newTask .helper").hide();
	 	});
		
	}
	// --------- /Component Interface Implementation ---------- //
	
	// --------- Component Private Methods --------- //
	function refreshTable(){
		var c = this;
		
		var $tableContainer = c.$element.find(".table-container").empty();
		var taskTableHtml = $("#tmpl-ProjectScreen-taskTable").render({tasks:main.data.tasks});
		$tableContainer.html(taskTableHtml);
	}
	// --------- /Component Private Methods --------- //
	
	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("ProjectScreen", null, function() {
		return new ProjectScreen();
	});
	// --------- Component Registration --------- //

})(jQuery); 