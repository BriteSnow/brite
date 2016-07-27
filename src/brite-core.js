'use strict';

var utils = require("./brite-utils.js");

// Only hard dependency
var $ = jQuery;

var core = {};

module.exports = core;

/**
 * @namespace brite is used to managed the lifescycle of UI components (create, display, and destroy)
 */
	
// Note: for now, document bound view events are just namespaced with the view_id


var cidSeq = 0;

var _componentDefStore = {};

// _templateLoadedPerComponentName[ComponentName] is defined and === true wne the template has been loaded
var _templateLoadedPerComponentName = {};

// when loading a component, we put a promise in this map
var _deferredByComponentName = {};

var _transitions = {};

// ------ Public API: Component Management ------ //

/**
 * MUST be called to register the component
 * 
 * @param {String}
 *            name the name of the component
 * 
 * @param {config}
 *            config a config object
 * 
 *            config.parent {String|jQuery} jquery selector, html element, jquery object (if not set, the the element will not be
 *            added in the rendering logic). <br />
 *            Note 1) If ctx.parent is absent from the component definition and from this method call, the brite
 *            will not append the returned element to the DOM. So, if ctx.parent is null, then the create() must
 *            take care of adding the elements to the DOM. However, the postDisplay will still be called.
 *
 *            config.animation (experimental) {String} the animation ("fromLeft" , "fromRight", or null) (default undefined)
 * 
 *            config.replace (experimental) {String|jQuery} jquery selector string, html element, or jquery object (default undefined) of the
 *            element to be replaced
 * 
 *            config.emptyParent {Boolean} (default false) if set/true will call empty() on the parent before adding the new element (default
 *            false). Valid only if no transition and build return an element
 * 
 *            config.unique (experimental) {Boolean} if true, the component will be display only if there is not already one component with
 *            the same name in the page.
 * 
 *            config.loadTmpl {Boolean|String} (default false) If true, then, it will load the template the first time this component is displayed.
 *                                                 If it is a string it use it as the file name to be loaded from the directory. If it starts with "/" then, it will be from the base, otherwise,
 *                                                 it will be relative to the template folder. The default template folder is "template/" but can be set by brite.config.tmplPath.
 *                                                 
 * 
 *            config.checkTmpl {Boolean|String|jQuery} (default false). (require config.loadTmpl) If true, it will check if the template for this component has been added, by default it will check "#tmpl-ComponentName". 
 *                                                                   If it is a string or jQuery, then it will be use with jQuery if it exists.
 *                                                                   Note that the check happen only the first time, then, brite will remember for subsequent brite.display  
 *                                     
 * @param {Object|Function}
 *            componentFactory (Required) Factory function or "object template" that will be used to create the
 *            object instance. If componentFactory is a plain object, the "object template" will be cloned to create
 *            the component instance. If it is a function, it will be called and a component instance object will be
 *            exptected as return value.<br />
 *            <br />
 * 
 * A "Component" object can have the following methods <br />
 * <br />
 *      component.create(data,config): (required) function that will be called with (data,config) to build the
 *                                     component.$element.<br />
 *      component.init(data,config): (optional) Will be called just after the create and the component instance has been
 *                                   initialized. <br />
 *      component.postDisplay(data,config): (optional) This method will get called with (data,config) after the component
 *                                          has been created and initialized (postDisplay is deferred for performance optimization) <br />
 *                                          Since this call will be deferred, it is a good place to do non-visible logic, such as event bindings.<br />
 *      component.destroy() (optional) This will get called when $.bRemove or $.bEmpty is called on a parent (or on the
 *                                     element for $.bRemove). It will get called before this component htmlElement will get removed<br />
 *      component.postDestroy() (optional) This will get called when $.bRemove or $.bEmpty is called on a parent (or on
 *                                         the element for $.bRemove). It will get called after this component htmlElement will get removed<br />
 * 
 */
core.registerView = function(name, arg1, arg2) {
	var def = {};
	def.name = name;
	def.componentFactory = (arg2)?arg2:arg1;
	var config = (arg2)?arg1:null; // no config if only two arguments
	def.config = $.extend({}, core.viewDefaultConfig,config);
	_componentDefStore[name] = def;

	// This resolve the deferred if we had a deferred component loading 
	// (old way, where the brite.register is in the template)
	var deferred = _deferredByComponentName[name];
	if (deferred) {
		deferred.resolve(def);
		delete _deferredByComponentName[name];
	}
};

/**
 * This just instantiate a new component for a given name. This is useful for manipulating the component off
 * lifecycle for performance. For example, sometime building a component and displaying in the background (with
 * z-index) allow the browser to do its caching magic, and can speed up the first appearance of the component when
 * it is due.
 * 
 * @param {string}
 *            name
 */
/* DEPRECATED for now
brite.instantiateComponent = function(name) {
	var loaderDeferred = loadComponent(name);
	return instantiateComponent(componentDef);
}
*/
// ------ /Public API: Component Management ------ //

// ------ Public API: Transition Management ------ //

// deprecated
core.registerTransition = function(name, transition) {
	_transitions[name] = transition;
};

// deprecated
core.getTransition = function(name) {
	return _transitions[name];
};
// ------ /Public API: Transition Management ------ //

// ------ Public API: Display Management ------ //

/**
 * This will create, init, and display a new view. It will load the view on demand if needed.
 * 
 * @param {String}
 *            name (required) the view name
 * @param {Element} HTML Element, jQuery element, or a jQuery selector, where the element will be added. 
 * @param {Object}
 *            data (optional, required if config) the data to be passed to the build and postDisplay.
 * @param {Object}
 *            config (optional) config override the component's config (see {@link brite.registerComponent} config
 *            params for description)
 * @return {Component} return the component instance.
 */
core.display = function(viewName, parent, data, config) {
	if (parent){
		config = config || {};
		config.parent = parent;
	}
	return process(viewName, data, config);
};

// deprecated
core.legacyDisplay = function(viewName, data, config) {
	var parent = (config)?config.parent:null;
	core.display(viewName,parent,data,config);
};



/**
 * Same as brite.display but bypass the build() step (postDisplay() will still be called). So, this will create a
 * new component and attach it to the $element and call postDisplay on it.
 * 
 */
core.attach = function(viewName, $element, data, config) {
	return process(viewName, data, config, $element);
};
// ------ /Public API: Display Management ------ //

// ------ Public Properties: Config ------ //
/**
 * Config for the brite module.
 * <ul>
 * <li><span class="light fixedFont">{String|jQuery}</span> <strong>config.componentsHTMLHolder</strong>
 * (default: "body") jQuery selector or object pointing to the element that will be used to add the loaded component
 * HTML.</li>
 * </ul>
 * 
 */
core.config = {
	componentsHTMLHolder: "body",
	tmplPath: "tmpl/", // deprecated
	jsPath: "js/", // deprecated
	cssPath: "css/", // deprecated
	tmplExt: ".tmpl"	// deprecated
};

core.viewDefaultConfig = {
	loadTmpl: false, // deprecated
	loadCss: false, // deprecated
	emptyParent : false,
	postDisplayDelay : 0
};
// ------ /Public Properties: Config ------ //

/**
 * Return the promise().<br />
 * 
 * <ul>
 * <li>It will load the component only if it not already loaded</li>
 * 
 * <li>As of now, the component is loaded by loading (via sync-AJAX class) and adding the "components/[name].html"
 * content to the "body" (can be overriden with brite.config.componentsHTMLHolder)</li>
 * 
 * <li> So, developers need to make sure of the following:<br /> - the "component/[name].html" exists (relative to
 * the current page) and does not contain any visible elements <br /> - the "component/[name].html" will call the
 * briteui.registerComponent([name],componentDef) <br />
 * </li>
 * </ul>
 * <br />
 * TODO: Needs to make the the component
 * 
 * @param {Object}
 *            name component name (no space or special character)
 * @return The loaderDeferred
 */
function loadComponent(name) {
	var loaderDeferred = $.Deferred();

	var loadComponentDefDfd = loadComponentDef(name);
	
	
	loadComponentDefDfd.done(function(componentDef){
		var loadTemplateDfd, loadCssDfd;
		// --------- Load the tmpl if needed --------- //
		var loadTemplate = componentDef.config.loadTmpl; 
		var url;
		if (loadTemplate && !_templateLoadedPerComponentName[name] ){
			// if we have a check template, we need to check if the template has been already loaded
			var needsToLoadTemplate = true;
			var checkTemplate = componentDef.config.checkTemplate;        
			if (checkTemplate){
				var templateSelector = (typeof checkTemplate == "string")?checkTemplate:("#tmpl-" + name);
				if ($(templateSelector).length > 0){
					needsToLoadTemplate = false;
				}         
			}

			if (needsToLoadTemplate){
				loadTemplateDfd = $.Deferred();
				// if it is a string, then, it is the templatename, otherwise, the component name is the name
				var templateName = (typeof loadTemplate == "string")?templateName:(name + ".html");
				url = null;
				if (typeof core.config.tmplPath === "function") {
					url = core.config.tmplPath(name);
				}else{
					url = core.config.tmplPath + name + core.config.tmplExt;
				}
				$.ajax({
					url : url,
					async : true
				}).complete(function(jqXHR) {
					$(core.config.componentsHTMLHolder).append(jqXHR.responseText);
					_templateLoadedPerComponentName[name] = true;
					loadTemplateDfd.resolve();
				});       
			}
			
		}
		// --------- /Load the tmpl if needed --------- //
		
		// --------- Load the css if needed --------- //
		var loadCss = componentDef.config.loadCss;
		if (loadCss){
			//TODO: need to add the checkCss support
			loadCssDfd = $.Deferred();
			url = null;
			if (typeof core.config.cssPath === "function") {
				url = core.config.cssPath(name);
			}else{
				url = core.config.cssPath + name + ".css";
			}
			var includeDfd = includeFile(url,"css");
			includeDfd.done(function(){
				loadCssDfd.resolve();
			}).fail(function(){
				if (console){
					console.log("Brite ERROR: cannot load " + url + ". Ignoring issue");
				}
				loadCssDfd.resolve();
			});      
		}
		// --------- /Load the Template if needed --------- //
		
		
		$.when(loadTemplateDfd,loadCssDfd).done(function(){
			loaderDeferred.resolve(componentDef);
		});
		
					
	});
	
	loadComponentDefDfd.fail(function(ex){
		if (console){
			console.log("BRITE-ERROR: Brite cannot load component: " + name + "\n\t " + ex);
		}
		loaderDeferred.reject();
	});
	
	return loaderDeferred.promise();
}

// Load the componentDef if needed and return the promise for it
function loadComponentDef(name){
	var dfd = $.Deferred();
	
	var componentDef = _componentDefStore[name];
	
	if (componentDef){
		dfd.resolve(componentDef);
	}else{
		var resourceFile = null;
		if (typeof core.config.jsPath === "function")
			resourceFile = core.config.jsPath(name);
		else
			resourceFile = core.config.jsPath + name + ".js";
		var includeDfd = includeFile(resourceFile,"js");
		includeDfd.done(function(){
			componentDef = _componentDefStore[name];
			if (componentDef){
				dfd.resolve(componentDef);
			}else{ 
				dfd.reject("Component js file [" + resourceFile + 
									"] loaded, but it did not seem to have registered the view - it needs to call brite.registerView('" + name + 
									"',...config...) - see documentation");        
			}
		}).fail(function(){
			dfd.reject("Component resource file " + resourceFile + " not found");
		});
	}
	
	return dfd.promise();
}

// if $element exist, then, bypass the create
function process(name, data, config, $element) {
	var loaderDeferred = loadComponent(name);

	var processDeferred = $.Deferred();

	var createDeferred = $.Deferred();
	var initDeferred = $.Deferred();
	var postDisplayDeferred = $.Deferred();

	var processPromise = processDeferred.promise();
	processPromise.whenCreate = createDeferred.promise();
	processPromise.whenInit = initDeferred.promise();
	processPromise.whenPostDisplay = postDisplayDeferred.promise();
	
	loaderDeferred.done(function(componentDef) {
		config = buildConfig(componentDef, config);
		var component = instantiateComponent(componentDef);

		// If the config.unique is set, and there is a component with the same name, we resolve the deferred now
		// NOTE: the whenCreate and whenPostDisplay won't be resolved again
		// TODO: an optimization point would be to add a "bComponentUnique" in the class for data-b-view that
		// have a confi.unique = true
		// This way, the query below could be ".bComponentUnique [....]" and should speedup the search significantly
		// on UserAgents that supports the getElementsByClassName
		if (config.unique) {
			var $component = $("[data-b-view='" + name + "']");
			if ($component.length > 0) {
				component = $component.bComponent();
				processDeferred.resolve(component);
				return processDeferred;
			}
		}

		// ------ create ------ //
		var deferred$element = $.Deferred();
		// if there is no element, we invoke the build
		if (!$element) {
			// Ask the component to create the new $element
			var createReturn = invokeCreate(component, data, config);
			// if it custom Deferred, then, assume it will get resolved with the $element (as by the API contract)
			if (createReturn && $.isFunction(createReturn.promise) && !createReturn.jquery) {
				// TODO: will need to use the new jQuery 1.6 pipe here (right now, just trigger on done)
				createReturn.done(function($element) {
					deferred$element.resolve($element);
				}).fail(function() {
					deferred$element.reject();
				});
			}
			// otherwise, if the $element is returned , resolve the deferred$element immediately
			else {
				if (createReturn) {
					$element = createReturn;
				}
				deferred$element.resolve($element);
			}
		}
		// if the $element is already here, then, it is an attach, so, do a immediate Deffered
		else {
			deferred$element.resolve($element);
		}
		// ------ /create ------ //

		// ------ render & resolve ------ //
		deferred$element.promise().done(function(createResult) {
			// if there is an element, then, manage the rendering logic.
			var $element;
			if (createResult) {
				if (typeof createResult === "string"){
					createResult = createResult.trim();
				}
				// make sure we get the jQuery object
				$element = $(createResult);

				bind$element($element, component, data, config);

				// attached the componentPromise to this $element, this way, during rendering sub component can sync
				// with it.
				$element.data("componentProcessPromise", processPromise);

				createDeferred.resolve(component);

				$.when(invokeInit(component, data, config)).done(function() {
					// render the element
					// TODO: implement deferred for the render as well.
					renderComponent(component, data, config);

					// TODO: this might need to be fore the renderComponent
					initDeferred.resolve(component);
				});

			} else {
				// TODO: need to look if we need this. Basically, that allow to have create methods that do/return
				// nothing but still instantiate the component
				createDeferred.resolve(component);

				// TODO: probably need to invokeInit in this case as well. For now, just resolve the initDeferred
				initDeferred.resolve(component);

			}

			processPromise.whenInit.done(function() {
				var parentComponentProcessPromise, invokePostDisplayDfd;

				// if there is a parent component, then need to wait until it display to display this one.
				if ($element && $element.parent()) {
					var parentComponent$Element = $element.parent().closest("[data-b-view]");

					if (parentComponent$Element.length > 0) {
						parentComponentProcessPromise = parentComponent$Element.data("componentProcessPromise");
						if (parentComponentProcessPromise){
							parentComponentProcessPromise.whenPostDisplay.done(function() {
								invokePostDisplayDfd = invokePostDisplay(component, data, config);
								invokePostDisplayDfd.done(function() {
									postDisplayDeferred.resolve(component);
								}).fail(function(err){
									postDisplayDeferred.reject(err);
								});
							});
						}
					}
				}

				// if we did not have any parentComponentProcessPromise, then, just invoke
				if (!parentComponentProcessPromise) {
					invokePostDisplayDfd = invokePostDisplay(component, data, config);
					invokePostDisplayDfd.done(function() {
						postDisplayDeferred.resolve(component);
					}).fail(function(err){
						postDisplayDeferred.reject(err);
					});
				}


			});

		});
		// ------ /render & resolve ------ //
		processPromise.whenPostDisplay.done(function() {
			processDeferred.resolve(component);
		}).fail(function(err){
			processDeferred.reject(err);
		});
	});

	loaderDeferred.fail(function(){
		processDeferred.reject();
		createDeferred.reject();
		initDeferred.reject();
		postDisplayDeferred.reject();
	});

	return processPromise;
}

function renderComponent(component, data, config) {
	var $parent;
	if (config.transition) {
		var transition = core.getTransition(config.transition);

		if (transition) {
			transition(component, data, config);
		} else {
			console.log("BRITE ERROR Transition [" + config.transition + "] not found. Transitions need to be registered via brite.registerTranstion(..) before call.");
		}
	}
	// if no transition remove/show
	else {
		if (config.replace) {
			$(config.replace).bRemove();
		}

		
		// note: if there is no parent, then, the sUI.diplay caller is responsible to add it
		if (config.parent) {
			$parent = $(config.parent);
			if ($parent.length > 0){
				if (config.emptyParent) {
					$parent.bEmpty();
				}
				$parent.append(component.$el);
			}else{
				if (console){
					console.log("BRITE WARNING - parent ", config.parent, " not found when displaying", component);
				}
			}
		}else {
			if (console){
				console.log("BRITE WARNING - no parent specified ", component, config);
			}
		}
	}

}

// ------ Helpers ------ //
// build a config for a componentDef
function buildConfig(componentDef, config) {
	var instanceConfig = $.extend({}, componentDef.config, config);
	instanceConfig.componentName = componentDef.name;
	return instanceConfig;
}

function instantiateComponent(componentDef) {
	var component;
	var componentFactory = componentDef.componentFactory;
	if (componentFactory) {
		// if it is a function, call it, it should return a new component object
		if ($.isFunction(componentFactory)) {
			component = componentFactory();
		}
		// if it is a plainObject, then, we clone it (NOTE: We do a one level clone)
		else if ($.isPlainObject(componentFactory)) {
			component = $.extend({}, componentFactory);
		} else {
			console.log("BRITE ERROR - Invalid ComponentFactory for component [" + componentDef.componentName +
											"]. Only types Function or Object are supported as componentFactory. Empty component will be created.");
		}
	} else {
		console.log("BRITE ERROR - No ComponentFactory for component [" + componentDef.componentName + "]");
	}

	if (component) {
		component.name = componentDef.name;
		// .cid is a legacy property, .id is the one to use. 
		component.cid = component.id = "bview_" + cidSeq++;
	}
	return component;
}

function invokeCreate(component, data, config) {
	// backward compatibility
	var createFunc = component.create || component.build;
	// assert that we have a build method
	if (!createFunc || !$.isFunction(createFunc)) {
		console.log("BRITE ERROR - Invalid 'create' function for component [" + component.name + "].");
		return;
	}
	return createFunc.call(component, data, config);
}

function invokeInit(component, data, config) {
	var initFunc = component.init;
	if ($.isFunction(initFunc)) {
		return initFunc.call(component, data, config);
	}
}
// 
function bind$element($element, component, data, config) {
	component.el = $element[0];
	// component.$element is for deprecated, .$el is te way to access it. 
	component.$el = component.$element = $element; 
	$element.data("bview", component);

	$element.attr("data-b-view", config.componentName);
	$element.attr("data-brite-cid", component.cid);
}

// Note: This will be called even if .postDisplay is not defined (test is inside this method)
//       So, we do the view events binding here. 
function invokePostDisplay(component, data, config) {
	var invokeDfd = $.Deferred();

	// bind the view events
	if (component.events){
		bindEvents(component.events,component.$el,component);
	}
	
	// bind the document events (note: need to have a namespace since they will need to be cleaned up)
	if (component.docEvents){
		bindEvents(component.docEvents,$(document),component, utils.DOC_EVENT_NS_PREFIX + component.id);
	}
	
	// bind the window events if present
	if (component.winEvents){
		bindEvents(component.winEvents,$(window),component, utils.WIN_EVENT_NS_PREFIX + component.id);
	}
	
	if (component.parentEvents){
		$.each(component.parentEvents,function(key, val){
			var parent = component.$el.bView(key);
			if (parent){
				var events = component.parentEvents[key];
				bindEvents(events,parent.$el,component,"." + component.id);
			}
		});
	}
	
	bindDaoEvents(component);

	// Call the eventual postDisplay
	// (differing for performance)
	if (component.postDisplay) {
		// if the component has a delay >= 0, then, we use a setTimeout
		if (config.postDisplayDelay >= 0) {
			setTimeout(function() {
				performPostDisplay(component, data, config, invokeDfd);
			}, config.postDisplayDelay);
		}
		// otherwise, we call it in sync
		else {
			performPostDisplay(component, data, config, invokeDfd);
		}
	}
	// if there is now postDisplay, then, trigger it anyway
	else {
		invokeDfd.resolve();
	}

	return invokeDfd.promise();
}

function performPostDisplay(component, data, config, invokeDfd){
	if (!component.$el){
		invokeDfd.reject("BRITE ERROR cannot call postDisplay a view already deleted " + ((component)?component.name:""));
		return;
	}
	var postDisplayDfd = component.postDisplay(data, config);
	if (postDisplayDfd && $.isFunction(postDisplayDfd.promise)) {
		postDisplayDfd.done(function() {
			invokeDfd.resolve();
		});
	} else {
		invokeDfd.resolve();
	}		
}

function bindEvents(eventMap,$baseElement,component,namespace){
	$.each(eventMap,function(edef,etarget){
		
		var edefs = edef.split(";");
		// get the event name(s) (space seperated)
		var ename = edefs[0];

		// If we have a namespace, add the namspace to each name 
		if (namespace) {
			ename = $.map($.trim(ename).split(' '), function(val) {
				return val + namespace;
			}).join(' ');
		} 

		var eselector = edefs[1]; // can be undefined, but in this case it is direct.

		var efn = getFn(component,etarget);
		if (efn){
			$baseElement.on(ename,eselector,function(){
				var args = $.makeArray(arguments);
				efn.apply(component,args);
			});
		}else{
			throw "BRITE ERROR: '" + component.name + "' component event handler function '" + etarget + "' not found."; 
		}
	});		
}

function bindDaoEvents(component){
	var daoEvents = component.daoEvents;
	
	if (component.daoEvents){
		// for now, the namespace is just the component id
		var ns = component.id;
		$.each(daoEvents,function(edef,etarget){
			var efn = getFn(component,etarget);
			if (efn){
				var edefs = edef.split(";");
				var ename = edefs[0];
				ename = ename.charAt(0).toUpperCase() + ename.slice(1);
				var eventTypes = edefs[1];
				var entityTypes = edefs[2];
				brite.dao["on" + ename](eventTypes,entityTypes,function(){
					var args = $.makeArray(arguments);
					efn.apply(component,args);						
				},ns);
			}else{
				throw "BRITE ERROR: '" + component.name + "' component daoEvent handler function '" + etarget + "' not found.";
			}
		});
	}
}

function getFn(component,target){
	var fn = target;
	if (!$.isFunction(fn)){
		fn = component[target];
	}
	return fn;		
}
// ------ /Helpers ------ //

// --------- File Include (JS & CSS) ------ //
/*
 * Include the file name in the <head> part of the DOM and return a deferred that will resolve when done
 */
function includeFile(fileName, fileType) {
	var dfd = $.Deferred();
	var fileref;
	if(fileType === "js") {
		fileref = document.createElement('script');
		fileref.setAttribute("type", "text/javascript");
		fileref.setAttribute("src", fileName);
	} else if(fileType === "css") {
		fileref = document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", fileName);
	}
	
	if (fileType === "js"){
		if (fileref.addEventListener){
			fileref.onload = function(){
				dfd.resolve(fileName);
			};
		}else{ // for old IE
			// TODO: probably need to handle the error case here
			fileref.onreadystatechange = function(){
				if (fileref.readyState === "loaded" || fileref.readyState === "complete"){
					dfd.resolve(fileName);
				}
			};
		}
		
		if (fileref.addEventListener){
			fileref.addEventListener('error', function(){
				dfd.reject();
			}, true);
		}
	}else if (fileType === "css"){
		if (document.all){
			// The IE way, which is interestingly the most standard
			fileref.onreadystatechange = function() {
				var state = fileref.readyState;
				if (state === 'loaded' || state === 'complete') {
					fileref.onreadystatechange = null;
					dfd.resolve(fileName);
				}
			};
		}else{
			
			// unfortunately, this will rarely be taken in account in modern browsers
			if (fileref.addEventListener) {
				fileref.addEventListener('load', function() {
					dfd.resolve(fileName);
				}, false);
			}

			// hack from: http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
			var html = document.getElementsByTagName('html')[0];
			var img = document.createElement('img');
			$(img).css("display","none"); // hide the image
			img.onerror = function(){
				html.removeChild(img);
				// for css, we cannot know if it fail to load for now
				dfd.resolve(fileName);
			};
			html.appendChild(img);
			img.src = fileName;      
		}
	}
	
	if( typeof fileref != "undefined") {
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}
	
	return dfd.promise();
}
// --------- /File Include (JS & CSS) ------ //




