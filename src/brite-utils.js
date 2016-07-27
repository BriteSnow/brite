var ua = require("./brite-ua.js");

var utils = {}; 

module.exports = utils;

utils.DOC_EVENT_NS_PREFIX = ".";
utils.WIN_EVENT_NS_PREFIX = ".";

// add the trim prototype if not available natively.
if(!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g,'');
	};
}

// default options for brite.whenEach
var whenEachOpts = {
	failOnFirst : true
};

/**
 * Convenient function that resolve each items serially with resolver function. 
 * 
 * @param {Array}    items:    array values to iterate through
 * @param {Function} resolver: will be called with resolver(value,index) and can return the result or a promise of the result.
 * @param {Object}   opts: (optional) options with the following values
 *                     opts.failOnFirst {boolean} (default: true) if true, will reject on first fail with error object
 * 
 * @return {Promise} promise that will get resolve with an Array of result of each value
 * 
 * The promise is resolve with an array of result when success
 * 
 * The promise is rejected with an array of {success:[true/false],value:[result/error]}
 *     
 */
utils.whenEach = function(items,resolver,opts){
	var dfd = $.Deferred();
	var results = [];
	var i = 0;
	
	opts = $.extend({},whenEachOpts, opts);
	
	resolveAndNext();
	
	function resolveAndNext(){
		if (i < items.length){
			var item = items[i];
			var result = resolver(item,i);

			// if the result is a promise (but not a jquery object, which is also a promise), then, pipe it
			if (typeof result !== "undefined" && result !== null && $.isFunction(result.promise) && !result.jquery){
				result.done(function(finalResult){
					results.push(finalResult);
					i++;
					resolveAndNext();
				});		
				
				// if it fails, then, reject
				// TODO: needs to support the failOnFirst: true
				result.fail(function(ex){
					var fails = $.map(function(val){
						return {success:true,value:val};
					});
					fails.push({success:false,value:ex});
					dfd.reject(fails);
				});
				// TODO: need to handle the case the promise fail
			}
			// if it is a normal object or a jqueryObject, then, just push the value and move to the next
			else{
				results.push(result);
				i++;
				resolveAndNext();
			}
		}
		// once we run out
		else{
			dfd.resolve(results);
		}
	} 
	
	return dfd.promise();
};


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
utils.uuid = function(len, radix) {
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
// deprecated 
utils.value = function(rootObj, pathToValue) {
	if (!rootObj) {
		return rootObj;
	}
	// for now, return the rootObj if the pathToValue is empty or null or undefined
	if (!pathToValue) {
		return rootObj;
	}
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
};

// substract all the values for two object (ignore the not numbers one), and return the new object.
// deprecated
utils.substract = function(obj1,obj2){
	var r = {};
	$.each(obj1,function(key,val1){
		var val2 = obj2[key];
		if (!isNaN(val1) && !isNaN(val2)){
			r[key] = val1 - val2;
		}
	});
		
	return r;
};

// add all the values for two object (ignore the not numbers one), and return the new object.
// deprecated
utils.add = function(obj1,obj2){
	var r = {};
	$.each(obj1,function(key,val1){
		var val2 = obj2[key];
		if (!isNaN(val1) && !isNaN(val2)){
			r[key] = val1 + val2;
		}
	});
		
	return r;
};

/**
 * @namespace
 * 
 * Array utilities
 */
// deprecated 
utils.array = {

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
			for (i = 0; i < l; i++) {
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
};

/**
 * Give a random number between two number
 * 
 * @param {Object}
 *            from
 * @param {Object}
 *            to
 */
// deprecated 
utils.randomInt = function(from, to) {
	var offset = to - from;
	return from + Math.floor(Math.random() * (offset + 1));
};

// from the "JavaScript Pattern" book
utils.inherit = function(C, P) {
	var F = function() {
	};
	F.prototype = P.prototype;
	C.prototype = new F();
	C._super = P.prototype; 
	C.prototype.constructor = C;
};


// hack to force the browsers on mobile devices to redraw
// basically, it is a visually invisible div, but technically in the display tree
// that we change the content and css property (width). This seems to force the browser to refresh
var _flushUIVar = 2;
var _$flushUI;
utils.flushUI = function(){
	if (ua.hasTouch()){
		if (!_$flushUI){
			_$flushUI = $("<div id='b-flushUI' style='position:absolute;opacity:1;z-index:-1000;overflow:hidden;width:2px;color:rgba(0,0,0,0)'>flushUI</div>");
			$("body").append(_$flushUI);
		}
		_flushUIVar = _flushUIVar * -1;
		_$flushUI.text("").text(_flushUIVar);
		_$flushUI.css("width",_flushUIVar + "px");
	}
};
