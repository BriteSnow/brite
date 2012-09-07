var main = main || {};


// the data see
(function(){
	
	var seedProjects = [
		{id:"001",title:"Grocery List"},
		{id:"002",title:"House Remodeling"},
		{id:"003",title:"Learn HTML5"},
		{id:"004",title:"Learn Brite"}
	]
	
	var seedTasks = [
		{id:"101",projectId:"001",done:false,title:"Heavy Whipping cream"},
		{id:"102",projectId:"001",done:true,title:"1 Garlic"},
		{id:"103",projectId:"001",done:false,title:"Mushrooms (cèpe)"},
		{id:"104",projectId:"001",done:false,title:"Fresh Pasta"},
		
		{id:"201",projectId:"002",done:true,title:"Take room dimensions"},
		{id:"202",projectId:"002",done:true,title:"Make sketches with iPad app"},
		{id:"203",projectId:"002",done:false,title:"Hire architect to review sketches"},
		{id:"204",projectId:"002",done:false,title:"Hire engineer to finish plan"},
		{id:"205",projectId:"002",done:false,title:"Hire contractors"},
		
		{id:"301",projectId:"003",done:true,title:"Brush up HTML, JS, and CSS skills"},
		{id:"302",projectId:"003",done:false,title:"Checkout html5rocks.com for new HTML5 features"},
		{id:"303",projectId:"003",done:false,title:"Learn Object Oriented with JavaScript"},
		{id:"304",projectId:"003",done:false,title:"Learn application layout with HTML and CSS"},
		{id:"305",projectId:"003",done:false,title:"Learn"},
		
		{id:"301",projectId:"004",done:false,title:"Learn HTML5"},
		{id:"302",projectId:"004",done:false,title:"Learn D-MVC (DOM centric MVC)"},
		{id:"303",projectId:"004",done:true,title:"Forget Sencha type: $('.sencha').delete()"},
		{id:"304",projectId:"004",done:false,title:"Build an amazing HTML5 application the DOM way and not the desktop way"}
  ]
  
  main.projectDao = brite.registerDao("Project",new brite.InMemoryDao(seedProjects));
  
  main.taskDao = brite.registerDao("Task",new brite.InMemoryDao(seedTasks));	
	
	
})();