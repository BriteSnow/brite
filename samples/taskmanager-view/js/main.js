var main = main || {};


// the data see
(function(){
	
	// --------- Application Data API --------- //
	// Note: For this demo, this implementation does not use the brite DAO system. 
	//       Just an inMemory API. 
	
	
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
			console.log(projectId);
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
		
		
		return dfd.promise();
	}
	
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
		{id:"001",projectId:"001",done:false,title:"Get Milk (Organic)"},
		{id:"002",projectId:"001",done:false,title:"2 Avocado"},
		{id:"003",projectId:"001",done:false,title:"Mushroom"}
  ]
	
})();