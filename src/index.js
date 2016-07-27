var core = require("./brite-core.js");
var ua = require("./brite-ua.js");
var dao = require("./brite-dao.js");
var utils = require("./brite-utils.js");
var event = require("./brite-event.js");

require("./brite-jquery-plugins.js");

var version = "1.1.6";

module.exports = {
	version: version,

	// views
	registerView: core.registerView,
	display: core.display,
	attach: core.attach,
	config: core.config,
	viewDefaultConfig: core.viewDefaultConfig,
	

	// dao
	dao: dao.dao, // true, little weird, will cleanup during deprecation
	registerDao: dao.registerDao,
	triggerDataChange: dao.triggerDataChange,

	// event
	event: event,

	// user agent
	ua: ua,

	// utils
	whenEach: utils.whenEach,
	uuid: utils.uuid,
	value: utils.value,
	substract: utils.substract,
	add: utils.add,
	array: utils.array,
	randomInt: utils.randomInt,
	inherit: utils.inherit,
	flushUI: utils.flushUI,

	// deprecated
	registerTransition: core.registerTransition,
	getTransition: core.getTransition,
	legacyDisplay: core.legacyDisplay,
	defaultComponentConfig: core.viewDefaultConfig,
	registerComponent: core.registerView
};

// for AMD component support
if ( typeof define === "function" && define.amd ) {
	define( "brite", [], function () { return brite; } );
} 

// when in browser environment, put brite in the global scope (to make britejs easier to include separatly)
if (typeof window !== "undefined"){
	window.brite = module.exports;
}

