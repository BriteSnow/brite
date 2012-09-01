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

// for the data events (brite.data.on() and brite.data.off())
brite.data = {};

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
	function buildDaoOnEventParamMap(args){
		var i, val, namespace, map = {};
		
		// build the map
		for (i = args.length - 1; i > -1; i--){
			val = args[i];
			// if it is a function, set it.
			if ($.isFunction(val)){
				map.func = val;
			}
			// if we did not get the function yet, this is the name space
			else if (!map.func){
				namespace = val;
		  }
		  // if we have the func, but not the objectTypes, this is the objectTypes
		  else if (map.func && typeof map.objectTypes === "undefined"){
		  	map.objectTypes = val;
		  }
		  // if we have the func and objectTypes, then this value is the events
		  else if (map.func &&  typeof map.objectTypes !== "undefined"){
		  	map.events = val;
		  }
		}
		
		// create the namespace if not present
		if (typeof namespace === "undefined"){
			namespace = brite.uuid();
		}
	  
	  // complete the event
	  if (!map.events){
	  	map.events = _ALL_;
	  }else{
	  	// build the events, split by ',', add the namespace, and join back
		  var events = map.events.split(",");
		  $.each(events,function(idx,val){
		  	events[idx] = $.trim(val) + "." + namespace;
		  });
		  map.events = events.join(", ");
	  }
	  
	  // complete the objectTypes
	  // build the objectTypes, split by ',', add the "." prefix, and join back
	  if (map.objectTypes){
		  var objectTypes = map.objectTypes.split(",");
		  $.each(objectTypes,function(idx,val){
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
	function _triggerDaoEvent(dic,$receiversRoot, objectType, daoEvent){
		
		var evt = $.extend(jQuery.Event(daoEvent.action),{daoEvent:daoEvent});
		
 		var $receiver = dic[objectType];
 		
 		// if the $receiver does not exist, create it. 
 		if (!$receiver){
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
	 *            daoEvent.objectType
	 *            daoEvent.objectId
	 *            daoEvent.data
	 *            daoEvent.opts
	 *            daoEvent.resultPromise 
	 * 
	 */
	brite.dao.onDao = function(events,objectTypes,listenerFunction,namespace){
		var map = buildDaoOnEventParamMap(arguments);
		$daoDao.on(map.events,map.objectTypes,map.func);
		return map.namespace;	
	}
	
	brite.dao.offDao = function(namespace){
		$daoDao.off("." + namespace);
  }
  
  function _triggerOnDao(resultPromise,action,objectType,objectId,data,opts){
		var daoEvent = {
				action: action,
				objectType: objectType,
				objectId: objectId,
				data: data, 
				opts: opts,
				resultPromise: resultPromise
		}
		
		_triggerDaoEvent(onDaoReceiverDic,$daoDao,objectType,daoEvent);
		
		// trigger the old way for backward compatibility
		callDaoListeners(resultPromise,action,objectType,objectId, data, opts)
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
	brite.dao.onResult = function(events,objectTypes,listenerFunction,namespace){
		var map = buildDaoOnEventParamMap(arguments);
		$daoResult.on(map.events,map.objectTypes,map.func);
		return map.namespace;
  }
  
  brite.dao.offResult = function(namespace){
  	$daoResult.off("." + namespace);
  }  
  
 	function _triggerOnResult(action,objectType,result){
 		var daoEvent = {
			action: action,
			result: result
		};
		
		_triggerDaoEvent(onResultReceiverDic,$daoResult,objectType,daoEvent);
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
	brite.dao.onDataChange = function(events,objectTypes, func, namespace){
	 	var map = buildDaoOnEventParamMap(arguments);
		$daoDataChange.on(map.events,map.objectTypes,map.func);
		return map.namespace;
 	}
 	
 	brite.dao.offDataChange = function(namespace){
 		$daoDataChange.off("." + namespace);
 	}
 	
 	brite.dao.triggerDataChange = function(action,objectType,objectId,newData,saveData){
 		var daoEvent = {
			action: action,
			objectType: objectType,
			objectId: objectId,
			newData: newData,
			saveData: saveData
		};
		
		_triggerDaoEvent(dataChangeReceiverDic,$daoDataChange,objectType,daoEvent);
 	}
 	
 	
 	function _triggerDataChange(action,objectType,objectId,newData,saveData){
 		// the current way
 		brite.dao.triggerDataChange(action,objectType,objectId,newData,saveData);
 		
 		// call the legacy API
 		callDataChangeListeners(action,objectType, objectId, newData, saveData);
 	}
 	
	// --------- /Brite.dao.onDataChange --------- //
	
  // --------- DAO Interface Callers --------- //
	/**
	 * Return the id property name (this is the only method in brite.dao that is not deferred)
	 */
	brite.dao.getIdName = function(objectType) {
		return getDao(objectType).getIdName(objectType);
	}

	/**
	 * Wrap the brite.sdm.get(objectType,id) with a deferred result
	 */
	brite.dao.get = function(objectType, objectId) {
		var resultPromise = wrapWithDeferred(getDao(objectType).get(objectType, objectId));
		
		_triggerOnDao(resultPromise,"get",objectType,objectId);
		
		resultPromise.done(function(result){
			_triggerOnResult("get",objectType,result);
		});		
		
		return resultPromise;
	}

	/**
	 * Wrap the brite.sdm.list(objectType,opts) with a deferred result
	 */
	brite.dao.list = function(objectType, opts) {
		var resultPromise = wrapWithDeferred(getDao(objectType).list(objectType, opts));
		
		_triggerOnDao(resultPromise,"list",objectType,null,null,opts);
		
		resultPromise.done(function(result){
			_triggerOnResult("list",objectType,result);
		});		
		
		return resultPromise;		
	}

	/**
	 * Wrap the brite.sdm.create(objectType,data) with a deferred result
	 */
	brite.dao.create = function(objectType, data) {
		var resultPromise = wrapWithDeferred(getDao(objectType).create(objectType, data));
		
		_triggerOnDao(resultPromise,"create",objectType,null,data);
		
		resultPromise.done(function(result){
			_triggerOnResult("create",objectType,result);
			_triggerDataChange("create",objectType, null, result, data);
		});
		
		return resultPromise;
	}

	/**
	 * Wrap the brite.sdm.update(objectType,id,data) with a deferred result
	 */
	brite.dao.update = function(objectType, objectId, data) {
		var resultPromise = wrapWithDeferred(getDao(objectType).update(objectType, objectId, data));
		
		_triggerOnDao(resultPromise,"update",objectType,objectId,data);
		
		resultPromise.done(function(result){
			_triggerOnResult("update",objectType,result);
			_triggerDataChange("update",objectType, objectId, result, data);
		});
		
		return resultPromise; 
	}

	/**
	 * Wrap the brite.sdm.remove(objectType,id) with a deferred result
	 */
	brite.dao.remove = function(objectType, objectId) {
		var resultPromise = wrapWithDeferred(getDao(objectType).remove(objectType, objectId));
		
		_triggerOnDao(resultPromise,"remove",objectType,objectId);
		
		resultPromise.done(function(result){
			_triggerOnResult("remove",objectType,objectId);
			_triggerDataChange("remove",objectType, objectId);
		});
		
		return resultPromise;
	}
	
	/**
	 * Wrap the brite.sdm.invoke(methodName,objectType) with a deferred result
	 */
	brite.dao.invoke = function(methodName, objectType) {
		var args = Array.prototype.slice.call(arguments,0); 
		
		var dao = getDao(objectType);
		if (!dao) throw  ("cannot find dao for " + objectType);
		if (!dao[methodName]) throw  ("no custom method for " + methodName);
			
		var resultPromise = wrapWithDeferred(dao[methodName].apply(dao,args.slice(1)));
		
		// TODO: need to trigger with all the arguments pass in the invoke
		_triggerOnDao(resultPromise,methodName,objectType);
		
		resultPromise.done(function(result){
			_triggerOnResult(methodName,objectType,result);
			
			if (dao.isDataChange && dao.isDataChange(methodName)){
				_triggerDataChange("methodName",objectType,result);
			}
			
		});
		
		return resultPromise;		
	}	
	// --------- /DAO Interface Callers --------- //

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

  // ------- Legacy Event Management --------- //
  
	
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
	 * LEGACY: do not use. Use, brite.dao.onDataChange
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
	
	/**
	 * LEGACY: do not use. User, brite.dao.offDataChange
	 */
	brite.removeDataChangeListener = function(listenerId){
		$.each(daoChangeEventListeners,function(idx,listeners){
			delete listeners[listenerId];
		})
	}  
  
	function callDaoListeners(result,action,objectType,id, data, opts){
		var daoEvent = {
				result: result,
				action: action,
				type: action,
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
			type: action,
			objectType: objectType,
			objectId: id,
			newData: newData,
			saveData: saveData
		};
		
		// old way: addDataChangeListener
		_callDataChangeListeners(dataChangeEvent);
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
	
  // ------- Legacy Event Management --------- //	

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