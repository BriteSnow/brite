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
		var c = this;
		c.projectId = data.projectId;
		
		return $.when(main.getProject(c.projectId),main.getTaskList(c.projectId)).pipe(function(project,taskList){
			
			var html = $("#tmpl-ProjectScreen").render({project:project,tasks:taskList});
			var $e = $(html);
			return $e;
		});
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	ProjectScreen.prototype.postDisplay = function(data, config) {
		var c = this;
		
		// --- Task Done true/false change --- //
		// handle the change task state (done true/false)
		c.$element.on("change","input[data-prop='done']",function(){
			var $check = $(this);
			
			// the object type and id are store in the DOM, so, just look for the parent element for this
			var taskId = $check.closest("[data-obj_id]").attr("data-obj_id");
			
			var done = $check.prop("checked");
			main.updateTask(taskId,{done:done}).done(function(){
				refreshTable.call(c);
			});
		});
		// --- /Task Done true/false change --- //
		
		// --- Task Delete --- //
		// Click on the del icon to turn delete mode
		c.$element.on("click",".table-header .del",function(){
			// create the delete-controls element
			var $controls = $($("#tmpl-ProjectScreen-delControls").render());
			c.$element.find(".table-header").append($controls);
			
			// add the deleteMode class and set component flag
			var $tableContent = c.$element.find(".table-content");
			$tableContent.addClass("deleteMode");
			c.deleteMode = true;
			
			// delete			
			var $deleteButton = $controls.find("[data-action='delete']");
			$deleteButton.on("click",function(){
				var ids = $tableContent.find("tr.to-delete").map(function(){
					return $(this).attr("data-obj_id");
				});
				main.removeTaskList(ids).done(function(){
					turnDeleteModeOff();
					refreshTable.call(c);
				});
			});
			
			// cancel
			$controls.on("click","[data-action='cancel']",function(){
				turnDeleteModeOff();
			});
			
			// toggle the to-delete state of a row
			// namespace the event binding for future cleanup
			$tableContent.on("click.seldelete",".deleteMode tr",function(){
				var $tr = $(this);
				$tr.toggleClass("to-delete");
				var num = $tableContent.find("tr.to-delete").length;
				$deleteButton.text("Delete (" + num + ")");
			});
			
			
			// define function in scope to reuse all context variables
			function turnDeleteModeOff(){
				$controls.remove();
				$tableContent.removeClass("deleteMode");
				$controls.remove();
				$tableContent.removeClass("deleteMode");
				$tableContent.find("tr.to-delete").removeClass("to-delete");
				c.deleteMode = false;
				
				// cleanup the event to make sure to not double bind it.
				$tableContent.off(".seldelete");

			}
			
		});
		
		
		
		// --- /Task Delete --- //
		
		// --- Task Rename --- //
		c.$element.on("focus","[data-obj_type='Task'] input[data-prop='title']",function(){
			var $input = $(this);
			$input.off();
			
			if (c.deleteMode){
				$input.trigger("blur");
				return;
			}
			
			
			var taskId = $input.closest("[data-obj_id]").attr("data-obj_id");
			
			$input.data("oldValue",$input.val());
			
			$input.after(updateHelperHtml);
			
			$input.on("keyup", function(event){
				// press ENTER
				if (event.which === 13){
					var values ={
						title: $input.val()
					}
					
					main.updateTask(taskId,values).done(function(){
						refreshTable.call(c);
					});
				}
				// press ESC
				else if (event.which === 27) {
					$input.trigger("blur");
				}				
			});
		});
		
		c.$element.on("blur","[data-obj_type='Task'] input[data-prop='title']",function(){
			var $input = $(this);
			var oldValue = $input.data("oldValue");
			if (oldValue){
				$input.val($input.data("oldValue"));
			}
			$input.data("oldValue",null);
			$input.parent().find(".helper").remove();
		});
		// --- /Task Rename --- //
		
		// --- Create New Task --- //
		// handle the create new task
		c.$element.on("focus",".newTask input[data-prop='title']",function(){
			var $input = $(this);
			$input.off();
			
			$input.after(createHelperHtml);
			
			$input.on("keyup",function(event){
				// press ENTER
				if (event.which === 13){
					var newTask ={
						projectId: c.projectId,
						title: $input.val()
					}
					main.addTask(newTask).done(function(){
						refreshTable.call(c);
						c.$element.find(".newTask input").focus();
					});
				}
				// press ESC
				else if (event.which === 27) {
					$input.trigger("blur");
				}
			});
		});
		
		// handle the cancel add new task
		c.$element.on("blur",".newTask input[data-prop='title']",function(){
			var $input = $(this);
			$input.val("");
			$input.parent().find(".helper").remove();
	 	});
	 	// --- /Create New Task --- //
		
	}
	// --------- /Component Interface Implementation ---------- //
	
	// --------- Component Private Methods --------- //
	
	function turnDeleteMode(deleteMode){
		var c = this;
		
		if (deleteMode){
			
		}else{
			
		}
	}
	
	function refreshTable(){
		var c = this;
		
		return main.getTaskList(c.projectId).done(function(taskList){
			var $tableContent = c.$element.find(".table-content").empty();
			var taskTableHtml = $("#tmpl-ProjectScreen-taskTable-content").render({tasks:taskList});
			$tableContent.html(taskTableHtml);			
		});
	}
	
	// --------- /Component Private Methods --------- //
	
	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("ProjectScreen", null, function() {
		return new ProjectScreen();
	});
	// --------- Component Registration --------- //


	var createHelperHtml = '<small class="helper">Press [ENTER] to create, or [ESC] to cancel.</small>';
	var updateHelperHtml = '<small class="helper">Press [ENTER] to update, or [ESC] to cancel.</small>';

})(jQuery); 