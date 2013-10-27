/**
 * gtx is an experimental minimalistic canvas library. It's first (and almost only) goal
 * is to make the canvas api chainable. For more advanced canvas work, I would recommend to use easeljs or many 
 * other advanced canvas wrapping api. This is just a light way to make the raw canvas api a little
 * more pleasant. It was part of brite.js, but should be split away
 * if I decide to continue. 
 */
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