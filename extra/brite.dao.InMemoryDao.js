(function($){

  var defaultOpts = {
  	identity: "id"
  }
  
	/**
	 * Create a InMemoryDao type 
	 * 
	 * Note: since it is a in memory store, all the dao function return entity clone object to make sure to avoid
	 *       the user to inadvertently change a stored entity.  
	 * 
	 * @param {String} objectType. create a table for dao with the Entity type (e.g., "User", "Task", or "Project").
	 * @param {Object} opts. Options for this 
   *                   opts.identity {String} the property name of the id value (default "id")
	 * 
	 * @param {Array} seed. Seed the store. Array of object with their id (if not, uuid will be generated)
	 */
	function InMemoryDao(objectType, opts, seed){
		this.init(objectType, opts,seed);
	}

	InMemoryDao.prototype.init = function(objectType, opts, seed){
		this._objectType = objectType;
		this._opts = $.extend({},defaultOpts,opts);
		this._identity = this._opts.identity;
		
		initData.call(this,seed);
	}
	
	function initData(seed){
		// ._dataDic is the dictionary for all the data as {id:obj} (not that the obj also has the obj[id] value
		var dic = this._dataDic = {};
		var idName = this._identity; 
		
		if ($.isArray(seed)){
			$.each(seed,function(idx,val){
				var id = val[idName];
				if (typeof id === "undefined"){
					id = brite.uuid();
					val[idName] = id;
				}
				dic[id] = val;
			});
		}		
		
	}

	// --------- DAO Interface Implementation --------- //
	/**
	 * DAO Interface: Return the property ID name
	 * @param {string} the objectType
	 * @return the id (this is not deferred), default value is "id"
	 * @throws error if dao cannot be found
	 */
	InMemoryDao.prototype.getIdName = function(objectType){
		return this._identity || "id";
	}

	
	/**
	 * DAO Interface. Return value directly since it is in memory. 
	 * @param {String} objectType
	 * @param {Integer} id
	 * @return the entity
	 */
	InMemoryDao.prototype.get = function(objectType, id){
		var entity = this._dataDic[id];
		if (entity){
			return $.extend({},entity);
	  }else{
	  	return entity;
	  } 
	}

	/**
	 * DAO Interface: Create new object, set new id, and add it. 
	 *
	 * @param {String} objectType
	 * @param {Object} newEntity if null, does nothing (TODO: needs to throw exception)
	 */
	InMemoryDao.prototype.create = function(objectType, newEntity){
		if (newEntity){
			var newId = brite.uuid();
			newEntity[this._identity] = newId;
			this._dataDic[newId] = newEntity;
		}
		
		return $.extend({},newEntity);
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
	InMemoryDao.prototype.remove = function(objectType, id){
		var entity = this._dataDic[id];
		if (entity){
			delete this._dataDic[id];
		}
		return id;
	}
	
	/**
	 * DAO Interface: update a existing id with a set of property/value data.
	 *
	 * The DAO resolve with the updated data.
	 *
	 * @param {String} objectType
	 * @param {Integer} id
	 * @param {Object} data
	 * 
	 * Return the new object data
	 */
	InMemoryDao.prototype.update = function(objectType, id, data){
		var entity = this._dataDic[id];
		if (entity){
			// make sure to remove the identity value TODO: need to check and throw error if not match
			delete data[this._identity];
			$.extend(entity,data);
			return $.extend({},entity);
	 	}else{
	 		return null;
	 	}
	}
	
	/**
	 * DAO Interface: Return a deferred object for this objectType and options
	 * @param {String} objectType
	 * @param {Object} opts 
	 *           opts.pageIndex {Number} Index of the page, starting at 0.
	 *           opts.pageSize  {Number} Size of the page
	 *           opts.match     {Object} add condition 'like' in the where clause.
	 *           opts.equal     {Object} add condition '=' the where clause.
	 *           opts.orderBy   {String}
	 *           opts.orderType {String} "asc" or "desc"
	 */
	InMemoryDao.prototype.list = function(objectType, opts){
		
		opts = opts || {};
				
		var rawResultSet = [];
		
		$.each(this._dataDic,function(key,entity){
				var k, needPush = true;
				
				if(opts.equal){
					var filters = opts.equal;
					for(k in filters){
						if(entity[k] !== filters[k]){
							needPush = false;
							break;
						}
					}
				}
				
				// TODO: needs to do the match. Probably regex of some sort
				if (needPush){
					rawResultSet.push(entity);
				}
		});
		
		if(opts.orderBy){
			rawResultSet.sort(function(a,b){
				var type = true;
				if(opts.orderType && opts.orderType.toLowerCase() == "desc"){
					type = false;
				}
				var value = a[opts.orderBy] >= b[opts.orderBy] ? 1 : -1;
				if(!type){
					value = value * -1;
				}
				return  value;
			});
		}
		
		if(opts.pageIndex || opts.pageIndex == 0){
			if(opts.pageSize){
				newResults = rawResultSet.slice(opts.pageIndex * opts.pageSize,(opts.pageIndex + 1) * opts.pageSize);
			}else if(opts.pageSize != 0){
				newResults = rawResultSet.slice(opts.pageIndex * opts.pageSize);
			}
		}
		
		
		
		// recreate the new list but with clone object to protect raw entities
		var resultSet = $.map(rawResultSet,function(val){
			return $.extend({},val);
		});
		
		return resultSet;		
	}
	
	// --------- /DAO Interface Implementation --------- //
	brite.dao.InMemoryDao = InMemoryDao;
		
})(jQuery);