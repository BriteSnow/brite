/**
 * View: ProjectEdit
 *
 * Responsibilities:
 *   - Allow to edit the properties of a project
 *
 */
(function($) {

	brite.registerView("ProjectEdit",{emptyParent:true},{
		
		create: function(data){
			var view = this;
			return main.projectDao.get(data.projectId).pipe(function(project){
				view.project = project;
				return $("#tmpl-ProjectEdit").render({project:project});
			});			
		}, 
		
		events: {
			
			// on CANCEL
			"btap; [data-action='cancel']" : function(){
				this.$el.trigger("ProjectEdit_DONE");
			},
			
			// on OK
			"btap; [data-action='ok']" : function(){
				var view = this;
				var $input = view.$el.find("input[data-prop='title']");
				// save only if different value. 
				if (hasDifferentValue.call(view,$input,"title")){
					main.projectDao.update({id:view.project.id,title:$input.val()});
				}
				view.$el.trigger("ProjectEdit_DONE");
			}, 
			
			// on edit title
			"keyup; input[data-prop='title']" : function(event){
				var view = this;
				var $input = $(event.currentTarget);
				if (hasDifferentValue.call(view,$input,"title")){
					$input.addClass("changed");
				}else{
					$input.removeClass("changed");
			 	}
			}, 
			
			// when press Enter on an input, commit (click on ok)
			"keyup; input" : function(event){
				var view = this;
				if (event.which === 13){
					view.$el.find("header [data-action='ok']").trigger("btap");
				}
			} 
			
		}
		
	});
		
	// return true if the value of the input is different and the view.project property
	function hasDifferentValue($input,propName){
		var view = this;
		var inputVal = $input.val();
		var projectVal = view.project[propName];
		return (inputVal !== projectVal);
	}


})(jQuery); 