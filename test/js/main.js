// Common JS methods


// Just a little indirection to render a template using handlebars.
// This simple indirection allows much flexibility later one, 
// when using pre-compiling or other templating engine are needed.
Handlebars.templates = Handlebars.templates || {}; 
// make all templates partials (no reasons why they should not)
Handlebars.partials =  Handlebars.templates;

// The function is common enough to be in a global scope, however, can be move in a module. 
function render(templateName,data){
	// first we check if the template is already compile (pre-compile or already compiled)
	var tmpl = Handlebars.templates[templateName];

	// if no template, try to find it, compile it, and put it in the cache
	if (!tmpl){
		var html = $("#" + templateName).html();
		if (!html){
			throw "Not template found in pre-compiled and in DOM for " + templateName;
		}
		tmpl = Handlebars.compile(html);
		Handlebars.templates[templateName] = tmpl;
	}
	// run the template (handlebars templates get compiled into function)
	return tmpl(data);
}


// --------- Very Basic Unit Testing --------- //
// Assume that we have a #message div in the page
function error(msg){
	var $message = $("#message");
	$message.css("background","red");
	$message.html(msg);
}

function success(msg){
	var $message = $("#message");
	$message.css("background","#dfd");
	$message.html(msg);
}

function assertEquals(expected, actual, msg){
	if (expected === actual){
		success("" + actual + " - " + msg);
	}else{
		var errorMsg = "expected: " + expected + " but got: " + actual + " - " + msg;
		error(errorMsg);
		throw errorMsg;
	}
}

// --------- /Very Basic Unit Testing --------- //