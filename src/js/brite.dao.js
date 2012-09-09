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
			brite.log.error(er);
			throw er;
		}
	};

	brite.dao = function(entityType) {
		return getDao(entityType);
	}

	/**
	 * Register a DAO for a given object type. A DAO must implements the "CRUD" method, get, list, create, update, remove and must return (directly
	 * or via deferred) the appropriate result value.
	 *
	 * @param {String} objectType the object type that this dao will represent
	 * @param {DAO Oject} a Dao instance that implement the crud methods: get, find, create, update, remove.
	 */
	brite.registerDao = function(objectType, dao) {
		
		return this;
	};

	var internalMethods = {
		getIdName : true,
		isDataChange : true
	};
	var dataChangeMethods = {
		create : true,
		remove : true,
		removeMany: true,
		update : true, 
		updateMany: true
	};

	brite.registerDao = function(entityType, daoHandler) {

		var daoObject = {};
		
		daoHandler._entityType = entityType;
		
		daoObject._entityType = entityType;

		$.each(daoHandler, function(k, v) {
			// if it is a function and not an internalMethods
			if ($.isFunction(daoHandler[k]) && !internalMethods[k]) {
				var methodName = k;
				var isDataChange = dataChangeMethods[methodName];
				
				if (daoHandler.isDataChange){
					isDataChange = isDataChange || daoHandler.isDataChange(methodName); 
				}

				daoObject[methodName] = (function(objectType, methodName, isDataChange) {
					return function() {
						var resultObj = daoHandler[methodName].apply(daoHandler, arguments);
						var resultPromise = wrapWithDeferred(resultObj);

						_triggerOnDao(objectType, methodName, resultPromise);

						resultPromise.done(function(result) {
							_triggerOnResult(objectType, methodName, result);
							if (isDataChange) {
								brite.triggerDataChange(objectType, methodName, result);
							}
						});

						return resultPromise;
					};
				})(entityType, methodName, isDataChange);
			}
		});
		
		
		daoDic[entityType] = daoObject;
		
		return daoObject;
	}

	// --------- Internal Utilities For Dao Events --------- //
	var _ALL_ = "_ALL_";

	/**
	 * Build the arguments for all the brite.dao.on*** events from the arguments
	 * Can be
	 * - (events,objectTypes,func,namespace)
	 * - (objectTypes,func,namespace)
	 * - (func,namspace)
	 * and all the above without the namespace
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
			// if we have the func, but not the objectTypes, this is the objectTypes
			else if (map.func && typeof map.objectTypes === "undefined") {
				map.objectTypes = val;
			}
			// if we have the func and objectTypes, then this value is the events
			else if (map.func && typeof map.objectTypes !== "undefined") {
				map.events = val;
			}
		}

		
		// create the namespace if not present
		if ( typeof namespace === "undefined") {
			throw "BRITE DAO BINDING ERROR: any binding with brite.dao.on*** needs to have a namespace after the function. " + 
			      " Remember to cleanup the event at component close with brite.dao.off(mynamespace)"; 
			       
		}

		// complete the event
		if (!map.events) {
			map.events = _ALL_;
		} else {
			// build the events, split by ',', add the namespace, and join back
			var events = map.events.split(",");
			$.each(events, function(idx, val) {
				events[idx] = $.trim(val) + "." + namespace;
			});
			map.events = events.join(", ");
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

		// if the $receiver does not exist, create it.
		if (!$receiver) {
			dic[objectType] = $receiver = $("<div class='" + objectType + "'></div>");
			$receiversRoot.append($receiver);
		}
		// trigger with the event.type == action
		$receiver.trigger(evt);

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
	 * @param events            e.g., "create, list, get" (null for any)
	 * @param objectTypes       e.g., "User, Task" (null for any)
	 * @param listenerFunction  The function to be called with the daoEvent
	 *            listenerFunction(event) with event.daoEvent as
	 *            daoEvent.action
	 *            daoEvent.entityType
	 *            daoEvent.resultPromise
	 *
	 */
	brite.dao.onDao = function(events, objectTypes, listenerFunction, namespace) {
		var map = buildDaoOnEventParamMap(arguments);
		$daoDao.on(map.events, map.objectTypes, map.func);
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
	 * @param events            e.g., "create, list, get" (null for any)
	 * @param objectTypes       e.g., "User, Task" (null for any)
	 * @param listenerFunction  The function to be called with the daoEvent
	 *            listenerFunction(daoEvent)
	 *            daoEvent.action
	 *            daoEvent.objectType
	 *            daoEvent.objectId
	 *            daoEvent.data
	 *            daoEvent.opts
	 *            daoEvent.result
	 */
	brite.dao.onResult = function(events, objectTypes, listenerFunction, namespace) {
		var map = buildDaoOnEventParamMap(arguments);
		$daoResult.on(map.events, map.objectTypes, map.func);
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
	 * @param {String} events: this dao action names e.g., "create, update" (null to listen to all events)
	 * @param {String} objectTypes: the object types e.g., "User, Task" (null for any object type);
	 */
	brite.dao.onDataChange = function(events, objectTypes, func, namespace) {
		var map = buildDaoOnEventParamMap(arguments);
		$daoDataChange.on(map.events, map.objectTypes, map.func);
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

// --------- InMemoryDaoHandler --------- //
(function($) {

	var defaultOpts = {
		idName : "id"
	}

	/**
	 * Create a InMemoryDaoHandler type
	 *
	 * Note: since it is a in memory store, all the dao function return entity clone object to make sure to avoid
	 *       the user to inadvertently change a stored entity.
	 *
	 * @param {String} objectType. create a table for dao with the Entity type (e.g., "User", "Task", or "Project").
	 * @param {Object} opts. Options for this
	 *                   opts.idName {String} the property name of the id value (default "id")
	 *
	 * @param {Array} seed. Seed the store. Array of object with their id (if not, uuid will be generated)
	 */
	function InMemoryDaoHandler(seed, opts) {
		init.call(this,seed, opts);
	}


	function init(seed,opts) {
		this._opts = $.extend({}, defaultOpts, opts);
		this._idName = this._opts.idName;

		initData.call(this, seed);
	}

	function initData(seed) {
		// ._dataDic is the dictionary for all the data as {id:obj} (not that the obj also has the obj[id] value
		var dic = this._dataDic = {};
		var idName = this._idName;

		if ($.isArray(seed)) {
			$.each(seed, function(idx, val) {
				var id = val[idName];
				if ( typeof id === "undefined") {
					id = brite.uuid();
					val[idName] = id;
				}
				dic[id] = val;
			});
		}

	}

	// --------- DAO Interface Implementation --------- //
	/**
	 * DAO Interface: Return the property idName property
	 * @param {string} the objectType
	 * @return the id (this is not deferred), default value is "id"
	 * @throws error if dao cannot be found
	 */
	InMemoryDaoHandler.prototype.getIdName = function() {
		return this._idName || "id";
	}

	/**
	 * DAO Interface. Return value directly since it is in memory.
	 * @param {String} objectType
	 * @param {Integer} id
	 * @return the entity
	 */
	InMemoryDaoHandler.prototype.get = function(id) {
		
		var entity = this._dataDic[id];
		if (entity) {
			return $.extend({}, entity);
		} else {
			return entity;
		}
	}

	/**
	 * DAO Interface: Create new object, set new id, and add it.
	 *
	 * @param {String} objectType
	 * @param {Object} newEntity if null, does nothing (TODO: needs to throw exception)
	 */
	InMemoryDaoHandler.prototype.create = function(newEntity) {
		if (newEntity) {
			var newId = brite.uuid();
			newEntity[this._idName] = newId;
			this._dataDic[newId] = newEntity;
		}

		return $.extend({}, newEntity);
	}

	/**
	 * DAO Interface: remove an instance of objectType for a given type and id.
	 *
	 * Return the id deleted
	 *
	 * @param {String} objectType
	 * @param {Integer} id
	 *
	 */
	InMemoryDaoHandler.prototype.remove = function(id) {
		var entity = this._dataDic[id];
		if (entity) {
			delete this._dataDic[id];
		}
		return id;
	}

	/**
	 * Additional methods to remove multiple items
	 * 
	 * @param {Array} ids. Array of entities id that needs to be removed 
	 * 
	 * @return the array of ids that have been removed
	 */
	InMemoryDaoHandler.prototype.removeMany = function(ids){
		var that = this;
		
		// TODO: need to check if the entity exists and 
		//       return only the list of ids that have been removed
		$.each(ids,function(idx,val){
			delete that._dataDic[val];
		});
		
		return ids;
	}

	/**
	 * DAO Interface: update a existing id with a set of property/value data.
	 *
	 * The DAO resolve with the updated data.
	 *
	 * @param {String} objectType
	 * @param {Object} data Object containing the id and the properties to be updated
	 *
	 * Return the new object data
	 */
	InMemoryDaoHandler.prototype.update = function(data) {
		var id = data[this._idName];
		if (typeof id === "undefined"){
			throw "BRITE ERROR: InMemoryDaoHandler.update: data does not have an id property. Cannot update.";	
		}
		var entity = this._dataDic[id];
		if (entity) {
			// make sure to remove the idName value TODO: need to check and throw error if not match
			delete data[this._idName];
			$.extend(entity, data);
			return $.extend({}, entity);
		} else {
			return null;
		}
	}

	/**
	 * DAO Interface: Return a deferred object for this objectType and options
	 * @param {String} objectType
	 * @param {Object} opts
	 *           opts.pageIndex {Number} Index of the page, starting at 0.
	 *           opts.pageSize  {Number} Size of the page
	 *           opts.match     {Object} Object of matching items. If item is a single value, then, it is a ===, otherwise, it does an operation
	 *                                        {prop:"name",op:"contains",val:"nana"} (will match an result like {name:"banana"})
	 *           opts.orderBy   {String}
	 *           opts.orderType {String} "asc" or "desc"
	 */
	InMemoryDaoHandler.prototype.list = function(opts) {

		opts = opts || {};

		var rawResultSet = [];

		$.each(this._dataDic, function(key, entity) {
			var k, needPush = true;

			if (opts.match) {
				var filters = opts.match;
				for (k in filters) {
					if (entity[k] !== filters[k]) {
						needPush = false;
						break;
					}
				}
			}

			// TODO: needs to do the match. Probably regex of some sort
			if (needPush) {
				rawResultSet.push(entity);
			}
		});

		if (opts.orderBy) {
			rawResultSet.sort(function(a, b) {
				var type = true;
				if (opts.orderType && opts.orderType.toLowerCase() == "desc") {
					type = false;
				}
				var value = a[opts.orderBy] >= b[opts.orderBy] ? 1 : -1;
				if (!type) {
					value = value * -1;
				}
				return value;
			});
		}

		if (opts.pageIndex || opts.pageIndex == 0) {
			if (opts.pageSize) {
				newResults = rawResultSet.slice(opts.pageIndex * opts.pageSize, (opts.pageIndex + 1) * opts.pageSize);
			} else if (opts.pageSize != 0) {
				newResults = rawResultSet.slice(opts.pageIndex * opts.pageSize);
			}
		}

		// recreate the new list but with clone object to protect raw entities
		var resultSet = $.map(rawResultSet, function(val) {
			return $.extend({}, val);
		});

		return resultSet;
	}

	// --------- /DAO Interface Implementation --------- //

	brite.InMemoryDaoHandler = InMemoryDaoHandler;

})(jQuery);
// --------- /InMemoryDaoHandler --------- //

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

// ------ /jQuery DAO Helper ------ //