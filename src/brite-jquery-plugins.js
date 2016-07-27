var dao = require("./brite-dao.js").dao;
var utils = require("./brite-utils.js");

module.exports = {};

var $ = jQuery;

function processDestroy(component) {
	// The if(component) is a safeguard in case destroy gets call twice (issue when clicking fast on
	// test_brite-02-transition....)
	if (component) {
		// unbind view events
		$(document).off(utils.DOC_EVENT_NS_PREFIX + component.id);
		$(window).off(utils.WIN_EVENT_NS_PREFIX + component.id);
		
		dao.offAny(component.id);
		
		if (component.parentEvents && component.$el){
			$.each(component.parentEvents,function(key, val){
				var parent = component.$el.bView(key);
				if (parent && parent.$el){
					parent.$el.off("." + component.id);
				}
			});
		}
								
		var destroyFunc = component.destroy;

		if ($.isFunction(destroyFunc)) {
			destroyFunc.call(component);
		}
		
		// Delete this element, as a sign at this component has been destroyed.
		delete component.$el;
		delete component.$element;
	}
}


// ---------------------------------------------------- //
// ------------- brite view jquery plugins ------------ //

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

	});
};

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

		if ($this.is("[data-b-view]")) {
			var component = $this.data("bview");
			processDestroy(component);

			$this.remove();
		} else {
			$this.remove();
		}
	});

};

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
$.fn.bView = function(viewName) {

	// iterate and process each matched element
	var $el;
	if (viewName) {
		$el = $(this).closest("[data-b-view='" + viewName + "']");
	} else {
		$el = $(this).closest("[data-b-view]");
	}

	return $el.data("bview");

};
// ------------- /brite view jquery plugins ----------- //
// ---------------------------------------------------- //


// --------- Entity Plugin --------- //
/**
 * Return the bEntity {id,type,name,$element} (or a list of such) of the closest html element matching entity type in the data-entity.
 * 
 * The return value is like: 
 * 
 * .type     will be the value of the attribute data-entity 
 * .id       will be the value of the data-entity-id
 * .name     (optional) will be the value of the data-entity-name
 * .$el      will be the $element containing the matching data-entity attribute
 *  
 * If no entityType, then, return the first entity of the closest html element having a data-b-entity. <br />
 * 
 * $element.bEntity("User"); // return the closest entity with data-entity="User"
 * $element.bEntity(">children","Task"); // return all the data-entity="Task" children from this $element.  
 * $element.bEntity(">first","Task"); // return the first child entity matching data-entity="Task"
 * 
 * TODO: needs to implement the >children and >first
 * 
 * @param {String} entity type (optional) the object 
 * @return null if not found, the first found entity with {id,type,name,$element}.
 */
$.fn.bEntity = function(entityType) {

	var result = null;
	// iterate and process each matched element
	this.each(function() {
		// ignore if we already found one
		if (result === null){
			var $this = $(this);
			var $sObj;
			if (entityType) {
				$sObj = $this.closest("[data-entity='" + entityType + "']");
			} else {
				$sObj = $this.closest("[data-entity]");
			}
			if ($sObj.length > 0) {
				result = {
					type : $sObj.attr("data-entity"),
					id : $sObj.attr("data-entity-id"),
					$el : $sObj
				};
				var name = $sObj.attr("data-entity-name");
				if (typeof name !== "undefined"){
					result.name = name;
				}
			}
		}
	});
	
	return result;
	
};

// --------- /Entity Plugin --------- //

// --------- old bComponent APIs ------- //	
// backwards compatibility;
$.fn.bComponent = $.fn.bView;

/**
 * Get the list of components that this htmlElement contains.
 * 
 * @param {string}
 *            componentName (optional) if present, will filter only the component with this matching name
 * @return a javascript array of all the match component
 */
// deprecated 
$.fn.bFindComponents = function(componentName) {
	var childrenComponents = [];

	this.each(function() {
		var $this = $(this);

		var $componentElements;

		if (componentName) {
			$componentElements = $this.find("[data-b-view='" + componentName + "']");
		} else {
			$componentElements = $this.find("[data-b-view]");
		}

		$componentElements.each(function() {
			var $component = $(this);
			childrenComponents.push($component.data("bview"));
		});
	});

	return childrenComponents;
};

/**
 * Get the list of components that this htmlElement contains.
 * 
 * @param {string}
 *            componentName (optional) if present, will filter only the component with this matching name
 * @return a javascript array of all the match component
 */
// deprecated
$.fn.bFindFirstComponent = function(componentName) {
	var childrenComponents = [];

	this.each(function() {
		var $this = $(this);

		var $componentElements;

		if (componentName) {
			$componentElements = $this.find("[data-b-view='" + componentName + "']:first");
		} else {
			$componentElements = $this.find("[data-b-view]:first");
		}

		$componentElements.each(function() {
			var $component = $(this);
			childrenComponents.push($component.data("bview"));
		});
	});

	return childrenComponents;
};
// -------- /old bComponent APIs ------- //

// --------- old objRef code --------- //
/**
 * Return the objRef {id,type,$element} (or a list of such) of the closest html element matching the objType match the data-obj_type.<br />
 * If no objType, then, return the first objRef of the closest html element having a data-obj_type. <br />
 *
 * @param {String} objType (optional) the object table
 * @return null if not found, single object with {id,type,$element} if only one jQuery object, a list of such if this jQuery contain multiple elements.
 */
//@Deprecated
$.fn.bObjRef = function(objType) {
	var resultList = [];

	// iterate and process each matched element
	this.each(function() {
		var $this = $(this);
		var $sObj;
		if (objType) {
			$sObj = $this.closest("[data-obj_type='" + objType + "']");
		} else {
			$sObj = $this.closest("[data-obj_type]");
		}
		if ($sObj.length > 0) {
			var objRef = {
				type : $sObj.attr("data-obj_type"),
				id : $sObj.attr("data-obj_id"),
				$element : $sObj
			};
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
// --------- /old objRef code --------- //
