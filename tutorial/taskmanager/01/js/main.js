var main = main || {};

// Best-Practice: always scope your code in function (here we use immediate javascript function)
(function(){
	
	main.projectListTestData = [
		{id:"001",title:"Grocery List"},
		{id:"002",title:"House Remodeling"},
		{id:"003",title:"Learn HTML5"},
		{id:"004",title:"Learn Brite"}
	]
	
	main.taskListTestData = [
		{id:"101",projectId:"001",done:false,title:"Heavy Whipping cream"},
		{id:"102",projectId:"001",done:true,title:"1 Garlic"},
		{id:"103",projectId:"001",done:false,title:"Mushrooms (cèpe)"},
		{id:"104",projectId:"001",done:false,title:"Fresh Pasta"}
  ]
})();