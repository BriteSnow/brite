/**
* @namespace
* 
* User Agent utilities to know what capabilities the browser support.
*/
var useragent = {};

module.exports = useragent;


var CSS_PREFIXES = {webkit:"-webkit-",chrome:"-webkit-",mozilla:"-moz-",msie:"-ms-",opera:"-o-"};

var VAR_PREFIXES = {webkit:"Webkit",mozilla:"Moz",chrome:"Webkit",msie:"ms",opera:"o"};


// privates
var _cssVarPrefix = null;
var _cssPrefix = null;
var _cssHas = null;
var _cssHasNo = null;

var _hasTouch = null;
var _hasTransition = null;
var _hasBackfaceVisibility = null;
var _hasCanvas = null;
var _eventsMap = {}; // {eventName:true/false,....}

var _browserType = null; // could be "webkit" "moz" "ms" "o"

// --------- Get useragent.browser --------- //
// Use the jquery compat code. (we still need this for the prefix)
function uaMatch( ua ) {
	ua = ua.toLowerCase();

	var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
	/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
	/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
	/(msie) ([\w.]+)/.exec( ua ) ||
	ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
	[];

	return {
		browser: match[ 1 ] || "",
		version: match[ 2 ] || "0"
	};
}

var matched = uaMatch( navigator.userAgent );
var browser = {};	
if ( matched.browser ) {
	browser[ matched.browser ] = true;
	browser.version = matched.version;
}
// Chrome is Webkit, but Webkit is also Safari.
if ( browser.chrome ) {
	browser.webkit = true;
} else if ( browser.webkit ) {
	browser.safari = true;
}	
useragent.browser = browser;
// --------- /Get useragent.browser --------- //


// --------- Prefix and rendererType ------ //
function computeBrowserType(){
	$.each(CSS_PREFIXES,function(key){
		if (useragent.browser[key]){
			_browserType = key;
			_cssPrefix = CSS_PREFIXES[key];
			_cssVarPrefix = VAR_PREFIXES[key];
		}
	});
}

useragent.browserType = function(){
	if (_browserType === null){
		computeBrowserType();
	}
	return _browserType;
};

useragent.cssPrefix = function() {
	if (_cssPrefix === null){
		computeBrowserType();
	}
	return _cssPrefix;
};

useragent.cssVarPrefix = function() {
	if (_cssVarPrefix === null){
		computeBrowserType();
	}
	return _cssVarPrefix;
};
// --------- /Prefix and rendererType ------ //

/**
 * return a css friendly string with all the "has-**" that this ua supports
 * 
 * @example 
 *   useragent.cssHas(); // "has-canvas has-transition" for modern PC browsers
 *                      // "has-canvas has-transition has-touch" in the case of touch devices
 *   
 */
useragent.cssHas = function(){
	
	if (_cssHas === null){
		var STR = "has";
		_cssHas = "";
		$.each(useragent,function(key){
			var fun = useragent[key];
			var cssKey;
			if (key.indexOf(STR) === 0 && $.isFunction(fun)){
				if (fun.call(useragent)){
					cssKey = "has-" + key.substring(STR.length).toLowerCase();
					_cssHas += cssKey + " ";
				}
				
			}
		});
	}
	
	return _cssHas;
};

/**
 * Return a css friendly version of the "no" of the has. "has-no-canvas" for example.
 * 
 * @example
 *   useragent.
 */
useragent.cssHasNo = function(){
	if (_cssHasNo === null){
		var STR = "has";
		_cssHasNo = "";
		$.each(useragent,function(key){
			var fun = useragent[key];
			var cssKey;
			if (key.indexOf(STR) === 0 && $.isFunction(fun)){
				if (!fun.call(useragent)){
					cssKey = "has-no-" + key.substring(STR.length).toLowerCase();
					_cssHasNo += cssKey + " ";
				}
				
			}
		});
	}
	
	return _cssHasNo;		
};

/**
 * Return true if the eventname is supported by this user agent.
 * 
 * @param {Object}
 *            eventName
 */
useragent.supportsEvent = function(eventName) {
	var r = _eventsMap[eventName];
	if (typeof r === "undefined") {
		r = isEventSupported(eventName);
		_eventsMap[eventName] = r;
	}
	return r;
};

/**
 * Convenient methods to know if this user agent supports touch events. It tests "touchstart".
 */
useragent.mouseOnly = false; // TODO: temporary flag to force mouseOnly (while we add the window hybrid support)
useragent.hasTouch = function() {
	if (_hasTouch === null){
		_hasTouch = (this.supportsEvent("touchstart") && !useragent.mouseOnly);
	}
	return _hasTouch;
};

useragent.hasCanvas = function() {
	if (_hasCanvas === null) {
		var test_canvas = document.createElement("canvas");
		_hasCanvas = (test_canvas.getContext) ? true : false;
	}
	return _hasCanvas;
};

/**
 * Return true if the user agent supports CSS3 transition.
 */
useragent.hasTransition = function() {
	if (_hasTransition === null) {
		_hasTransition = hasStyle("transition","Transition","color 1s linear",true);
	}
	return _hasTransition;
};


useragent.hasBackfaceVisibility = function(){
	if (_hasBackfaceVisibility === null){
		_hasBackfaceVisibility = hasStyle("backface-visibility","BackfaceVisibility","hidden",true);
		
		// being conservative, because, sometime windows does not support backface visibility.
		if (navigator.platform.toLowerCase().indexOf("win") > -1){
			_hasBackfaceVisibility = false;	
		}
	}
	
	return _hasBackfaceVisibility;
};

// ------ Privates ------ //
function hasStyle(styleName,styleVarName,sampleValue,withPrefix){
	var div = document.createElement('div');
	styleName = (withPrefix)?(useragent.cssPrefix() + styleName):styleName;
	div.innerHTML = '<div style="' + styleName + ': ' + sampleValue + '"></div>';
	styleVarName = (withPrefix)?(useragent.cssVarPrefix() + styleVarName):styleVarName;
	return (div.firstChild.style[styleVarName])?true:false;		
}

var isEventSupported = (function() {
	var TAGNAMES = {
		'select' : 'input',
		'change' : 'input',
		'submit' : 'form',
		'reset' : 'form',
		'error' : 'img',
		'load' : 'img',
		'abort' : 'img'
	};

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
})();
// ------ /Privates ------ //