// NOT READY YET, DO NOT USE. 
// --------- brite.idb --------- //
// an attempt at making indexDb more $.Deferred oriented.
// experimental API 
(function($){
	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
	var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
	
	brite.idb = {};
	
	// wrap an indexDBRequest object into a Deferred
	// resolve with (result,event) and reject with (error,event)
	brite.idb.req = function(idbRequest){
		var dfd = $.Deferred();
		
		idbRequest.onsucess = function(event){
			dfd.resolve(event.target.result,event);
		}
		
		idbRequest.onerror = function(event){
			dfd.reject(event.error,event);
		}
		return dfd.promise();
	}
	
	brite.idb.open = function(dbName){
		var dfd = $.Deferred();
		
		var req = indexedDB.open(daoHandler.opts.dbName);
		
		idbRequest.onsucess = function(event){
			dfd.resolve(event.target.result,event);
		}
		
		idbRequest.onerror = function(event){
			dfd.reject(event.error,event);
		}
		
		return dfd.promise();
	}
	
	
})(jQuery);
// --------- /brite.idb --------- //

// --------- brite.IdbDaoHandler --------- //
(function($) {

	var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
	var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
	
	defaultOpts = {
		dbName: "default3",
		keyPath: "id"
	}

	/**
	 * Create a IdbDaoHandler type
	 *
	 * @param {String} objectType. create a table for dao with the Entity type (e.g., "User", "Task", or "Project").
	 * @param {Object} opts. Options for this
	 *                   opts.keyPath {String} the property name of the id value (default "id")
	 *
	 * @param {Array} seed. Seed the store. Array of object with their id (if not, uuid will be generated)
	 */
	function IdbDaoHandler(opts) {
		this.seed = seed;
		this.opts = $.extend(defaultOpts,opts);
	}


	idbDaoHandler.initDb(dbName,dbVersion,daos){
		var dfd = $.Deferred();

		var request = indexedDB.open(dbName,dbVersion);
		
		request.onerror = function(event){
			dfd.reject("Error: idbDaoHandler: error opening db: " + dbName + " with version: " + dbVersion);
		}
		
		request.onupgradeneeded = function(event){
		  var db = event.target.result;
		 	var objectStore = db.createObjectStore(daoHandler._entityType, { keyPath: daoHandler.opts.keyPath });
		 	console.log("onupgradeneeded: ",db.version,objectStore);
		}
		
		request.onsuccess = function(event){
			var db = event.target.result;
			dfd.resolve(db);
		}		
		
		return dfd.promise();
	}
	
	// --------- DAO Interface Implementation --------- //
	
	/**
	 * Call once at registerDao time
	 */
	IdbDaoHandler.prototype.init = function(entityType) {
		var daoHandler = this;
		
		console.log("init: " + daoHandler.opts.dbName);
		
		var request = indexedDB.open(daoHandler.opts.dbName);
		
		request.onerror = function(event){
			console.log("Error opening db : " + daoHandler.opts.dbName, event);
		}
		
		request.onupgradeneeded = function(event){
		  var db = event.target.result;
		 	var objectStore = db.createObjectStore(daoHandler._entityType, { keyPath: daoHandler.opts.keyPath });
		 	console.log("onupgradeneeded: ",db.version,objectStore);
		}
		
		request.onsuccess = function(event){
			var db = event.target.result;
		}	
		//var objectStore = db.createObjectStore("customers", { keyPath: "ssn" });
		
	}	
	
 	IdbDaoHandler.prototype.addMany = function(entities) {
		var daoHandler = this;
		var transaction = db.transaction([daoHandler._entityType], "readwrite");
		var objectStore = transaction.objectStore(daoHandler._entityType);
		return brite.whenEach(entities,function(entity){
			return brite.idb.req(userObjectStore.put(entity));
		});
	}
	
	/**
	 * DAO Interface: Return the property idName property
	 * @param {string} the objectType
	 * @return the id (this is not deferred), default value is "id"
	 * @throws error if dao cannot be found
	 */
	IdbDaoHandler.prototype.getIdName = function() {
		return this._idName || "id";
	}

	/**
	 * DAO Interface. Return value directly since it is in memory.
	 * @param {String} objectType
	 * @param {Integer} id
	 * @return the entity
	 */
	IdbDaoHandler.prototype.get = function(id) {
		
	}

	/**
	 * DAO Interface: Create new object, set new id, and add it.
	 *
	 * @param {String} objectType
	 * @param {Object} newEntity if null, does nothing (TODO: needs to throw exception)
	 */
	IdbDaoHandler.prototype.create = function(newEntity) {

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
	IdbDaoHandler.prototype.remove = function(id) {

	}

	/**
	 * Additional methods to remove multiple items
	 * 
	 * @param {Array} ids. Array of entities id that needs to be removed 
	 * 
	 * @return the array of ids that have been removed
	 */
	IdbDaoHandler.prototype.removeMany = function(ids){

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
	IdbDaoHandler.prototype.update = function(data) {

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
	IdbDaoHandler.prototype.list = function(opts) {

	}

	// --------- /DAO Interface Implementation --------- //

	brite.IdbDaoHandler = IdbDaoHandler;

})(jQuery);
// --------- /brite.IdbDaoHandler --------- //