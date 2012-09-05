var main = main || {};


// the data see
(function(){
	
	// --------- Application Data API --------- //
	// Note: For this demo, this implementation does not use the brite DAO system. 
	//       Just an inMemory API. 


  main.getProject = function(projectId){
  	var dfd = $.Deferred();
  	
  	var idx = brite.array.getIndex(main.data.projects,"id",projectId);
  	
  	dfd.resolve(main.data.projects[idx]);
  	
  	return dfd.promise();
  } 
	
	// return the list of projects
	main.getProjectList = function(){
		var dfd = $.Deferred();
		
		// in this simple implementation, resolve immediately
		dfd.resolve(main.data.projects);		
		
		return dfd.promise();
  }
  
  // add a newProject, and return a promise that will resolve with it. 
  main.addProject = function(newProject){
  	
  }		
	
	main.getTaskList = function(projectId,showDone){
		var dfd = $.Deferred();
		
		// create the filtered task list
		var tasks = $.map(main.data.tasks,function(task){
			if (task.projectId == projectId){
				return task;
			}
		});
		
		// TODO: need to stake the projectId and showDone properties
		dfd.resolve(tasks);
		
		return dfd.promise();
	}
	
	main.addTask = function(newTask){
		var dfd = $.Deferred();
		
		// create the id (this could be done in the server for cloud apps)
		newTask.id = brite.uuid();
		
		main.data.tasks.push(newTask);
		
		dfd.resolve(newTask);
		
		
		return dfd.promise();
	}
	
	main.removeTaskList = function(idArray){
		var dfd = $.Deferred();
		
		// make the idArray a dictionary for fast lookup
		var idDic = {};
		$.each(idArray,function(idx,val){
			idDic[val] = true;
		});
		
		
		
		// rebuild the tasks store
		main.data.tasks = $.map(main.data.tasks,function(val){
			if (!idDic[val.id]){
				return val;
			}
		});
		
		// resolve with the same idArray to be delete
		dfd.resolve(idArray);
		
		return dfd.promise();
	}
	
	// update the task with taskId and the new property values in the newValues object
	main.updateTask = function(taskId,newValues){
		var dfd = $.Deferred();
		
		var idx = brite.array.getIndex(main.data.tasks,"id",taskId);
		if (idx > -1){
			var task = main.data.tasks[idx];
			$.extend(task,newValues);
			
			dfd.resolve(task);
		}
		
		return dfd.promise();
	}
	
	// private
	
	// --------- /Application Data API --------- //
	
	main.data = {};
	
	// projects by ID
	main.data.projects = [
		{id:"001",title:"Grocery List"},
		{id:"002",title:"House Remodeling"},
		{id:"003",title:"Learn HTML5"},
		{id:"004",title:"Learn Brite"}
	]
	
	main.data.tasks = [
		{id:"101",projectId:"001",done:false,title:"Heavy Whipping cream"},
		{id:"102",projectId:"001",done:true,title:"1 Garlic"},
		{id:"103",projectId:"001",done:false,title:"Mushrooms (cèpe)"},
		{id:"104",projectId:"001",done:false,title:"Fresh Pasta"},
		
		{id:"201",projectId:"002",done:true,title:"Take room dimensions"},
		{id:"202",projectId:"002",done:true,title:"Make sketches with iPad app"},
		{id:"203",projectId:"002",done:false,title:"Hire architect to review sketches"},
		{id:"204",projectId:"002",done:false,title:"Hire engineer to finish plan"},
		{id:"204",projectId:"002",done:false,title:"Hire contractors"},
		
		{id:"301",projectId:"003",done:true,title:"Brush up HTML, JS, and CSS skills"},
		{id:"302",projectId:"003",done:false,title:"Checkout html5rocks.com for new HTML5 features"},
		{id:"303",projectId:"003",done:false,title:"Learn Object Oriented with JavaScript"},
		{id:"304",projectId:"003",done:false,title:"Learn application layout with HTML and CSS"},
		{id:"304",projectId:"003",done:false,title:"Learn"},
		
		{id:"301",projectId:"004",done:false,title:"Learn HTML5"},
		{id:"302",projectId:"004",done:false,title:"Learn D-MVC (DOM centric MVC)"},
		{id:"303",projectId:"004",done:true,title:"Forget Sencha (i.e. '/$ delete -Rf sencha*')"},
		{id:"304",projectId:"004",done:false,title:"Build an amazing HTML5 application the DOM way and not the desktop way"}
		
  ]
	
})();