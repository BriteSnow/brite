//TODO: needs to make it "reload safe"
var brite = brite || {};

brite.version = "0.9-snapshot";

// ---------------------- //
// ------ brite ------ //

/**
 * @namespace brite is used to managed the lifescycle of UI components (create, display, and destroy)
 * 
 */
(function($) {
  
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
	 * 												   it will be relative to the template folder. The default template folder is "template/" but can be set by brite.config.tmplPath.
	 *                                                 
	 * 
	 *            config.checkTmpl {Boolean|String|jQuery} (default false). (require config.loadTmpl) If true, it will check if the template for this component has been added, by default it will check "#tmpl-ComponentName". 
	 *                                                                   If it is a string or jQuery, then it will be use with jQuery if it exists.
	 *                                       							 Note that the check happen only the first time, then, brite will remember for subsequent brite.display  
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
	 * 								      initialized. <br />
	 *      component.postDisplay(data,config): (optional) This method will get called with (data,config) after the component
	 *                                          has been created and initialized (postDisplay is deferred for performance optimization) <br />
	 *                                          Since this call will be deferred, it is a good place to do non-visible logic, such as event bindings.<br />
	 *      component.destroy() (optional) This will get called when $.bRemove or $.bEmpty is called on a parent (or on the
	 *                                     element for $.bRemove). It will get called before this component htmlElement will get removed<br />
	 *      component.postDestroy() (optional) This will get called when $.bRemove or $.bEmpty is called on a parent (or on
	 *                                         the element for $.bRemove). It will get called after this component htmlElement will get removed<br />
	 * 
	 */
	brite.registerComponent = function(name, config, componentFactory) {
		var def = {};
		def.name = name;
		def.componentFactory = componentFactory;
		def.config = $.extend({}, this.defaultComponentConfig,config);
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
	brite.instantiateComponent = function(name) {
		var loaderDeferred = loadComponent(name);
		return instantiateComponent(componentDef);
	}
	// ------ /Public API: Component Management ------ //

	// ------ Public API: Transition Management ------ //
	brite.registerTransition = function(name, transition) {
		_transitions[name] = transition;
	}

	brite.getTransition = function(name) {
		return _transitions[name];
	}
	// ------ /Public API: Transition Management ------ //

	// ------ Public API: Display Management ------ //

	/**
	 * This will create, init, and display a new component. It will load the component on demand if needed.
	 * 
	 * @param {String}
	 *            name (required) the component name
	 * @param {Object}
	 *            data (optional, required if config) the data to be passed to the build and postDisplay.
	 * @param {Object}
	 *            config (optional) config override the component's config (see {@link brite.registerComponent} config
	 *            params for description)
	 * @return {Component} return the component instance.
	 */
	brite.display = function(componentName, data, config) {
		return process(componentName, data, config);
	};

	/**
	 * Same as brite.display but bypass the build() step (postDisplay() will still be called). So, this will create a
	 * new component and attach it to the $element and call postDisplay on it.
	 * 
	 */
	brite.attach = function(componentName, $element, data, config) {
		return process(componentName, data, config, $element);
	}
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
	brite.config = {
		componentsHTMLHolder: "body",
		tmplPath: "tmpl/",
		tmplExt: ".tmpl"
		
	}

	brite.defaultComponentConfig = {
	  loadTmpl: false,
	  loadCss: false,
		emptyParent : false,
		postDisplayDelay : 0
	}
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
          $.ajax({
            url : brite.config.tmplPath + name + brite.config.tmplExt,
            async : true
          }).complete(function(jqXHR, textStatus) {
            $(brite.config.componentsHTMLHolder).append(jqXHR.responseText);
            _templateLoadedPerComponentName[name] = true;
            loadTemplateDfd.resolve();
          });       
        }
        
      }
      // --------- /Load the tmpl if needed --------- //
      
      // --------- Load the css if needed --------- //
      var loadCss = brite.defaultComponentConfig.loadCss;
      if (loadCss){
        //TODO: need to add the checkCss support
        loadCssDfd = $.Deferred();
        var cssFileName = "css/" + name + ".css";
        var includeDfd = includeFile(cssFileName,"css");
        includeDfd.done(function(){
          loadCssDfd.resolve();
        }).fail(function(){
          console.log("Brite ERROR: cannot load " + cssFileName + ". Ignoring issue");
          loadCssDfd.resolve();
        });      
      }
      // --------- /Load the Template if needed --------- //
      
      
      $.when(loadTemplateDfd,loadCssDfd).done(function(){
        loaderDeferred.resolve(componentDef);
      });
      
      		  
		});
		
		loadComponentDefDfd.fail(function(ex){
		  console.log("BRITE-ERROR: Brite cannot load component: " + name + "\n\t " + ex);
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
      var resourceFile = "js/" + name + ".js";
      var includeDfd = includeFile(resourceFile,"js");
      includeDfd.done(function(){
        componentDef = _componentDefStore[name];
        if (componentDef){
          dfd.resolve(componentDef);
        }else{ 
          dfd.reject("Component js file [" + resourceFile + 
                     "] loaded, but it did not seem to have registered the component - it needs to call brite.registerComponent('" + name + 
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
			// TODO: an optimization point would be to add a "bComponentUnique" in the class for data-brite-component that
			// have a confi.unique = true
			// This way, the query below could be ".bComponentUnique [....]" and should speedup the search significantly
			// on UserAgents that supports the getElementsByClassName
			if (config.unique) {
				var $component = $("[data-brite-component='" + name + "']");
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
					// TODO: will need to use the new jQuery 1.6 pipe here (right now, just trigger on done
					createReturn.done(function($element) {
						deferred$element.resolve($element);
					}).fail(function() {
						deferred$element.reject();
					});
				}
				// otherwise, if the $element is returned , resolve the deferred$element immediately
				else {
					if (createReturn) {
						$element = $(createReturn);
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
			deferred$element.promise().done(function($element) {
				// if there is an element, then, manage the rendering logic.
				if ($element) {
					// make sure we get the jQuery object
					$element = $($element);

					bind$element($element, component, data, config);

					// attached the componentPromise to this $element, this way, during rendering sub component can sync
					// with it.
					$element.data("componentProcessPromise", processPromise);

					createDeferred.resolve(component);

					$.when(invokeInit(component, data, config)).done(function() {
						// render the element
						// TODO: implement deferred for the render as well.
						renderComponent(component, data, config);

						initDeferred.resolve(component);

					});

				} else {
					// TODO: need to look if we need this. Basically, that allow to have create methods that do/return
					// nothing but still instantiate the component
					createDeferred.resolve(component);

					// TODO: probably need to invokeInit in thi scase as well. For now, just resolve the initDeferred
					initDeferred.resolve(component);

				}

				processPromise.whenInit.done(function() {
					var parentComponentProcessPromise, invokePostDisplayDfd;

					// if there is a parent component, then need to wait until it display to display this one.
					if ($element && $element.parent()) {
						var parentComponent$Element = $element.parent().closest("[data-brite-component]");

						if (parentComponent$Element.length > 0) {
							parentComponentProcessPromise = parentComponent$Element.data("componentProcessPromise");
							if (parentComponentProcessPromise){
								parentComponentProcessPromise.whenPostDisplay.done(function() {
									invokePostDisplayDfd = invokePostDisplay(component, data, config);
									invokePostDisplayDfd.done(function() {
										postDisplayDeferred.resolve(component);
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
						});
					}

				});

			});
			// ------ /render & resolve ------ //
			// console.log
			processPromise.whenPostDisplay.done(function() {
				processDeferred.resolve(component);
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

		if (config.transition) {
			var transition = brite.getTransition(config.transition);

			if (transition) {
				transition(component, data, config);
			} else {
				brite.log.error("Transition [" + config.transition + "] not found. Transitions need to be registered via brite.registerTranstion(..) before call.");
			}
		}
		// if no transition remove/show
		else {
			if (config.replace) {
				$(config.replace).bRemove();
			}

			// note: if there is no parent, then, the sUI.diplay caller is reponsible to add it
			if (config.parent) {
				if (config.emptyParent) {
					$(config.parent).bEmpty();
				}
				$(config.parent).append(component.$element);
			}
		}

	}
	;

	// ------ Private Helpers ------ //
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
				brite.log.error("Invalid ComponentFactory for component [" + componentDef.componentName
						+ "]. Only types Function or Object are supported as componentFactory. Empty component will be created.");
			}
		} else {
			brite.log.error("No ComponentFactory for component [" + componentDef.componentName + "]");
		}

		if (component) {
			component.name = componentDef.name;
			component.cid = cidSeq++;
		}
		return component;
	}

	function invokeCreate(component, data, config) {
		// backward compatibility
		var createFunc = component.create || component.build;
		// assert that we have a build method
		if (!createFunc || !$.isFunction(createFunc)) {
			brite.log.error("Invalid 'create' function for component [" + component.name + "].");
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
		component.$element = $element;
		$element.data("component", component);

		$element.attr("data-brite-component", config.componentName);
		$element.attr("data-brite-cid", component.cid);
	}

	function invokePostDisplay(component, data, config) {
		var invokeDfd = $.Deferred();

		// Call the eventual postDisplay
		// (differing for performance)
		if (component.postDisplay) {
			// if the component has a delay >= 0, then, we use a setTimeout
			if (config.postDisplayDelay >= 0) {
				setTimeout(function() {
					var postDisplayDfd = component.postDisplay(data, config);
					if (postDisplayDfd && $.isFunction(postDisplayDfd.promise)) {
						postDisplayDfd.done(function() {
							invokeDfd.resolve();
						});
					} else {
						invokeDfd.resolve();
					}
				}, config.postDisplayDelay);
			}
			// otherwise, we call it in sync
			else {

				var postDisplayDfd = component.postDisplay(data, config);
				if (postDisplayDfd && $.isFunction(postDisplayDfd.promise)) {
					postDisplayDfd.done(function() {
						invokeDfd.resolve();
					});
				} else {
					invokeDfd.resolve();
				}
			}
		}
		// if there is now postDisplay, then, trigger it anyway
		else {
			invokeDfd.resolve();
		}

		return invokeDfd.promise();
	}
	// ------ /Private Helpers ------ //

  // --------- File Include (JS & CSS) ------ //
  /*
   * Include the file name in the <head> part of the DOM and return a deferred that will resolve when done
   */
  function includeFile(fileName, fileType) {
    var dfd = $.Deferred();
    
    if(fileType === "js") {
      var fileref = document.createElement('script');
      fileref.setAttribute("type", "text/javascript");
      fileref.setAttribute("src", fileName);
    } else if(fileType === "css") {
      var fileref = document.createElement("link");
      fileref.setAttribute("rel", "stylesheet");
      fileref.setAttribute("type", "text/css");
      fileref.setAttribute("href", fileName);
    }
    
    if (fileType === "js"){
      // TODO: need to add support for IE
      fileref.onload = function(){
        dfd.resolve(fileName);
      }
      
      fileref.addEventListener('error', function(){
        dfd.reject();
      }, true);
    }else if (fileType === "css"){
      // hack from: http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
      var html = document.getElementsByTagName('html')[0];
      var img = document.createElement('img');
      $(img).css("display","none"); // hide the image
      img.onerror = function(){
        html.removeChild(img);
        // for css, we cannot know if it fail to load for now
        dfd.resolve(fileName);
      }
      html.appendChild(img);
      img.src = fileName;      
    }
    
    
    
    if( typeof fileref != "undefined") {
      document.getElementsByTagName("head")[0].appendChild(fileref);
    }
    
    return dfd.promise();
  }

  // --------- /File Include (JS & CSS) ------ //

})(jQuery);

// ------ brite ------ //
// ---------------------- //

(function($) {
	/**
	 * @namespace
	 * 
	 * briteUI jQuery extensions.
	 */
	$.fn = $.fn;

	/**
	 * 
	 * Return the component that this html element belong to. Thi traverse the tree backwards (this html element up to
	 * document) to find the closest html element containing the brite component for this name.
	 * 
	 * If a componentName is given then it will try to find the given component.
	 * 
	 * If no componentName is given, then it will return the first component found.
	 * 
	 * For example:
	 * 
	 * @example var myComponent = $(thisDiv).bComponent("myComponent");
	 * 
	 * @param {String}
	 *            componentName The component name to be match when traversing the tree, if undefined, then, the
	 *            closestComponent will be return.
	 * 
	 */
	$.fn.bComponent = function(componentName) {

		// iterate and process each matched element
		var $componentElement;
		if (componentName) {
			$componentElement = $(this).closest("[data-brite-component='" + componentName + "']");
		} else {
			$componentElement = $(this).closest("[data-brite-component]");
		}

		return $componentElement.data("component");

	};

	/**
	 * Get the list of components that this htmlElement contains.
	 * 
	 * @param {string}
	 *            componentName (optional) if present, will filter only the component with this matching name
	 * @return a javascript array of all the match component
	 */
	$.fn.bFindComponents = function(componentName) {
		var childrenComponents = [];

		this.each(function() {
			var $this = $(this);

			var $componentElements;

			if (componentName) {
				$componentElements = $(this).find("[data-brite-component='" + componentName + "']");
			} else {
				$componentElements = $(this).find("[data-brite-component]");
			}

			$componentElements.each(function() {
				var $component = $(this);
				childrenComponents.push($component.data("component"));
			});
		});

		return childrenComponents;
	}

	/**
	 * Get the list of components that this htmlElement contains.
	 * 
	 * @param {string}
	 *            componentName (optional) if present, will filter only the component with this matching name
	 * @return a javascript array of all the match component
	 */
	$.fn.bFindFirstComponent = function(componentName) {
		var childrenComponents = [];

		this.each(function() {
			var $this = $(this);

			var $componentElements;

			if (componentName) {
				$componentElements = $(this).find("[data-brite-component='" + componentName + "']:first");
			} else {
				$componentElements = $(this).find("[data-brite-component]:first");
			}

			$componentElements.each(function() {
				var $component = $(this);
				childrenComponents.push($component.data("component"));
			});
		});

		return childrenComponents;
	}

	/**
	 * Safely empty a HTMLElement of its children HTMLElement and bComponent by calling the preRemove and postRemove on
	 * every child components.
	 * 
	 * @return the jQuery object
	 */
	$.fn.bEmpty = function() {
		return this.each(function() {
			var $this = $(this);

			var componentChildren = $this.bFindComponents();

			// call the preRemoves
			$.each(componentChildren, function(idx, childComponent) {
				processDestroy(childComponent);
			});

			// do the empty
			$this.empty();

			// call the postRemoves
			$.each(componentChildren, function(idx, childComponent) {
				processPostDestroy(childComponent);
			});
		});
	}

	/**
	 * Safely remove a HTMLElement and the related bComponent by calling the preRemote and postRemove on every child
	 * components as well as this component.
	 * 
	 * @return what a jquery.remove would return
	 */
	$.fn.bRemove = function() {

		return this.each(function() {
			var $this = $(this);
			$this.bEmpty();

			if ($this.is("[data-brite-component]")) {
				var component = $this.data("component");
				processDestroy(component);

				$this.remove();

				processPostDestroy(component);
			} else {
				$this.remove();
			}
		});

	}

	function processDestroy(component) {
		// The if(component) is a safeguard in case destroy gets call twice (issue when clicking fast on
		// test_brite-02-transition....)
		if (component) {
			// TODO: Need to remove the "preRemove" We should support only destroy
			var destroyFunc = component.destroy || component.preRemove;

			if ($.isFunction(destroyFunc)) {
				destroyFunc.call(component);
			}
		}
	}

	function processPostDestroy(component) {
		// The if(component) is a safeguard in case destroy gets call twice (issue when clicking fast on
		// test_brite-02-transition....)
		if (component) {
			// TODO: Need to remove the "preRemove" We should support only postDestroy
			var postDestoryFunc = component.postDestroy || component.postRemove;

			if ($.isFunction(postDestoryFunc)) {
				postDestoryFunc.call(component);
			}
		}
	}

})(jQuery);

// -------------------------- //
// ------ brite.log ------ //
// for now, just support console.log
// TODO: needs to support logger printer, formatter, and listener
(function($) {

	var INFO = "INFO", ERROR = "ERROR", DEBUG = "DEBUG";

	// TODO: needs to add the ability to add printers
	var printers = null;

	/**
	 * @namespace
	 * 
	 * Convenient
	 */
	brite.log = {

		/**
		 * @namespace
		 * 
		 */
		config : {
			/**
			 * Tell to print the debug message or not (default: false).
			 * 
			 * @type Boolean
			 */
			debugMode : false,

			/**
			 * Tell to print the log message to the console (default: true).
			 */
			consoleLog : true
		},
		/**
		 * Log info.
		 * 
		 * @param {String}
		 *            text
		 */
		info : function(text) {
			printLog(text);
		},

		/**
		 * 
		 * @param {String}
		 *            text
		 */
		error : function(text) {
			printLog(text, ERROR);
		},

		/**
		 * Log the debug message. By default the brite.log.config.debugMode=false (so, it needs to be set to "true").
		 * <br />
		 * <br />
		 * See {@link brite.log.config}
		 * 
		 * @param {String}
		 *            text
		 */
		debug : function(text) {
			if (brite.log.config.debugMode) {
				printLog(text, DEBUG);
			}
		},

		/**
		 * Add printer (the print function has two argement text and type
		 */
		addPrinter : function(printerFunc) {
			printers = printers || [];
			printers.push(printerFunc);
		}

	};

	function printLog(text, type) {
		// TODO: needs to go through the registered "loggers"

		if (brite.log.config.consoleLog) {
			printToConsole(text, type);
		}

		if (printers) {
			var printerFunc, computedType = type || INFO;
			for ( var i = 0, l = printers.length; i < l; i++) {
				printerFunc = printers[i];
				printerFunc(text, computedType);
			}
		}
	}

	function printToConsole(text, type) {
		if (window.console && window.console.log) {
			if (type) {
				text = type + " - " + text;
			}
			console.log(text);
		}
	}
	;
})(jQuery);

// ------ brite.log ------ //
// -------------------------- //

// ------------------------ //
// ------ brite utils ------ //

(function($) {
	// Private array of chars to use
	var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

	/**
	 * Create a random id. <br />
	 * <br />
	 * Code from: Math.uuid 2010 Robert Kieffer http://www.broofa.com
	 * 
	 * 
	 * @example brite.uuid(); // returns "92329D39-6F5C-4520-ABFC-AAB64544E172" brite.uuid(15); // 15
	 *          character ID (default base=62), returns "VcydxgltxrVZSTV" brite.uuid(8, 2); // returns "01001010"
	 * 
	 * @param {Number}
	 *            len (optional) length in char of the returned random ID. If absent, the standard UUID format will be
	 *            returned
	 * @param {Number}
	 *            radix (optional) radix of the random number. (Default: 62)
	 */
	brite.uuid = function(len, radix) {
		var chars = CHARS, uuid = [];
		radix = radix || chars.length;
		len = len || 10;
		for ( var i = 0; i < len; i++){
			uuid[i] = chars[0 | Math.random() * radix];
		}
		return uuid.join('');
	};

	/**
	 * Return the value from this rootObj with the "." delimited path name.
	 * 
	 * Return undefined if any of the node going down is undefined.
	 * 
	 * @param {Object}
	 *            rootObj this is the root obj to start from
	 * @param {String}
	 *            pathToValue this is the "." delimited path to the value
	 * 
	 * @example brite.value({contact:{firstName:"Mike"}},"contact.firstName"); // return Mike
	 * 
	 */
	brite.value = function(rootObj, pathToValue) {
		if (!rootObj) {
			return rootObj;
		}
		// for now, return the rootObj if the pathToValue is empty or null or undefined
		if (!pathToValue) {
			return rootObj;
		}
		var result;
		var i, l, names = pathToValue.split(".");
		var iName, iVal = rootObj;
		for (i = 0, l = names.length; i < l; i++) {
			iName = names[i];
			if (iVal == null) {
				return undefined;
			}
			iVal = iVal[iName];
			if (typeof iVal === "undefined") {
				return iVal;
			}
		}
		return iVal;
	}

  // substract all the values for two object (ignore the not numbers one), and return the new object.
  brite.substract = function(obj1,obj2){
    var r = {};
    $.each(obj1,function(key,val1){
      var val2 = obj2[key];
      if (!isNaN(val1) && !isNaN(val2)){
        r[key] = val1 - val2;
      }
    });
      
   return r;
  }
  
  // add all the values for two object (ignore the not numbers one), and return the new object.
  brite.add = function(obj1,obj2){
    var r = {};
    $.each(obj1,function(key,val1){
      var val2 = obj2[key];
      if (!isNaN(val1) && !isNaN(val2)){
        r[key] = val1 + val2;
      }
    });
      
   return r;
  }
  

	/**
	 * @namespace
	 * 
	 * Array utilities
	 */
	brite.array = {

		/**
		 * Remove item(s) from an array.
		 * Code from: Array Remove - By John Resig (MIT Licensed)
		 * 
		 * @param {Object}
		 *            a the Array
		 * @param {Object}
		 *            from the first index to remove from
		 * @param {Object}
		 *            to (optional) the last index to remove
		 */
		remove : function(a, from, to) {
			var rest = a.slice((to || from) + 1 || a.length);
			a.length = from < 0 ? a.length + from : from;
			return a.push.apply(a, rest);
		},

		/**
		 * For a array of object, this will get the first index of the matching prop name/value return -1 if no match
		 * 
		 * @param {Object}
		 *            a the Array
		 * @param {Object}
		 *            propName the property name
		 * @param {Object}
		 *            propValue the property value to be matched
		 */
		getIndex : function(a, propName, propValue) {
			if (a && propName && typeof propValue != "undefined") {
				var i, obj, l = a.length;
				for ( var i = 0; i < l; i++) {
					obj = a[i];
					if (obj && obj[propName] === propValue) {
						return i;
					}
				}
			}
			return -1;
		},
		
		getItem : function(a, propName, propValue){
		  var idx = this.getIndex(a,propName,propValue);
		  if (idx > -1){
		    return a[idx];
		  }else{
		    return null;
		  }
		},

		/**
		 * Sort an array of object by a propName
		 * 
		 * @param {Object}
		 *            a the Array
		 * @param {Object}
		 *            propName the property name to be sorted by
		 */
		sortBy : function(a, propName) {
			return a.sort(sortByFunc);
			function sortByFunc(a, b) {
				if (typeof a === "undefined")
					return -1;
				if (typeof b === "undefined")
					return 1;

				var x = a[propName];
				var y = b[propName];
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			}
		},

		/**
		 * From an array of javascript obect, create a map (js object) where the key is the propName value, and the
		 * value is the array item. If the propName does not on an item exist, it will ingore the item.
		 * 
		 * @example var myVehicules = [{id:"truck",speed:80},{id:"racecar",speed:200}]; 
		 *          var vehiculeById = brite.array.toMap(myVehicules,"id"); // vehiculeById["truck"].speed == 80
		 *          
		 * @param {Object}
		 *            a The array
		 * @param {Object}
		 *            keyName the property name that will be use
		 */
		toMap : function(a, keyName) {
			var i, l = a.length;
			var map = {}, item, key;
			for (i = 0; i < l; i++) {
				item = a[i];
				key = item[keyName];
				if (typeof key != "undefined" && key != null) {
					map[key] = item;
				}
			}
			return map;
		}
	}

	/**
	 * Give a random number between two number
	 * 
	 * @param {Object}
	 *            from
	 * @param {Object}
	 *            to
	 */
	brite.randomInt = function(from, to) {
		var offset = to - from;
		return from + Math.floor(Math.random() * (offset + 1));
	}

	// from the "JavaScript Pattern" book
	brite.inherit = function(C, P) {
		var F = function() {
		};
		F.prototype = P.prototype;
		C.prototype = new F();
		C._super = P.prototype; 
		C.prototype.constructor = C;
	};

})(jQuery);

// ------ /brite utils ------ //
// ------------------------ //


// ---------------------------------- //
// ------ brite.ua (User Agent) ------ //

/**
 * @namespace
 * 
 * User Agent utilities to know what capabilities the browser support.
 */
brite.ua = {};

(function($) {
  var CSS_PREFIXES = {webkit:"-webkit-",mozilla:"-moz-",msie:"-ms-",opera:"-o-"};
  
  var VAR_PREFIXES = {webkit:"Webkit",mozilla:"Moz",msie:"ms",opera:"o"};
  

	// privates
	var _cssVarPrefix = null;
	var _cssPrefix = null;
	var _cssHas = null;
	var _cssHasNo = null;
	
	var _hasTouch = null;
	var _hasTransition = null;
	var _hasCanvas = null;
	var _transitionPrefix = null; 
	var _eventsMap = {}; // {eventName:true/false,....}

  var _browserType = null; // could be "webkit" "moz" "ms" "o"
  
  
  // --------- Prefix and rendererType ------ //
  function computeBrowserType(){
    $.each(CSS_PREFIXES,function(key,val){
      if ($.browser[key]){
        _browserType = key;
        _cssPrefix = CSS_PREFIXES[key];
        _cssVarPrefix = VAR_PREFIXES[key];
      }
    });
  }
  
	brite.ua.cssPrefix = function() {
	  if (_cssPrefix === null){
	    computeBrowserType();
	  }
	  return _cssPrefix;
	}

	brite.ua.cssVarPrefix = function() {
    if (_cssVarPrefix === null){
      computeBrowserType();
    }
    return _cssVarPrefix;
	}
  // --------- /Prefix and rendererType ------ //
  
	// ------ jQuery css hooks ------ //
	// for now, just support transofrm, will add more soon (need to test)
	var css3PropNames = [ "transform" ];
	var propName;
	for ( var i = 0, l = css3PropNames.length; i < l; i++) {
		propName = css3PropNames[i];
		$.cssHooks[propName] = new CSSHook(propName);
	}

	function CSSHook(propName) {
		this.propName = propName;
		this.computedName = _cssVarPrefix + propName.substr(0, 1).toUpperCase() + propName.substr(1);
	}

	CSSHook.prototype.get = function(elem, computed, extra) {
		return $.css(elem, this.computedName);
	}

	CSSHook.prototype.set = function(elem, val) {
		elem.style[this.computedName] = val;
	}

	// ------ /jQuery css hooks ------ //

	/**
	 * return a css friendly string with all the "has-**" that this ua supports
	 * 
	 * @example 
	 *   brite.ua.cssHas(); // "has-canvas has-transition" for modern PC browsers
	 *                      // "has-canvas has-transition has-touch" in the case of touch devices
	 *   
	 */
	brite.ua.cssHas = function(){
		
		if (_cssHas === null){
			var STR = "has";
			_cssHas = "";
			$.each(brite.ua,function(key){
				var fun = brite.ua[key];
				var cssKey;
				if (key.indexOf(STR) === 0 && $.isFunction(fun)){
					if (fun.call(brite.ua)){
						cssKey = "has-" + key.substring(STR.length).toLowerCase();
						_cssHas += cssKey + " ";
					}
					
				}
			});
		}
		
		return _cssHas;
	}
	
	/**
	 * Return a css friendly version of the "no" of the has. "has-no-canvas" for example.
	 * 
	 * @example
	 *   brite.ua.
	 */
	brite.ua.cssHasNo = function(){
		if (_cssHasNo === null){
			var STR = "has";
			_cssHasNo = "";
			$.each(brite.ua,function(key){
				var fun = brite.ua[key];
				var cssKey;
				if (key.indexOf(STR) === 0 && $.isFunction(fun)){
					if (!fun.call(brite.ua)){
						cssKey = "has-no-" + key.substring(STR.length).toLowerCase();
						_cssHasNo += cssKey + " ";
					}
					
				}
			});
		}
		
		return _cssHasNo;		
	}
	/**
	 * Return true if the eventname is supported by this user agent.
	 * 
	 * @param {Object}
	 *            eventName
	 */
	brite.ua.supportsEvent = function(eventName) {
		var r = _eventsMap[eventName];
		if (typeof r === "undefined") {
			r = isEventSupported(eventName);
			_eventsMap[eventName] = r;
		}
		return r;
	}

	/**
	 * Convenient methods to know if this user agent supports touch events. It tests "touchstart".
	 */
	brite.ua.hasTouch = function() {
		return this.supportsEvent("touchstart");
	}

	brite.ua.hasCanvas = function() {
		if (_hasCanvas === null) {
			var test_canvas = document.createElement("canvas");
			_hasCanvas = (test_canvas.getContext) ? true : false
			delete test_canvas;
		}
		return _hasCanvas;
	}

	/**
	 * Return true if the user agent supports CSS3 transition.
	 */
	brite.ua.hasTransition = function() {
		if (_hasTransition === null) {
			var div = document.createElement('div');
			var transitionStr = brite.ua.cssPrefix() + "transition";
			div.innerHTML = '<div style="' + transitionStr + ': color 1s linear"></div>';
			
			if (div.firstChild.style[brite.ua.cssVarPrefix() + "Transition"]){
			 _hasTransition = true;
			}else{
			  _hasTransition = false;
			}
			delete div;
		}
		return _hasTransition;
	}

	// ------ Privates ------ //
	var isEventSupported = (function() {
		var TAGNAMES = {
			'select' : 'input',
			'change' : 'input',
			'submit' : 'form',
			'reset' : 'form',
			'error' : 'img',
			'load' : 'img',
			'abort' : 'img'
		}
		function isEventSupported(eventName) {
			var el = document.createElement(TAGNAMES[eventName] || 'div');
			eventName = 'on' + eventName;
			var isSupported = (eventName in el);
			if (!isSupported) {
				el.setAttribute(eventName, 'return;');
				isSupported = typeof el[eventName] == 'function';
			}
			el = null;
			return isSupported;
		}
		return isEventSupported;
	})()
	// ------ /Privates ------ //

})(jQuery);

// ------ /brite.ua (User Agent) ------ //
// ----------------------------------- //

// ----------------------- //
// ------ brite.gtx ------- //

// from: https://developer.mozilla.org/en/Code_snippets/Canvas
(function($) {

	/**
	 * @constructor
	 * 
	 * @description Factory or Constructor return a "gtx" instance for this canvas which is a chainable canvas wrapper.
	 * 
	 * @example // Using gtx as a factory var gtx = brite.gtx($("#myCanvas")); // then, you can chain any HTML5 canvas
	 *          calls gtx.beginPath().strokeStyle("#aaa").lineWidth(1).moveTo(0,0); gtx.lineTo(100,100).stroke();
	 *  // You can also create a brite.gtx instance with "new" var gtx2 = new brite.gtx($("#myCanvas2"));
	 * 
	 * @param {Object}
	 *            arg can be a Canvas 2D Context element or a Canvas element.
	 */
	brite.gtx = function Gtx(arg) {
		var ctx = arg;
		// if it s a jquery object, get the first element (assume it is a canvas
		if (arg.jquery) {
			arg = arg.get(0);
		}

		// if it is a cavans object.
		if ($.isFunction(arg.getContext)) {
			ctx = arg.getContext('2d');
		}

		// This allow to use the new or just the method as a factory
		if (!(this instanceof Gtx)) {
			return new Gtx(ctx);
		}

		this.context = this.ctx = ctx;

		// build the prototype methods on first demand
		if (!this.beginPath) {
			setupPrototype();
		}
	}

	// ------ GTX Extension Methods ------ //
	// 
	/**
	 * Set the referenceScale (the width and height that correspond to the 1 ratio). All subsequent canvas commands will
	 * be scale approprietely. Set width/height as the original dimension of the canvas element.
	 * 
	 * @param {Object}
	 *            refWidth
	 * @param {Object}
	 *            refHeight
	 * @returns {brite.gtx}
	 */
	// DEPRECATED
	brite.gtx.prototype.referenceScale = function(refWidth, refHeight) {
		this._refWidth = refWidth;
		this._refHeight = refHeight;

		// compute the ratio
		computeRatio.call(this);

		return this;
	}

	/**
	 * This will make this canvas fit its parent HTML element. If the referenceScale was set, it will recompute the
	 * ratio.
	 * 
	 * @returns {brite.gtx}
	 */
	brite.gtx.prototype.fitParent = function() {
		var canvas = this.canvas();
		if (canvas) {
			var canvas = this.canvas();
			var $parent = $(canvas).parent();
			// we might want to use innerWidth/Height here.
			canvas.width = $parent.width();
			canvas.height = $parent.height();
		}


		return this;
	}

	/**
	 * Clear the canvas.
	 * 
	 * @returns {brite.gtx}
	 */
	brite.gtx.prototype.clear = function() {
		if (this.canvas()) {
			// this should create a clear
			this.canvas().width = this.canvas().width;
		}
		// if no canvas (was created with a context), just ignore.

		return this;
	}

	// ------ /Extension Methods ------ //

	// ------ Context override methods ------ //
	// create the chainable object for gradient
	brite.gtx.prototype.createLinearGradient = function(x0, y0, x1, y1) {
		var ctxGradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
		var gtxGradient = new Gradient(ctxGradient);
		return gtxGradient;
	}

	// create the chainable object for gradient
	// (in double x0, in double y0, in double r0, in double x1, in double y1, in double r1);
	brite.gtx.prototype.createRadialGradient = function(x0, y0, r0, x1, y1, r1) {
		var ctxGradient = this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
		var gtxGradient = new Gradient(ctxGradient);
		return gtxGradient;
	}

	brite.gtx.prototype.fillStyle = function(arg) {
		return style(this, "fillStyle", arg);
	}

	brite.gtx.prototype.strokeStyle = function(arg) {
		return style(this, "strokeStyle", arg);
	}

	function style(g, type, arg) {
		// if getter
		if (!arg) {
			return g.ctx[type];
		}

		// if it is a gradient object, extract the value
		if (arg.ctxGradient) {
			arg = arg.ctxGradient;
		}

		g.ctx[type] = arg;
		return g;
	}

	// ------ /Context override methods ------ //

	// ------ Gradient ------ //
	function Gradient(ctxGradient) {
		this.ctxGradient = ctxGradient;
	}

	Gradient.prototype.addColorStop = function() {
		this.ctxGradient.addColorStop.apply(this.ctxGradient, arguments);
		return this;
	}

	Gradient.prototype.addColorStops = function() {
		for ( var i = 0; (i + 1) < arguments.length; i += 2) {
			this.ctxGradient.addColorStop(arguments[i], arguments[i + 1]);
		}

		return this;
	}
	// ------ /Gradient ------ //

	function setupPrototype() {
		var methods = [ 'beginPath', 'clip', 'closePath', 'drawImage', 'fill', 'fillText', 
		                 'arc','arcTo', 'lineTo', 'moveTo', 'bezierCurveTo', 'quadraticCurveTo', 'rect',
		                 'clearRect','fillRect','strokeRect','translate', 'rotate', 'save', 
		                 'scale', 'setTransform', 'stroke', 'strokeText', 'transform' ];

		var getterMethods = [ 'createPattern', 'drawFocusRing', 'isPointInPath', 'measureText', 
		                      // drawFocusRing not currently supported
		                      // The following might instead be wrapped to be able to chain their child objects
		                      'createImageData', 'getImageData', 'putImageData' // will wrap later
		                      // both of those are wrapped now >> 'createLinearGradient', 'createRadialGradient',
		];

		var props = [ 'canvas',
		    // we are wrapping this one >> 'strokeStyle', 'fillStyle',
		    'font', 'globalAlpha', 'globalCompositeOperation', 'lineCap', 'lineJoin', 'lineWidth', 'miterLimit', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor', 'textAlign', 'textBaseline' ];

		var gmethl, propl;
		for ( var i = 0, methl = methods.length; i < methl; i++) {
			var m = methods[i];
			brite.gtx.prototype[m] = (function(m) {
				return function() {
					this.ctx[m].apply(this.ctx, arguments);
					return this;
				};
			}(m));
		}

		for (i = 0, gmethl = getterMethods.length; i < gmethl; i++) {
			var gm = getterMethods[i];
			brite.gtx.prototype[gm] = (function(gm) {
				return function() {
					return this.ctx[gm].apply(this.ctx, arguments);
				};
			}(gm));
		}

		for (i = 0, propl = props.length; i < propl; i++) {
			var p = props[i];
			brite.gtx.prototype[p] = (function(p) {
				return function(value) {
					if (typeof value === 'undefined') {
						return this.ctx[p];
					}
					this.ctx[p] = value;
					return this;
				};
			}(p));
		}
	}
	;

})(jQuery);

// ------ /brite.gtx ------- //
// ----------------------- //
var brite = brite || {};

/**
 * @namespace brite.dao data manager layers to register, access DAOs.
 * DAOs are javascript objects that must implement the following CRUD methods get, list, create, update, remove, and the getIdName method.<br /> 
 * Signatures of these methods should match the corresponding brite.dao.** methods.<br />
 * <br />
 * Note that DAO CRUD methods can return directly the result or a deferred object. Also, it is important to note that brite.dao.*** CRUD access methods
 * will always return deferred object (either the DAO return deferred, or a wrapped deferred if the DAO method did not return a deferred)<br />
 * <br />
 * The deferred pattern for daos allows the application to be agnostic about the call mode, synchronous or asynchronous (e.g. Ajax, Workers, and other callback based called), 
 * and consequently offer the maximum flexibility during development and production. It also enforce a good practice on how to build the UI components.<br />
 * <br />
 * If there is a need to access the daos result directly, the brite.sdm ("straight dm") can be used.  
 */
brite.dao = {};

(function($) {

	var daoDic = {};

	//data change listeners
	var daoChangeEventListeners = {};
	
	//daoListeners
	var daoListeners = {};

	function getDao(objectType) {
		var dao = daoDic[objectType];
		if (dao) {
			return dao;
		} else {
			var er = "Cannot find the DAO for objectType: " + objectType;
			brite.log.error(er);
			throw er;
		}
	};

	/**
	 * Register a DAO for a given object type. A DAO must implements the "CRUD" method, get, list, create, update, remove and must return (directly 
	 * or via deferred) the appropriate result value. 
	 * 
	 * @param {String} objectType the object type that this dao will represent
	 * @param {DAO Oject} a Dao instance that implement the crud methods: get, find, create, update, remove.
	 */
	brite.registerDao = function(objectType, dao) {
		daoDic[objectType] = dao;
		return this;
	};

	
	/**
	 * 
	 * Add a dao Listener.
	 * 
	 * @param {function} daoListener  function that will get called with the following argument
	 *     							  daoListener(DaoEvent). Deferred is the deferred returned by the brite.dao.***, and DaoEvent is the event object
	 *     
	 * DaoEvent will have the following format:
	 *    DaoEvent.action: the action of the dao method (create, update, get, list, remove)
	 *    DaoEvent.objectType: the object type for this call
	 *    DaoEvent.result: the raw result returned by the dao (could be the result or the deferred that will get resolve to the result) 
	 *    DaoEvent.data: the data originally send to do the action (if appropriate) 
	 *    DaoEvent.id: the eventual id (if appropriate)
	 *    DaoEvent.opts: the eventual opts (when list) 
	 * 
	 * @returns listenerId that can be used to remove the listener with brite.removeDaoListener(listenerId)
	 */
	brite.addDaoListener = function(daoListener){
		var listenerId = brite.uuid();
		daoListeners[listenerId] = daoListener;
		
		return listenerId;
	}
	
	brite.removeDaoListener = function(listenerId){
		delete daoListeners[listenerId];
	}
	
	
	/**
	 * Add a change listener function for an objectType. <br />
	 * Data Change listener get triggered on create, update, and remove.
	 * 
	 * @param {String} objectType
	 * @param {Function} listener function. will be called with the dataChangeEvent argument
	 * dataChangeEvent.objectType {string}
	 * dataChangeEvent.action {string} could be "create" "update" "remove"
	 * dataChangeEvent.newData {object} The data after the change (null if remove) (if applicable)
	 * dataChangeEvent.saveData {object} The data object that was used to do the create/update. Could be partial object.  (if applicable) (TODO: need to clarify)
	 */
	brite.addDataChangeListener = function(objectType, listener) {
		var bindingId = brite.uuid();
		var listeners = daoChangeEventListeners[objectType];
		if (!listeners) {
			listeners = {};
			daoChangeEventListeners[objectType] = listeners;
		}
		listeners[bindingId] = listener;
		
		return bindingId;
	};
	
	brite.removeDataChangeListener = function(listenerId){
		$.each(daoChangeEventListeners,function(idx,listeners){
			delete listeners[listenerId];
		})
	}

	/**
	 * Return the id property name (this is the only method in brite.ddm that is not deferred)
	 */
	brite.dao.getIdName = function(objectType) {
		return brite.sdm.getIdName(objectType);
	}

	/**
	 * Wrap the brite.sdm.get(objectType,id) with a deferred result
	 */
	brite.dao.get = function(objectType, id) {
		return wrapWithDeferred(brite.sdm.get(objectType, id));
	}

	/**
	 * Wrap the brite.sdm.list(objectType,opts) with a deferred result
	 */
	brite.dao.list = function(objectType, opts) {
		return wrapWithDeferred(brite.sdm.list(objectType, opts));
	}

	/**
	 * Wrap the brite.sdm.create(objectType,data) with a deferred result
	 */
	brite.dao.create = function(objectType, data) {
		return wrapWithDeferred(brite.sdm.create(objectType, data));
	}

	/**
	 * Wrap the brite.sdm.update(objectType,id,data) with a deferred result
	 */
	brite.dao.update = function(objectType, id, data) {
		return wrapWithDeferred(brite.sdm.update(objectType, id, data));
	}

	/**
	 * Wrap the brite.sdm.remove(objectType,id) with a deferred result
	 */
	brite.dao.remove = function(objectType, id) {
		return wrapWithDeferred(brite.sdm.remove(objectType, id));
	}
	
	/**
	 * Wrap the brite.sdm.invoke(methodName,objectType) with a deferred result
	 */
	brite.dao.invoke = function(methodName, objectType) {
		var args = Array.prototype.slice.call(arguments,0); 
		return wrapWithDeferred(brite.sdm.invoke.apply(null,args));
	}	

	// ------- brite.sdm DAO API ------ //
	/**
	 * @namespace brite.sdm Straight Data Manager API that just return what the DAO returns (it does not Deferred wrap). This is mostly used by the brite.dao, but
	 * could be used by the application when it is ok to have blocking data calls (i.e. local data) or to expose the async/sync to the application layer.
	 */
	brite.sdm = {};

	/**
	 * DAO Interface: Return the property ID name
	 * @param {string} the objectType
	 * @return the id (this is not deferred)
	 * @throws error if dao cannot be found
	 */
	brite.sdm.getIdName = function(objectType) {
		return getDao(objectType).getIdName(objectType);
	}

	/**
	 * DAO Interface: Return a value or deferred object (depending of DAO impl) for this objectType and id.
	 * @param {Object} objectType
	 * @param {Object} id
	 * @return
	 */
	brite.sdm.get = function(objectType, id) {
		var result = getDao(objectType).get(objectType, id);
		
		callDaoListeners(result,"get",objectType,id);
		
		return result;
	};

	/**
	 * DAO Interface: Return an array of values or a deferred object (depending of DAO impl) for this objectType and options
	 * @param {Object} objectType
	 * @param {Object} opts (not supported yet)
	 *           opts.pageIndex {Number} Index of the page, starting at 0.
	 *           opts.pageSize  {Number} Size of the page
	 *           opts.match     {Object}
	 *           opts.orderBy   {String}
	 *           opts.orderType {String} "asc" or "desc"
	 */
	brite.sdm.list = function(objectType, opts) {
		var result =  getDao(objectType).list(objectType, opts);
		
		callDaoListeners(result,"list",objectType,null,null,opts);
		
		return result;
	};

	/**
	 * DAO Interface: Create a new instance of the object for a give objectType and data. <br />
	 *
	 * The DAO should return or resolve with the newly created data.
	 *
	 * @param {Object} objectType
	 * @param {Object} data
	 */
	brite.sdm.create = function(objectType, data) {
		var result = getDao(objectType).create(objectType, data);

		callDaoListeners(result,"create",objectType,null,data);
		
		// if the result is a deferred object, then, wait until done to callDataChangeListeners
		if (result && $.isFunction(result.promise)) {
			result.done( function(newData) {
				// TODO: need to get the id to set the id rather than null
				callDataChangeListeners("create",objectType, null, newData, data);
			});

		} else {
			callDataChangeListeners("create",objectType, null, result, data); 
		}
		return result;

	};

	/**
	 * DAO Interface: update a existing id with a set of property/value data.
	 *
	 */
	brite.sdm.update = function(objectType, id, data) {
		var result = getDao(objectType).update(objectType,id, data);

		callDaoListeners(result,"update",objectType,id,data);
		
		// if the result is a deferred object, then, wait until done to callChangeListeners
		if (result && $.isFunction(result.promise)) {
			result.done( function(newData) {
				callDataChangeListeners("update",objectType, id, newData, data); 
			});

		} else {
			callDataChangeListeners("update",objectType, id, result, data); 

		}
		return result;

	};

	/**
	 * DAO Interface: remove an entity for a given type and id.
	 *
	 */
	brite.sdm.remove = function(objectType, id) {
		var result = getDao(objectType).remove(objectType, id);

		callDaoListeners(result,"remove",objectType,id);
		
		// if the result is a deferred object, then, wait until done to callChangeListeners
		if (result && $.isFunction(result.promise)) {
			result.done( function(removedObject) {
				callDataChangeListeners("remove",objectType, id, null, null); 
			});

		} else {
			callDataChangeListeners("remove",objectType, id, null, null);
		}

	};
	
	brite.sdm.invoke = function(methodName,objectType){
		var args = Array.prototype.slice.call(arguments); 
		
		var dao = getDao(objectType);
		if (!dao) throw  ("cannot find dao for " + objectType);
		if (!dao[methodName]) throw  ("no custom method for " + method);
		var result = dao[methodName].apply(dao,args.slice(1));
		
		callDaoListeners(result,methodName,objectType);
		
		return result;
		
	}

	// ------- /brite.sdm DAO API ------ //

	function callDaoListeners(result,action,objectType,id, data, opts){
		var daoEvent = {
				result: result,
				action: action,
				objectType: objectType,
				id: id,
				data: data, 
				opts: opts
		}
		
		$.each(daoListeners,function(listenerId,listener){
			listener(daoEvent);
		});
	}

	/**
	 * Private method to trigger the change(daoEvent) on all listeners.
	 * NOTE: this param names maps to what is daoChangeEvent
	 *
	 * @param {Object} action ("remove" "create" "update")
	 * @param {Object} objectType
	 * @param {Object} id
	 * @param {Object} newData The data after the change (null if remove)
	 * @param {Object} saveData The data object that was used to do the create/update. Could be partial object.
	 */
	function callDataChangeListeners(action,objectType, id, newData, saveData) {

		var dataChangeEvent = {
			action: action,
			objectType: objectType,
			id: id,
			newData: newData,
			saveData: saveData
		};
		
		_callDataChangeListeners(dataChangeEvent)

	};
	
	function _callDataChangeListeners(dataChangeEvent){
		var objectType = dataChangeEvent.objectType;
		var listeners = daoChangeEventListeners[objectType];
		if (listeners) {
			$.each(listeners,function(key,listener){
				listener(dataChangeEvent);
			});
		}		
	}
	
	brite.triggerDataChange = function(dataChangeEvent){
		_callDataChangeListeners(dataChangeEvent);
	}
	

	/**
	 * Wrap with a deferred object if the obj is not a deferred itself.
	 */
	function wrapWithDeferred(obj) {
		//if it is a deferred, then, trust it, return it.
		if (obj && $.isFunction(obj.promise)) {
			return obj;
		} else {
			var dfd = $.Deferred();
			dfd.resolve(obj);
			return dfd;
		}
	}

})(jQuery);

// ------ Simple DAO ------ //
/**
 * @namespace Some default convenient DAOs (for now, only development DAOs)
 */
(function($) {

	function SimpleDao(store) {
		this.init(store);
	}

	SimpleDao.prototype.init = function(store) {
		this._store = store || [];
		return this;
	}

	// ------ DAO Interface Implementation ------ //
	SimpleDao.prototype.getIdName = function(objectType) {
		return "id";
	}

	SimpleDao.prototype.get = function(objectType, id) {
		var idx = brite.array.getIndex(this._store, "id", id);
		return this._store[idx];
	}

	//for now, just support opts.orderBy
	SimpleDao.prototype.list = function(objectType, opts) {
		//TODO: probably need to copy the array to avoid giving the original array
		var resultSet = this._store;

		if (opts) {
			if (opts.orderBy) {
				resultSet = brite.array.sortBy(resultSet, opts.orderBy)
			}
			if (opts.match) {
				resultSet = $.map(resultSet, function(val, idx) {
					var pass = true;

					$.each(opts.match, function(k, v) {
						if (val[k] === v) {
							pass = pass && true;
						} else {
							pass = false;
						}
					});

					return (pass) ? val : null;
				});

			}
		}
		return resultSet;
	}

	SimpleDao.prototype.create = function(objectType, data) {
		var idName = brite.dao.getIdName(objectType);

		// if the id has already been created, no biggies, otherwise, create it.
		if (typeof data[idName] !== "undefined") {
			var er = "SimpleDao.create error: Id present in data object. Cannot create. You might want to call update instead.";
			brite.log.debug(er);
			throw er;

		}

		data[idName] = brite.uuid(12);

		this._store.push(data);

		return data;
	}

	SimpleDao.prototype.update = function(objectType, id, data) {
		// if there is an id, make sure it matches
		var idName = brite.dao.getIdName(objectType);
		var dataId = data[idName];
		if (typeof dataId !== "undefined" && dataId != id) {
			var er = "SimpleDao.update error: Id in param and data does not match. Cannot update data.";
			brite.log.debug(er);
			throw er;
		}

		// remove the id from the data to be saved, not needed.
		delete data[idName];

		//get the data, and populate the new value
		var storeData = this.get(objectType, id);
		if (storeData) {
			$.extend(storeData, data);
			return storeData;
		}
	}

	SimpleDao.prototype.remove = function(objectType, id) {
		var oldData = this.get(objectType, id);
		var idx = brite.array.getIndex(this._store, "id", id);
		if (idx > -1) {
			brite.array.remove(this._store, idx);
		} else {
			var er = "SimpleDao.remove error: Ojbect " + objectType + "[" + id + "] not found. Cannot delete.";
			brite.log.debug(er);
			throw er;
		}

		return id;
	}

	// ------ /DAO Interface Implementation ------ //

	/**
	 * SimpleDao is a Dao for a in memory array based storage. Each data item is stored as an array item,
	 * and have a unique .id property (that will be added on save is not present). <br />
	 *
	 * This is only for development, as there is not storage behind it.
	 *
	 * @param {Array}  store (optional) Array of json object representing each data item
	 */
	brite.dao.SimpleDao = SimpleDao;
	
})(jQuery);

// ------ /Simple DAO ------ //

// ------ jQuery DAO Helper ------ //
(function($) {

	/**
	 * Return the objRef {id,type,$element} (or a list of such) of the closest html element matching the objType match the data-obj_type.<br />
	 * If no objType, then, return the first objRef of the closest html element having a data-obj_type. <br />
	 *
	 * @param {String} objType (optional) the object table
	 * @return null if not found, single object with {id,type,$element} if only one jQuery object, a list of such if this jQuery contain multiple elements.
	 */
	$.fn.bObjRef = function(objType) {
		var resultList = [];

		var obj = null;
		// iterate and process each matched element
		this.each( function() {
			var $this = $(this);
			var $sObj;
			if (objType) {
				$sObj = $this.closest("[data-obj_type='" + objType + "']");
			} else {
				$sObj = $this.closest("[data-obj_type]");
			}
			if ($sObj.length > 0) {
				var objRef = {
					type: $sObj.attr("data-obj_type"),
					id: $sObj.attr("data-obj_id"),
					$element: $sObj
				}
				resultList.push(objRef);
			}
		});

		if (resultList.length === 0) {
			return null;
		} else if (resultList.length === 1) {
			return resultList[0];
		} else {
			return resultList;
		}

	};

})(jQuery);

// ------ /jQuery DAO Helper ------ //
var brite = brite || {};

/**
 * @namespace brite.event convenient touch/mouse event helpers.
 */
brite.event = brite.event || {};

// ------ brite event helpers ------ //
(function($){
	var hasTouch = brite.ua.hasTouch();
	/**
     * if it is a touch device, populate the event.pageX and event.page& from the event.touches[0].pageX/Y
     * @param {jQuery Event} e the jquery event object 
     */
    brite.event.fixTouchEvent = function(e){
        if (hasTouch) {
            var oe = e.originalEvent;
			
            if (oe.touches.length > 0) {
                e.pageX = oe.touches[0].pageX;
                e.pageY = oe.touches[0].pageY;
            }
        }
        
        return e;
    }
    
    /**
     * Return the event {pageX,pageY} object for a jquery event object (will take the touches[0] if it is a touch event)
     * @param {jQuery Event} e the jquery event object
     */
    brite.event.eventPagePosition = function(e){
      var pageX, pageY;
  		if (e.originalEvent && e.originalEvent.touches){
  			pageX = e.originalEvent.touches[0].pageX;
  			pageY = e.originalEvent.touches[0].pageY;
  		}else{
  			pageX = e.pageX;
  			pageY = e.pageY;
  		}
  		return {
  			pageX: pageX,
  			pageY: pageY
  		}
    }
})(jQuery);

// ------ /brite special events ------ //
;(function($){
  var mouseEvents = {
      start: "mousedown",
      move: "mousemove",
      end: "mouseup"
  }
  
  var touchEvents = {
      start: "touchstart",
      move: "touchmove",
      end: "touchend"
  }
  
  function getTapEvents(){
    if (brite.ua.hasTouch()){
      return touchEvents;
    }else{
      return mouseEvents;
    }
  }  
  
  // --------- btap & btaphold --------- //
  $.event.special.btap = {

    setup : function(data, namespaces) {

      var tapEvents = getTapEvents();

      $(this).on(tapEvents.start, function(event) {
        var elem = this;
        var $elem = $(elem);
        
        var origTarget = event.target, startEvent = event, timer;

        function handleEnd(event){
          clearAll();
          if (event.target === origTarget){
            brite.event.fixTouchEvent(startEvent);
            triggerCustomEvent(elem, startEvent,{type:"btap"});
          }
        }
        
        function clearAll(){
          clearTimeout(timer);
          $elem.off(tapEvents.end,handleEnd);
        }  
        
        $elem.on(tapEvents.end,handleEnd);
        
        timer = setTimeout(function() {
          brite.event.fixTouchEvent(startEvent);
          triggerCustomEvent( elem, startEvent,{type:"btaphold"});
        }, 750 );
      });

    }

  }; 


  linkSpecialEventsTo(["btaphold"],"btap");
  
  // --------- /btap & btaphold --------- //
  
  
  // --------- bdrag* --------- //
  var BDRAGSTART="bdragstart",BDRAGMOVE="bdragmove",BDRAGEND="bdragend";
  var BDRAGENTER="bdragenter",BDRAGOVER="bdragover",BDRAGLEAVE="bdragleave",BDROP="bdrop";
  
  var dragThreshold = 5;
  
  $(function(){
    //$("body").css("-webkit-user-select","none");
  });
  $.event.special[BDRAGMOVE] = {

    setup : function(data, namespaces) {
      
      var tapEvents = getTapEvents();
      
      $(this).on(tapEvents.start, function(event) {
        var elem = this;
        var $elem = $(this);
        var dragStarted = false;
        var startEvent = event;
        var startPagePos = brite.event.eventPagePosition(startEvent);
        var origTarget = event.target;
        var $origTarget = $(origTarget);
        
        var $document = $(document);
        var uid = "_" + brite.uuid(7);
        
        // drag move (and start)
        $document.on(tapEvents.move + "." + uid,function(event){
          
          var currentPagePos = brite.event.eventPagePosition(event);
          // fix a bug on Chrome that always change the cursor to text
          $("body").css("-webkit-user-select","none");
          
          if (!dragStarted){
            if(Math.abs(startPagePos.pageX - currentPagePos.pageX) > dragThreshold || Math.abs(startPagePos.pageY - currentPagePos.pageY) > dragThreshold) {
              dragStarted = true;
              $origTarget.data("bDragCtx", {});
              var bextra = buildDragExtra(event, $origTarget, BDRAGSTART);
              triggerCustomEvent( origTarget, event,{type:BDRAGSTART,target:origTarget,bextra:bextra});  
              
              event.stopPropagation();
              event.preventDefault();
              
            }
          }
          
          if(dragStarted) {
            var bextra = buildDragExtra(event, $origTarget, BDRAGMOVE);
            triggerCustomEvent( origTarget, event,{type:BDRAGMOVE,target:origTarget,bextra:bextra});
            event.stopPropagation();
            event.preventDefault();
          }
        });
        
        // drag end
        $document.on(tapEvents.end + "." + uid, function(event){
          // chrome fix cleanup (remove the hack)
          $("body").css("-webkit-user-select","");
          if (dragStarted){
            var bextra = buildDragExtra(event, $origTarget, BDRAGEND);
            triggerCustomEvent( origTarget, event,{type:BDRAGEND,target:origTarget,bextra:bextra});
            event.stopPropagation();
            event.preventDefault();            
          }  
          $document.off("." + uid);
        });
            
      });
    }
  };
  
  linkSpecialEventsTo([BDRAGSTART,BDRAGEND],BDRAGMOVE);
  
   /**
   * Build the extra event info for the drag event. 
   */
  function buildDragExtra(event,$elem,dragType){
    brite.event.fixTouchEvent(event);
    var hasTouch = brite.ua.hasTouch();
    var extra = {
      eventSource: event,
      pageX: event.pageX,
      pageY: event.pageY      
    };
    
    var oe = event.originalEvent;
    if (hasTouch){
      extra.touches = oe.touches;
    }
    
    var bDragCtx = $elem.data("bDragCtx");
    
    if (dragType === BDRAGSTART){
      bDragCtx.startPageX = extra.startPageX = extra.pageX;
      bDragCtx.startPageY = extra.startPageY = extra.pageY;
      
      bDragCtx.lastPageX = bDragCtx.startPageX = extra.startPageX;
      bDragCtx.lastPageY = bDragCtx.startPageY = extra.startPageY;
    }else if (dragType === BDRAGEND){
      // because, on iOs, the touchEnd event does not have the .touches[0].pageX
      extra.pageX = bDragCtx.lastPageX;
      extra.pageY = bDragCtx.lastPageY;
    }
    
    extra.startPageX = bDragCtx.startPageX;
    extra.startPageY = bDragCtx.startPageY;
    extra.deltaX = extra.pageX - bDragCtx.lastPageX;
    extra.deltaY = extra.pageY - bDragCtx.lastPageY;
    
    bDragCtx.lastPageX = extra.pageX;
    bDragCtx.lastPageY = extra.pageY;
    return extra;
  }
  // --------- /bdrag* --------- //
  
  
  
  // --------- btransitionend --------- //
  $.event.special.btransitionend = {

    setup : function(data, namespaces) {
      var eventListener = "transitionend";
      if (!$.browser.mozilla){
        eventListener = brite.ua.cssVarPrefix().toLowerCase() + "TransitionEnd";
      }
      this.addEventListener(eventListener,function(event){
        triggerCustomEvent(this,event,{type:"btransitionend"});
      });
     

    }

  };   
  // --------- /btransitionend --------- //
  
  // --------- Event Utilities --------- //
  
  // Link
  function linkSpecialEventsTo(eventNames,eventRef){
    $.each(eventNames,function(idx,val){
      $.event.special[ val ] = {
        setup: function() {
          $( this ).bind( eventRef, $.noop );
        }
      };      
    });
  }
    
  function triggerCustomEvent( elem, nativeEvent, override ) {
    var newEvent = jQuery.extend(
      new jQuery.Event(),
      nativeEvent,override
    );
    $(elem).trigger(newEvent);    
  }
  // --------- /Event Utilities --------- //  
    
})(jQuery);





