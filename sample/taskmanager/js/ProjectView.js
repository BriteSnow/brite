/**
 * Component: ProjectView
 *
 * Responsibilities:
 *   - Manage a single project screen
 *   - Manage the task list of a project
 *
 */
(function($) {
	
	
	// --------- Component Interface Implementation ---------- //
	function ProjectView() {
	}

	ProjectView.prototype.create = function(data, config) {
		var o = this;
		
		o.projectId = data.projectId;
		
		return $.when(main.projectDao.get(o.projectId),main.taskDao.list({match:{projectId:o.projectId}})).pipe(function(project,taskList){
			o.project = project;
			var html = $("#tmpl-ProjectView").render({project:project,tasks:taskList});
			var $e = $(html);
			return $e;
		});
	}

	// This is optional, it gives a way to add some logic after the component is displayed to the user.
	// This is a good place to add all the events binding and all
	ProjectView.prototype.postDisplay = function(data, config) {
		var o = this;
		
		// on any Task dataChange
		brite.dao.onDataChange("Task",function(event){
			var daoEvent = event.daoEvent;
			// Note: right now, aggressive refresh as we can assume 
			//       that if a Task entity change, it is because of this view 
			refreshTable.call(o);	
		},o.id);
		
		// on Project dataChange, if it is this project, update the project part of the screen
		brite.dao.onDataChange("Project",function(event){
			var daoEvent = event.daoEvent;
			if (daoEvent.result && daoEvent.result.id === o.projectId){
				o.project = daoEvent.result;
				o.$element.find("header h2").text(o.project.title);
			}
		},o.id);
		
		
		// --- Task Done true/false change --- //
		// handle the change task state (done true/false)
		o.$element.on("change","input[data-prop='done']",function(){
			var $check = $(this);
			
			// the object type and id are store in the DOM, so, just look for the parent element for this
			var taskId = $check.bEntity("Task").id;
			
			var done = $check.prop("checked");
			
			main.taskDao.update({id:taskId,done:done});
		});
		// --- /Task Done true/false change --- //
		
		// --- Task Delete --- //
		// Click on the del icon to turn delete mode
		o.$element.on("click",".table-header .del",function(){
			// create the delete-controls element
			var $controls = $($("#tmpl-ProjectView-delControls").render());
			o.$element.find(".table-header").append($controls);
			
			var $inner = $controls.find(".delete-controls-inner");
			//$inner.css("transform","scale(2)");
			
			setTimeout(function(){
				$inner.addClass("show");
			},10);
			
			// add the deleteMode class and set component flag
			var $tableContent = o.$element.find(".table-content");
			$tableContent.addClass("deleteMode");
			o.deleteMode = true;
			
			// delete			
			var $deleteButton = $controls.find("[data-action='delete']");
			$deleteButton.on("click",function(){
				var ids = [];
				$tableContent.find("tr.to-delete").each(function(idx,tr){
					ids.push($(tr).bEntity("Task").id);
				});
				main.taskDao.removeMany(ids).done(function(){
					turnDeleteModeOff();
				});
			});
			
			// cancel
			$controls.on("click","[data-action='cancel']",function(){
				turnDeleteModeOff();
			});
			
			// toggle the to-delete state of a row
			// namespace the event binding for future cleanup
			$tableContent.on("click.seldelete","tr",function(){
				
				var $tr = $(this);
				$tr.toggleClass("to-delete");
				var num = $tableContent.find("tr.to-delete").length;
				$deleteButton.text("Delete (" + num + ")");
			});
			
			
			// define function in scope to reuse all context variables
			function turnDeleteModeOff(){
				$tableContent.removeClass("deleteMode");
				$tableContent.removeClass("deleteMode");
				$tableContent.find("tr.to-delete").removeClass("to-delete");
				o.deleteMode = false;
				
				// cleanup the event to make sure to not double bind it.
				$tableContent.off(".seldelete");
				
				$controls.find(".delete-controls-inner").removeClass("show").on("btransitionend",function(){
					$controls.remove();
				});

			}
			
		});
		// --- /Task Delete --- //
		
		// --- Task Rename --- //
		o.$element.on("focus","[data-entity='Task'] input[data-prop='title']",function(){
			var $input = $(this);
			$input.off();
			
			if (o.deleteMode){
				$input.trigger("blur");
				return;
			}
			
			var taskId = $input.bEntity("Task").id;
			
			
			$input.data("oldValue",$input.val());
			
			$input.after(updateHelperHtml);
			
			$input.on("keyup", function(event){
				// press ENTER
				if (event.which === 13){
					var taskData ={
						id: taskId,
						title: $input.val()
					}
					
					main.taskDao.update(taskData);
				}
				// press ESC
				else if (event.which === 27) {
					$input.trigger("blur");
				}				
			});
		});
		
		// cancel the rename
		o.$element.on("blur","[data-entity='Task'] input[data-prop='title']",function(){
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
		o.$element.on("focus",".newTask input[data-prop='title']",function(){
			var $input = $(this);
			$input.off();
			
			$input.after(createHelperHtml);
			
			$input.on("keyup",function(event){
				// press ENTER
				if (event.which === 13){
					var newTask ={
						projectId: o.projectId,
						title: $input.val()
					}
					main.taskDao.create(newTask).done(function(){
						// Note: the DAO event listeners are triggered first, 
						//       since they are bound before the promise is returned.
						//       So, this is why, here the table will be refreshed, and we can set the new focus.  
						o.$element.find(".newTask input").focus();
					});
				}
				// press ESC
				else if (event.which === 27) {
					$input.trigger("blur");
				}
			});
		});
		
		// cancel the add new task
		o.$element.on("blur",".newTask input[data-prop='title']",function(){
			var $input = $(this);
			$input.val("");
			$input.parent().find(".helper").remove();
	 	});
	 	// --- /Create New Task --- //
	 	
	 	
	 	// --- Handling the EditMode --- //
	 	
	 	var $card = o.$element.find(".card"); 
	 	var $cardBack = o.$element.find(".card-back");
	 	var $cardFront = o.$element.find(".card-front");
	 	
	 	o.$element.on("btap","[data-action='editMode']",function(){
	 		brite.display("ProjectEdit",$cardBack,{projectId:o.projectId}).done(function(){
	 			$card.addClass("flipped");
	 		});
	  });
	  
	  o.$element.on("ProjectEdit_DONE",function(){
	  	var $card = o.$element.find(".card");
	  	$card.removeClass("flipped");
	  });
	  // --- Handling the EditMode --- //
	 	
		
	}
	
	ProjectView.prototype.destroy = function(){
		var o = this;
		
		// IMPORTANT: need to remove all the DAO event bound for this component
		brite.dao.offAny(o.id);
	}
	// --------- /Component Interface Implementation ---------- //
	
	// --------- Component Private Methods --------- //
	
	function refreshTable(){
		var o = this;
		
		return main.taskDao.list({match:{projectId:o.projectId}}).done(function(taskList){
			var $tableContent = o.$element.find(".table-content").empty();
			var taskTableHtml = $("#tmpl-ProjectView-taskTable-content").render({tasks:taskList});
			$tableContent.html(taskTableHtml);			
		});
	}
	
	// --------- /Component Private Methods --------- //
	
	// --------- Component Registration --------- //
	// Here we register the component
	brite.registerView("ProjectView", null, function() {
		return new ProjectView();
	});
	// --------- Component Registration --------- //


	var createHelperHtml = '<small class="helper">Press [ENTER] to create, or [ESC] to cancel.</small>';
	var updateHelperHtml = '<small class="helper">Press [ENTER] to update, or [ESC] to cancel.</small>';

})(jQuery); 