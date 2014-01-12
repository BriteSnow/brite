/**
 * Component: ProjectView
 *
 * Responsibilities:
 *   - Manage a single project screen
 *   - Manage the task list of a project
 *
 */
(function($) {
	
	
	brite.registerView("ProjectView",{
		create: function(data){
			var view = this;
			
			// if the project is given, then, just render it. 
			if (data.project){
				view.project = data.project;
				return render("tmpl-ProjectView",{project:view.project});
			}
			// otherwise, we fetch it and return the appropriate promise.
			else{
				return main.projectDao.get(data.projectId).pipe(function(project){
					view.project = project;
					return render("tmpl-ProjectView",{project:project});
				});		
			}
		},
		
		postDisplay: function(){
			var view = this;
		 	// cache some fixed elements
		 	view.$card = view.$el.find(".card"); 
		 	view.$cardBack = view.$el.find(".card-back");
		 	view.$cardFront = view.$el.find(".card-front");		
		 	view.$sectionContent = view.$el.find("section.content"); 	
		 	
		 	refreshTable.call(view);
		 	
		},
		
		events: {
			
			// User click on "done" checkbox.
			"btap; .taskCheck" : function(event){
				var $check = $(event.currentTarget);
				// the object type and id are store in the DOM, so, just look for the parent element for this
				var taskId = $check.bEntity("Task").id;
				var currentDone = $check.hasClass("done");
				var newDone = !currentDone;
				main.taskDao.update({id:taskId,done:newDone});
			},
			
			// User click on the delete icon
			"btap; section.heading .del" : startDeleteMode,
			
			// Handle the task rename
			"focus; [data-entity='Task'] input[data-prop='title']": startTaskRename,
			"blur; [data-entity='Task'] input[data-prop='title']": endTaskRename,
			
			// Handle the create new task
			"focus; .newTask input[data-prop='title']": startTaskCreate,
			"blur; .newTask input[data-prop='title']": endTaskCreate,
			
			// Handle the edit project
			"btap; [data-action='editMode']": startProjectEdit,
			"ProjectEdit_DONE": endProjectEdit
			
		},
		
		daoEvents: {
			"dataChange; Task" : refreshTable, 
			
			"dataChange; Project" : function(event){
				var view = this;
				var daoEvent = event.daoEvent;
				// if it is the same Project, then, update it
				if (daoEvent.result && daoEvent.result.id === view.project.id){
					view.project = daoEvent.result;
					view.$el.find("header h2").text(view.project.title);
				}				
			}
		}
	});
	
	// --------- Event Handlers for Project Edit --------- //
	function startProjectEdit(){
		var view = this;
 		brite.display("ProjectEdit",view.$cardBack,{projectId:view.project.id}).done(function(){
 			view.$card.addClass("flipped");
 			
 			/* --------- for opera --------- */
 			if (!brite.ua.hasBackfaceVisibility()) {
	 			$(".card-front").hide();
	 			$(".card-back").show();
 			}
 			/* --------- /for opera --------- */
 		});		
	}
	
	function endProjectEdit(){
		var view = this;
	  	view.$card.removeClass("flipped");	
	  	
	  /* --------- for opera --------- */
		if (!brite.ua.hasBackfaceVisibility()) {
			$(".card-front").show();
			$(".card-back").hide();
		}
		/* --------- /for opera --------- */
	}
	// --------- /Event Handlers for Project Edit --------- //
	
	
	// --------- Event Handlers for Task Creation --------- //
	// start the task creation logic 
	// @param event.currentTarget must be the new task input element
	function startTaskCreate(event){
		var view = this;
		var $input = $(event.currentTarget);
		$input.off();
		
		$input.after(createHelperHtml);
		
		$input.on("keyup",function(event){
			// press ENTER
			if (event.which === 13){
				var newTask ={
					projectId: view.project.id,
					title: $input.val()
				}
				main.taskDao.create(newTask).done(function(){
					// Note: the DAO event listeners are triggered first, 
					//       since they are bound before the promise is returned.
					//       So, this is why, here the table will be refreshed, and we can set the new focus.  
					view.$el.find(".newTask input").focus();
				});
			}
			// press ESC
			else if (event.which === 27) {
				$input.trigger("blur");
			}
		});		
	}
	
	// End the task creation
	// @param event.currentTarget must be the new task input element
	function endTaskCreate(event){
		var $input = $(event.currentTarget);
		$input.val("");
		$input.parent().find(".helper").remove();
	}
	// --------- /Event Handlers for Task Creation --------- //	
	
	
	// --------- Event Handlers for Task Rename --------- //	
	// Starting the rename logic
	// @param event.currentTarget must be the task input element
	function startTaskRename(event){
		var view = this;
		var $input = $(event.currentTarget);
		$input.off();
		
		if (view.deleteMode){
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
	}
	
	// Ending the rename
	function endTaskRename(event){
		var $input = $(event.currentTarget);
		var oldValue = $input.data("oldValue");
		if (oldValue){
			$input.val($input.data("oldValue"));
		}
		$input.data("oldValue",null);
		$input.parent().find(".helper").remove();		
	}
	// --------- /Event Handlers for Task Rename --------- //
		
	// --------- Event Handlers for Tasks Remove --------- //	
	function startDeleteMode(event){
		var view = this;
		// create the delete-controls element
		var $controls = $(render("tmpl-ProjectView-delControls"));
		
		view.$el.find("section.heading").append($controls);
		
		var $inner = $controls.find(".delete-controls-inner");
		
		var $tableContent = view.$el.find("section.content");

		setTimeout(function(){
			$inner.addClass("show");
		},10);
		
		// add the deleteMode class and set component flag
		view.$el.addClass("deleteMode")
		view.deleteMode = true;
		
		// disable the inputs
		$tableContent.find("input").prop("disabled",true);
		
		// delete			
		var $deleteButton = $controls.find("[data-action='delete']");
		$deleteButton.on("click",function(){
			var ids = [];
			$tableContent.find("tr.to-delete").each(function(idx,tr){
				ids.push($(tr).bEntity("Task").id);
			});
			main.taskDao.deleteMany(ids).done(function(){
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
			view.$el.removeClass("deleteMode");
			$tableContent.find("tr.to-delete").removeClass("to-delete");
			view.deleteMode = false;
			
			// cleanup the event to make sure to not double bind it.
			$tableContent.off(".seldelete");
			
			// enable the input
			$tableContent.find("input").prop("disabled",false);
			
			$controls.find(".delete-controls-inner").removeClass("show").on("btransitionend",function(){
				$controls.remove();
			});
			
			/* --------- for opera and mozilla--------- */
			if(brite.ua.browser.opera || brite.ua.browser.mozilla){
	  			$controls.find(".delete-controls-inner").removeClass("show")
				$controls.remove();
			}
			/* --------- /for opera and mozilla--------- */
		}		
	}
	
	// --------- Event Handlers for Tasks Remove --------- //
	
	// --------- Private Methods --------- //
	function refreshTable(){
		var view = this;
		
		return main.taskDao.list({match:{projectId:view.project.id}}).done(function(taskList){
			var taskTableHtml = render("tmpl-ProjectView-taskList",{tasks:taskList});
			view.$sectionContent.html(taskTableHtml);			
		});
	}
	// --------- /Private Methods --------- //
	
	var createHelperHtml = '<small class="helper">Press [ENTER] to create, or [ESC] to cancel.</small>';
	var updateHelperHtml = '<small class="helper">Press [ENTER] to update, or [ESC] to cancel.</small>';

})(jQuery); 