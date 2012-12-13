var main = main || {};

/* Best-Practice: Here we are telling brite to load the /tmpl/ViewName.tmpl and /css/ViewName.css
                  on demand. This is good for development, but on production, the .css might might concatinated and minimized into a single file.
                  Nevertheless, for scalable development, this is very useful since multiple developers can work on various views without 
                  having to all change the same file.
*/
brite.viewDefaultConfig.loadTmpl = true;
brite.viewDefaultConfig.loadCss = true;



// Just a little indirection to render a template using handlebars
// (this allows much flexibility, when using pre-compiled or other templating engine)
Handlebars.templates = Handlebars.templates || {};	
function render(templateName,data){
	var tmpl = Handlebars.templates[templateName];
	
	if (!tmpl){
		var tmplContent = $("#" + templateName).html();
		tmpl = Handlebars.compile(tmplContent);
		Handlebars.templates[templateName] = tmpl;		
	}
	return tmpl(data);
}


// the document is ready, we display the MainView (which will display the sub views) 
$(function(){
	if($.browser.opera){
		$("body").addClass("is-opera");
	}
		
  brite.display("MainView","#pageBody");
});



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
		
		{id:"401",projectId:"004",done:false,title:"Learn HTML5"},
		{id:"402",projectId:"004",done:false,title:"Learn D-MVC (DOM centric MVC)"},
		{id:"403",projectId:"004",done:true,title:"Forget Sencha type: $('.sencha').delete()"},
		{id:"404",projectId:"004",done:false,title:"Build an amazing HTML5 application the DOM way and not the desktop way"}
  ]
  
  main.projectDao = brite.registerDao(new brite.InMemoryDaoHandler("Project",seedProjects));
  
  main.taskDao = brite.registerDao(new brite.InMemoryDaoHandler("Task",seedTasks));	
	
	
})();