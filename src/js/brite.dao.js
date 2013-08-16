var brite = brite || {};

/**
 * @namespace brite.dao data manager layers to register, access DAOs.
 * DAOs are javascript objects that must implement the following CRUD methods get, list, create, update, remove methods.<br />
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
// --------- DAO Support --------- //
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
			throw er;
		}
	};

	brite.dao = function(entityType) {
		return getDao(entityType);
	}

	var internalMethods = {
		isDataChange : true, 
		entityType: true
	};
	
	var dataChangeMethodRegEx = /remove|delete|create|update/i;


	/**
	 * Register a DAO for a given object type. A DAO must implements the "CRUD" method, get, list, create, update, remove and must return (directly
	 * or via deferred) the appropriate result value.
	 *
	 * @param {DAO Oject} a Dao instance that implement the crud methods: get, find, create, update, remove.
	 */
	brite.registerDao = function(daoHandler) {

		var daoObject = {};
		
		// support function or property
		var entityType = ($.isFunction(daoHandler.entityType))?daoHandler.entityType():daoHandler.entityType;
		
		if (!entityType || typeof entityType !== "string"){
			throw "Cannot register daoHandler because entityType '" + entityType + "' is not valid." + 
			      " Make sure the daoHandler emplement .entityType() method which must return a string of the entity type"; 
		}
		
		daoObject._entityType = entityType;
		daoObject._handler = daoHandler;

		$.each(daoHandler, function(k, v) {
			// if it is a function and not an internalMethods
			if ($.isFunction(daoHandler[k]) && !internalMethods[k]) {
				var methodName = k;
				var isDataChange = dataChangeMethodRegEx.test(methodName);
				
				if (daoHandler.isDataChange){
					isDataChange = isDataChange || daoHandler.isDataChange(methodName); 
				}

				daoObject[methodName] = (function(entityType, methodName, isDataChange) {
					return function() {
						var resultObj = daoHandler[methodName].apply(daoHandler, arguments);
						var resultPromise = wrapWithDeferred(resultObj);

						_triggerOnDao(entityType, methodName, resultPromise);

						resultPromise.done(function(result) {
							_triggerOnResult(entityType, methodName, result);
							if (isDataChange) {
								brite.triggerDataChange(entityType, methodName, result);
							}
						});

						return resultPromise;
					};
				})(entityType, methodName, isDataChange);
			}
		});
		
		
		daoDic[entityType] = daoObject;
		
		if ($.isFunction(daoObject.init)){
			daoObject.init(entityType);
		}
		
		return daoObject;
	}

	// --------- Internal Utilities For Dao Events --------- //
	var _ALL_ = "_ALL_";

	/**
	 * Build the arguments for all the brite.dao.on*** events from the arguments
	 * Can be
	 * - (entityTypes,actions,func,namespace)
	 * - (entityTypes,func,namespace)
	 * - (func,namespace)
	 *
	 * Return an object with
	 *   .events (with the namespace)
	 *   .objectTypes (as class css selector, ".User, .Task"
	 *   .func the function to register
	 *   .namespace
	 */
	function buildDaoOnEventParamMap(args) {
		var i, val, namespace, map = {};

		// build the map
		for ( i = args.length - 1; i > -1; i--) {
			val = args[i];
			// if it is a function, set it.
			if ($.isFunction(val)) {
				map.func = val;
			}
			// if we did not get the function yet, this is the name space
			else if (!map.func) {
				namespace = val;
			}
			// if we have the func, and it is the second argument, it si the actions
			else if (map.func && i === 1) {
				map.actions = val;
			}
			// if we have the func, and it is the first argument, it is objectTypes
			else if (map.func && i === 0) {
				map.objectTypes = val;
			}
		}

		
		// create the namespace if not present
		if ( typeof namespace === "undefined") {
			throw "BRITE DAO BINDING ERROR: any binding with brite.dao.on*** needs to have a namespace after the function. " + 
			      " Remember to cleanup the event at component close with brite.dao.off(mynamespace)"; 
			       
		}

		
		// complete the actions
		if (!map.actions) {
			map.actions = _ALL_ + "." + namespace;
		} else {
			var ns = "." + namespace + " ";
			// build the events, split by ',', add the namespace, and join back
			map.actions = map.actions.split(",").join(ns) + ns;
		}

		// complete the objectTypes
		// build the objectTypes, split by ',', add the "." prefix, and join back
		if (map.objectTypes) {
			var objectTypes = map.objectTypes.split(",");
			$.each(objectTypes, function(idx, val) {
				objectTypes[idx] = "." + $.trim(val);
			});
			map.objectTypes = objectTypes.join(",");
		}

		map.namespace = namespace;

		return map;
	}

	/**
	 * Utility method that will construct a jQuery event with the daoEvent
	 * and trigger it to the appropriate $receiver given the dictionary and objectType
	 *
	 */
	function _triggerDaoEvent(dic, $receiversRoot, objectType, daoEvent) {

		var evt = $.extend(jQuery.Event(daoEvent.action), {
			daoEvent : daoEvent
		});

		var $receiver = dic[objectType];

		if (!$receiver) {
			dic[objectType] = $receiver = $("<div class='" + objectType + "'></div>");
			$receiversRoot.append($receiver);
		}
		// trigger with the event.type == action
		$receiver.trigger(evt);
		
		// in the case of a "remove" event, we need to check if the $receiver did not get removed, 
		// otherwise, we need to add it back.
	  if(evt.type === "remove" && $receiversRoot.find("."+objectType).size() == 0 && $receiver){
 $receiversRoot.append($receiver);
 }

		// trigger _ALL_ action in case there are some events registered for all event
		evt.type = _ALL_;
		$receiver.trigger(evt);
	}

	// --------- /Internal Utilities For Dao Events --------- //

	// --------- brite.dao.onDao --------- //
	var $daoDao = $("<div></div>");
	// dictionary of {objectType:$dataEventReceiver}

	var onDaoReceiverDic = {};
	/**
	 * This will trigger on any DAO calls before the dao action is completed (for
	 * 	asynch daos), hence, the resultPromise property of the daoEvent.
	 *
	 * @param objectTypes       e.g., "User, Task" (null for any)
	 * @param actions            e.g., "create, list, get" (null for any)
	 * @param listenerFunction  The function to be called with the daoEvent
	 *            listenerFunction(event) with event.daoEvent as
	 *            daoEvent.action
	 *            daoEvent.entityType
	 *            daoEvent.resultPromise
	 *
	 */
	brite.dao.onDao = function(objectTypes, actions, listenerFunction, namespace) {
		var map = buildDaoOnEventParamMap(arguments);
		$daoDao.on(map.actions, map.objectTypes, map.func);
		return map.namespace;
	}


	brite.dao.offDao = function(namespace) {
		$daoDao.off("." + namespace);
	}

	function _triggerOnDao(entityType, action, resultPromise) {
		var daoEvent = {
			entityType : entityType,
			action : action,
			resultPromise : resultPromise
		}

		_triggerDaoEvent(onDaoReceiverDic, $daoDao, entityType, daoEvent);
	}

	// --------- /brite.dao.onDao --------- //

	// --------- brite.dao.onResult --------- //
	var $daoResult = $("<div></div>");
	// dictionary of {objectType:$dataEventReceiver}
	var onResultReceiverDic = {};

	/**
	 * This will trigger when the dao resolve the result of a particular DAO call.
	 * This will not trigger in case of a dao failure.
	 *
	 * @param objectTypes       e.g., "User, Task" (null for any)
	 * @param actions           e.g., "create, list, get" 
	 * @param listenerFunction  The function to be called with the daoEvent
	 *            listenerFunction(daoEvent)
	 *            daoEvent.action
	 *            daoEvent.objectType
	 *            daoEvent.objectId
	 *            daoEvent.data
	 *            daoEvent.opts
	 *            daoEvent.result
	 */
	brite.dao.onResult = function(objectTypes, actions, listenerFunction, namespace) {
		var map = buildDaoOnEventParamMap(arguments);
		$daoResult.on(map.actions, map.objectTypes, map.func);
		return map.namespace;
	}


	brite.dao.offResult = function(namespace) {
		$daoResult.off("." + namespace);
	}

	function _triggerOnResult(entityType, action, result) {
		var daoEvent = {
			entityType: entityType,
			action : action,
			result : result
		};

		_triggerDaoEvent(onResultReceiverDic, $daoResult, entityType, daoEvent);
	}

	// --------- /brite.dao.onResult --------- //

	// --------- Brite.dao.onDataChange --------- //
	var $daoDataChange = $("<div></div>");

	// dictionary of {objectType:$dataEventReceiver}
	var dataChangeReceiverDic = {};

	/**
	 * This trigger on data change event only (like "create, update, remove") and not on others. For other binding,
	 * use the brite.dao.onResult which will trigger anytime
	 *
	 * @param {String} namespace: the namespace for this event.
	 * @param {String} objectTypes: the object types e.g., "User, Task" (null for any object type);
	 * @param {String} actions: this dao action names e.g., "create, update" 
	 */
	brite.dao.onDataChange = function(objectTypes, actions, func, namespace) {
		var map = buildDaoOnEventParamMap(arguments);
		$daoDataChange.on(map.actions, map.objectTypes, map.func);
		return map.namespace;
	}


	brite.dao.offDataChange = function(namespace) {
		$daoDataChange.off("." + namespace);
	}


	brite.triggerDataChange = function(entityType, action, result) {
		var daoEvent = {
			entityType : entityType,
			action : action,
			result : result
		};

		_triggerDaoEvent(dataChangeReceiverDic, $daoDataChange, entityType, daoEvent);
	}

	// --------- /Brite.dao.onDataChange --------- //
	
	brite.dao.offAny = function(namespace){
		brite.dao.offResult(namespace);
		brite.dao.offDao(namespace);
		brite.dao.offDataChange(namespace);
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
// --------- /DAO Support --------- //



// --------- bEntity --------- //
(function($) {

	/**
	 * Return the bEntity {id,type,name,$element} (or a list of such) of the closest html element matching entity type in the data-entity.
	 * 
	 * The return value is like: 
	 * 
	 * .type     will be the value of the attribute data-entity 
	 * .id       will be the value of the data-entity-id
	 * .name     (optional) will be the value of the data-entity-name
	 * .$el 			will be the $element containing the matching data-entity attribute
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

		var i, result = null;
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
					}
					var name = $sObj.attr("data-entity-name");
					if (typeof name !== "undefined"){
						result.name = name;
					}
				}
			}
		});
		
		return result;
		
	};

})(jQuery);

// ------ /bEntity ------ //

// ------ LEGACY jQuery DAO Helper ------ //
(function($) {

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

		var obj = null;
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

// ------ /LEGACY jQuery DAO Helper ------ //