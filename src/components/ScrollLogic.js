/*
 * scroll-logic
 * http://github.com/prinzhorn/scroll-logic
 *
 * Copyright 2011, Zynga Inc.
 * Modifications by Alexander Prinzhorn (@Prinzhorn)
 * Licensed under the MIT License.
 * https://github.com/Prinzhorn/scroll-logic/blob/master/LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 */

(function() {
	// How much velocity is required to start the deceleration.
	// This keeps the scroller from animating if the user is just slowly scrolling through.
	var MIN_VELOCITY_FOR_DECELERATION = 1;

	// The minimum distance before we start dragging.
	// This keeps small taps from moving the scroller.
	var MIN_DRAG_DISTANCE = 5;

	// The minimum velocity (in pixels per frame) after which we terminate the deceleration.
	var MIN_VELOCITY_BEFORE_TERMINATING = 0.1;

	// ScrollLogic doesn't care about fps, but this contant makes some of the math easier to understand.
	var FPS = 60;

	// The velocity changes by this amount every frame.
	var FRICTION_PER_FRAME = 0.95;

	// This means overscrolling is twice as hard than normal scrolling.
	var EDGE_RESISTANCE = 3;

	// Zoom limits
	var MIN_ZOOM = 0.25;
	var MAX_ZOOM = 4;

	/**
	 * A pure logic 'component' for 'virtual' scrolling.
	 */
	var ScrollLogic = function(options) {
		this.options = {

			/** Enable animations for deceleration, snap back and scrolling */
			animating: true,

			/** duration for animations triggered by scrollTo */
			animationDuration: 250,

			/** Enable bouncing (content can be slowly moved outside and jumps back after releasing) */
			bouncing: true

		};

		for (var key in options) {
			this.options[key] = options[key];
		}
	};


	// Easing Equations (c) 2003 Robert Penner, all rights reserved.
	// Open source under the BSD License.
	// Optimized and refactored by @Prinzhorn. Also I don't think you can apply a license to such a tiny bit of math.

	var easeOutCubic = function(pos) {
		pos = pos - 1;

		return pos * pos * pos + 1;
	};

	var easeInOutCubic = function(pos) {
		if (pos < 0.5) {
			return 4 * pos * pos * pos;
		}

		//The >= 0.5 case is the same as easeOutCubic, but I'm not interested in a function call here.
		//It would simply be return easeOutCubic(p); if you want to.
		pos = pos - 1;

		return 4 * pos * pos * pos + 1;
	};

	var easeOutExpo = function(p) {
		//Make sure to map 1.0 to 1.0, because the formula below doesn't exactly yield 1.0 but 0.999023
		if(p === 1) {
			return 1;
		}

		return 1 - Math.pow(2, -10 * p);
	};

	var easeOutBack = function(pos) {
		var s = EDGE_RESISTANCE;

		pos = pos - 1;

		return (pos * pos * ((s + 1) * pos + s) + 1);
	};


	var members = {

		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: STATUS
		---------------------------------------------------------------------------
		*/

		// Whether a touch event sequence is in progress.
		__isInteracting: false,

		// Whether the user has moved by such a distance that we have enabled dragging mode.
		__isDragging: false,

		// Contains the animation configuration, if one is running.
		__animation: null,


		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: DIMENSIONS
		---------------------------------------------------------------------------
		*/

		/** {Integer} Available container length */
		__containerWidth: 0,
		__containerHeight: 0,

		/** {Integer} Outer length of content */
		__contentWidth: 0,
		__contentHeight: 0,

		/** {Number} Scroll position */
		__scrollOffsetX: 0,
		__scrollOffsetY: 0,
		__zoom: 1,

		/** {Integer} Maximum allowed scroll position */
		__maxScrollOffsetX: 0,
		__maxScrollOffsetY: 0,


		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: LAST POSITIONS
		---------------------------------------------------------------------------
		*/

		/** {Number} Position of finger at start */
		__lastTouchOffsetX: null,
		__lastTouchOffsetY: null,

		/** {Date} Timestamp of last move of finger. Used to limit tracking range for deceleration speed. */
		__lastTouchMove: null,

		/** {Array} List of positions, uses three indexes for each state: offsetX/Y and timestamp */
		__positions: null,


		/*
		---------------------------------------------------------------------------
			PUBLIC API
		---------------------------------------------------------------------------
		*/

		/**
		 * Configures the dimensions of the client (outer) and content (inner) elements.
		 * Requires the available space for the outer element and the outer size of the inner element.
		 * All values which are falsy (null or zero etc.) are ignored and the old value is kept.
		 *
		 * @param containerWidth {Integer ? null} Inner width of outer element
		 * @param contentWidth {Integer ? null} Outer width of inner element
		 */
		setDimensions: function(containerWidth, containerHeight, contentWidth, contentHeight) {
			if (!containerWidth || !containerHeight || !(contentWidth >= 0) || !(contentHeight >= 0) )
				throw new Error('Scroller setDimensions received invalid arguments')
			var self = this;

			// Do nothing when the lengths are the same
			if(containerWidth === self.__containerWidth && containerHeight === self.__containerHeight
				&& contentWidth === self.__contentWidth && contentHeight === self.__contentHeight) {
				return;
			}

			self.__containerWidth = Math.round(containerWidth);
			self.__containerHeight = Math.round(containerHeight);
			self.__contentWidth = Math.round(contentWidth);
			self.__contentHeight = Math.round(contentHeight);

			// Refresh maximums
			self.__maxScrollOffsetX = Math.max(contentWidth - containerWidth, 0);
			self.__maxScrollOffsetY = Math.max(contentHeight - containerHeight, 0);

			// Refresh scroll position
			self.scrollTo(self.getTargetX(), self.getTargetY(), true, self.getTargetZoom());
		},

		setContainerDimensions: function(width, height) {

			var self = this;
			self.setDimensions(width, height, self.__contentWidth, self.__contentHeight);

		},

		setContentDimensions: function(width, height) {

			var self = this;
			self.setDimensions(self.__containerWidth, self.__containerHeight, width, height);

		},


		/**
		 * Calculates and returns the current scroll position.
		 */
		getOffsetX: function() {
			var animation = this.__animation;
			var percentage = this.isAnimating()
			var newOffsetX;

			if (percentage < 1) {
				percentage = animation.easing(percentage);
				newOffsetX = animation.fromX + (animation.distanceX * percentage);

				//Without bouncing we need to prevent overscrolling and make a hard cut.
				if(!this.options.bouncing) {
					if(newOffsetX < 0) {
						newOffsetX = 0;
						this.__animation.fromX = newOffsetX;
						this.__animation.distanceX = 0;
					} else if(newOffsetX > this.__maxScrollOffsetX) {
						newOffsetX = this.__maxScrollOffsetX;
						this.__animation.fromX = newOffsetX;
						this.__animation.distanceX = 0;
					}
				}

				//We only want integer offsets, anything else does not make sense.
				this.__scrollOffsetX = (newOffsetX + 0.5) | 0;
			}

			return this.__scrollOffsetX;
		},

		getOffsetY: function() {
			var animation = this.__animation;
//console.log('getY: y='+this.__scrollOffsetY+' anim='+JSON.stringify(animation)+' width='+this.__contentWidth+' ny='+newOffsetY)
			var percentage = this.isAnimating()
			var newOffsetY;

			if (percentage < 1) {
				percentage = animation.easing(percentage);
				newOffsetY = animation.fromY + (animation.distanceY * percentage);
				//Without bouncing we need to prevent overscrolling and make a hard cut.
				if(!this.options.bouncing) {
					if(newOffsetY < 0) {
						newOffsetY = 0;
						this.__animation.fromY = newOffsetY;
						this.__animation.distanceY = 0;
					} else if(newOffsetY > this.__maxScrollOffsetY) {
						newOffsetY = this.__maxScrollOffsetY;
						this.__animation.fromY = newOffsetY;
						this.__animation.distanceY = 0;
					}
				}

				//We only want integer offsets, anything else does not make sense.
				this.__scrollOffsetY = (newOffsetY + 0.5) | 0;
			}

			return this.__scrollOffsetY;
		},

		getCurrentZoom: function() {
			var animation = this.__animation;
			var percentage = this.isAnimating()
			var newZoom;

			if (percentage < 1) {
				percentage = animation.easing(percentage);
				newZoom = animation.fromZoom + (animation.changeZoom * percentage);
				if (newZoom < MIN_ZOOM) {
					newZoom = MIN_ZOOM
					animation.fromZoom = newZoom;
					animation.changeZoom = 0;
				} else if (newZoom > MAX_ZOOM) {
					newZoom = MAX_ZOOM
					animation.fromZoom = newZoom;
					animation.changeZoom = 0;
				}
				this.__zoom = newZoom;
			}

			return this.__zoom;
		},

		isAnimating() {
			var animation = this.__animation;
			if (animation) {
				var percentage = (Date.now() - animation.start) / animation.duration;
				if (percentage >= 1) {
//console.log('anim1: y='+this.__scrollOffsetY+' anim='+JSON.stringify(animation)+' width='+this.__contentWidth+' p='+percentage)
					this.__scrollOffsetX = animation.fromX + animation.distanceX;
					this.__scrollOffsetY = animation.fromY + animation.distanceY;
					this.__zoom = animation.fromZoom + animation.changeZoom;
					this.__animation = null;
					return percentage
				} else return percentage
			} else return 1
		},

		getTargetX: function() {
			var animation = this.__animation;
			return animation ? (animation.fromX + animation.distanceX) : this.__scrollOffsetX;
                },

		getTargetY: function() {
			var animation = this.__animation;
			return animation ? (animation.fromY + animation.distanceY) : this.__scrollOffsetY;
                },

		getTargetZoom: function() {
			var animation = this.__animation;
			return animation ? (animation.fromZoom + animation.changeZoom) : this.__zoom;
                },

		/**
		 * Returns the maximum scroll values
		 */
		getScrollMax: function() {
			return this.__maxScrollOffsetX;
		},


		/**
		 * Is scroll-logic currently doing anything?
		 */
		isResting: function() {
			return !this.__isInteracting && !this.__animation;
		},


		/**
		 * Scrolls to the given position. Respects bounds automatically.
		 */
		scrollTo: function(offsetX, offsetY, animate, zoom) {
			var self = this;

			// Stop deceleration
			if (self.__animation) {
				self.__animation = null;
			}

			// Limit for allowed ranges
			offsetX = Math.max(Math.min(self.__maxScrollOffsetX, offsetX), 0);
			offsetY = Math.max(Math.min(self.__maxScrollOffsetY, offsetY), 0);
			if (!zoom) zoom = this.getTargetZoom();
			else zoom = Math.max(Math.min(MAX_ZOOM, zoom), MIN_ZOOM);

			// Don't animate when no change detected, still call publish to make sure
			// that rendered position is really in-sync with internal data
			if (offsetX === self.__scrollOffsetX && offsetY === self.__scrollOffsetY) {
				animate = false;
			}

			// Publish new values
			self.__publish(offsetX, offsetY, animate, zoom);

		},


		handleInteraction: function(deltaX, deltaY, timeStamp) {
			var self = this;
			if (!self.__isInteracting) {
				self.beginInteraction(deltaX, deltaY);
				return true;
			} else {
				self.interact(deltaX + self.__lastTouchOffsetX, deltaY + self.__lastTouchOffsetY, timeStamp);
				return false;
			}
		},

		/**
		 * Begin a new interaction with the scroller.
		 */
		beginInteraction: function(offsetX, offsetY, timeStamp) {
			var self = this;

			// Stop animation
			if (self.__animation) {
				self.__animation = null;
			}

			// Store initial positions
			self.__initialTouchOffsetX = offsetX;
			self.__initialTouchOffsetY = offsetY;

			// Store initial touch positions
			self.__lastTouchOffsetX = offsetX;
			self.__lastTouchOffsetY = offsetY;

			// Store initial move time stamp
			self.__lastTouchMove = timeStamp;

			// Reset tracking flag
			self.__isInteracting = true;

			// Dragging starts lazy with an offset
			self.__isDragging = false;

			// Clearing data structure
			self.__positions = [];
		},


		/**
		 * A new user interaction with the scroller
		 */
		interact: function(offsetX, offsetY, timeStamp) {
			var self = this;

			// Ignore event when tracking is not enabled (event might be outside of element)
			if (!self.__isInteracting) {
				return;
			}

			var positions = self.__positions;
			var currentOffsetX = self.__scrollOffsetX;
			var currentOffsetY = self.__scrollOffsetY;

			// Are we already is dragging mode?
			if (self.__isDragging) {

				// Compute move distance
				var distanceX = offsetX - self.__lastTouchOffsetX;
				var distanceY = offsetY - self.__lastTouchOffsetY;

				// Update the position
				var newOffsetX = currentOffsetX - distanceX;
				var newOffsetY = currentOffsetY - distanceY;

				// Scrolling past one of the edges.
				if (newOffsetX < 0 || newOffsetX > self.__maxScrollOffsetX) {
					// Slow down on the edges
					if (self.options.bouncing) {
						// While overscrolling, apply the EDGE_RESISTANCE to make it move slower.
						newOffsetX = currentOffsetX - (distanceX / EDGE_RESISTANCE);
					}
					// Bouncing is disabled, prevent overscrolling.
					else {
						if (newOffsetX < 0) newOffsetX = 0;
						else newOffsetX = self.__maxScrollOffsetX;
					}
				}
				if (newOffsetY < 0 || newOffsetY > self.__maxScrollOffsetY) {
					// Slow down on the edges
					if (self.options.bouncing) {
						// While overscrolling, apply the EDGE_RESISTANCE to make it move slower.
						newOffsetY = currentOffsetY - (distanceY / EDGE_RESISTANCE);
					}
					// Bouncing is disabled, prevent overscrolling.
					else {
						if (newOffsetY < 0) newOffsetY = 0;
						else newOffsetY = self.__maxScrollOffsetY;
					}
				}

				// Keep list from growing infinitely (holding min 10, max 20 measure points)
				if (positions.length > 60) {
					positions.splice(0, 30);
				}

				// Make sure this is an integer
				newOffsetX = (newOffsetX + 0.5) | 0;
				newOffsetY = (newOffsetY + 0.5) | 0;

				// Track scroll movement for deceleration
				positions.push(newOffsetX, newOffsetY, timeStamp);

				// Sync scroll position
				self.__publish(newOffsetX, newOffsetY, false, this.getTargetZoom());

			// Otherwise figure out whether we are switching into dragging mode now.
			} else {
				var completeX = Math.abs(offsetX - self.__initialTouchOffsetX);
				var completeY = Math.abs(offsetY - self.__initialTouchOffsetY);

				positions.push(currentOffsetX, currentOffsetY, timeStamp);

				self.__isDragging = (Math.max(completeX, completeY) >= MIN_DRAG_DISTANCE);
			}

			// Update last touch positions and time stamp for next event
			self.__lastTouchOffsetX = offsetX;
			self.__lastTouchOffsetY = offsetY;
			self.__lastTouchMove = timeStamp;

		},


		/**
		 * Stop the user interaction
		 */
		endInteraction: function(timeStamp) {

			var self = this;

			if (!self.__isInteracting || !self.__isDragging) {
				return;
			}

			self.__isInteracting = false;
			self.__isDragging = false;

			var scrollOffsetX = self.__scrollOffsetX;
			var scrollOffsetY = self.__scrollOffsetY;
			var zoom = self.getTargetZoom();

			// If the user dragged past the bounds, just snap back.
			if(scrollOffsetX < 0 || scrollOffsetX > self.__maxScrollOffsetX
				|| scrollOffsetY < 0 || scrollOffsetY > self.__maxScrollOffsetY) {
				return self.scrollTo(scrollOffsetX, scrollOffsetY, true, zoom);
			}

			if (self.options.animating) {

				var lastTouchMove = self.__lastTouchMove;

				// Start deceleration
				// Verify that the last move detected was in some relevant time frame
				//TODO: remove magic number 100
				if(timeStamp - lastTouchMove <= 100) {

					// Then figure out what the scroll position was about 100ms ago
					var positions = self.__positions;
					var positionsIndexEnd = positions.length - 1;
					var positionsIndexStart = positionsIndexEnd;
					var positionsIndex = positionsIndexEnd;

					// Move pointer to position measured 100ms ago
					// The positions array contains alternating offset/timeStamp pairs.
					for (; positionsIndex > 0; positionsIndex = positionsIndex - 3) {
						// Did we go back far enough and found the position 100ms ago?
						if(positions[positionsIndex] <= (lastTouchMove - 100)) {
							break;
						}

						positionsIndexStart = positionsIndex;
					}

					// If start and stop position is identical in a 100ms timeframe,
					// we cannot compute any useful deceleration.
					if (positionsIndexStart !== positionsIndexEnd) {

						// Compute relative movement between these two points
						var timeOffset = positions[positionsIndexEnd] - positions[positionsIndexStart];
						var movedOffsetX = scrollOffsetX - positions[positionsIndexStart - 2];
						var movedOffsetY = scrollOffsetY - positions[positionsIndexStart - 1];

						// Based on 50ms compute the movement to apply for each render step
						var velocityX = movedOffsetX / timeOffset * (1000 / 60);
						var velocityY = movedOffsetY / timeOffset * (1000 / 60);

						// Verify that we have enough velocity to start deceleration
						if (Math.abs(velocityX) > MIN_VELOCITY_FOR_DECELERATION
							|| Math.abs(velocityY) > MIN_VELOCITY_FOR_DECELERATION) {
							//self.__startDeceleration(velocityX, velocityY);
						}
					}
				}
			}

			// Fully cleanup list
			self.__positions.length = 0;

		},



		/*
		---------------------------------------------------------------------------
			PRIVATE API
		---------------------------------------------------------------------------
		*/

		/**
		 * Applies the scroll position to the content element
		 *
		 * @param left {Number} Left scroll position
		 * @param top {Number} Top scroll position
		 * @param animate {Boolean?false} Whether animation should be used to move to the new coordinates
		 */
		__publish: function(newOffsetX, newOffsetY, animate, newZoom) {
			var self = this;

			// Remember whether we had an animation, then we try to continue based on the current "drive" of the animation
			var wasAnimating = !!self.__animation;
			if (wasAnimating) {
				self.__animation = null;
			}

			if (newOffsetX * 0 != 0 || newOffsetY * 0 != 0 || newZoom * 0 != 0)
				throw new Error('ScrollLogic __publish received illegal arguments '+newOffsetX+','+newOffsetY+','+newZoom)

			if (animate && self.options.animating) {

				var oldOffsetX = self.__scrollOffsetX;
				var oldOffsetY = self.__scrollOffsetY;
				var oldZoom = self.__zoom;
				var distanceX = newOffsetX - oldOffsetX;
				var distanceY = newOffsetY - oldOffsetY;
				var changeZoom = newZoom - oldZoom;
//console.log('publish: x='+newOffsetX+' y='+newOffsetY+' width='+this.__contentWidth+' dy='+distanceY+' r='+newZoom)

				self.__animation = {
					start: Date.now(),
					duration: self.options.animationDuration,
					// When continuing based on previous animation we choose an ease-out animation instead of ease-in-out
					easing: wasAnimating ? easeOutCubic : easeInOutCubic,
					fromX: oldOffsetX,
					fromY: oldOffsetY,
					fromZoom: oldZoom,
					distanceX: distanceX,
					distanceY: distanceY,
					changeZoom: changeZoom
				};

			} else {

				self.__scrollOffsetX = newOffsetX;
				self.__scrollOffsetY = newOffsetY;
				self.__zoom = newZoom;

			}
//console.log('begin animating: '+JSON.stringify(self.__animation)+' zoom='+this.__zoom+' newZoom='+newZoom)

		},


		/*
		---------------------------------------------------------------------------
			ANIMATION (DECELERATION) SUPPORT
		---------------------------------------------------------------------------
		*/

		/**
		 * Called when a touch sequence end and the speed of the finger was high enough
		 * to switch into deceleration mode.
		 */
		__startDeceleration: function(velocity, velocityY) {

			var self = this;

			// Calculate the duration for the deceleration animation, which is a function of the start velocity.
			// This formula simply means we apply FRICTION_PER_FRAME to the velocity every frame, until it is lower than MIN_VELOCITY_BEFORE_TERMINATING.
			var durationInFrames = (Math.log(MIN_VELOCITY_BEFORE_TERMINATING) - Math.log(Math.abs(velocity))) / Math.log(FRICTION_PER_FRAME);
			var duration = (durationInFrames / FPS) * 1000;

			// Calculate the distance that the scroller will move during this duration.
			// http://en.wikipedia.org/wiki/Geometric_series#Formula where N is the number of frames,
			// because we terminate the series when the velocity drop below a minimum.
			// This formula simply means that we add up the decelarating velocity (or the distance) every frame until we reach MIN_VELOCITY_BEFORE_TERMINATING.
			var distanceX = velocity * ((1 - Math.pow(FRICTION_PER_FRAME, durationInFrames)) / (1 - FRICTION_PER_FRAME));
			var distanceY = 0 // * ((1 - Math.pow(FRICTION_PER_FRAME, durationInFrames)) / (1 - FRICTION_PER_FRAME));

			var offsetX = self.__scrollOffsetX;
			var offsetY = self.__scrollOffsetY;
			var newOffsetX = offsetX + distanceX;
			var newOffsetY = offsetY + distanceY;
			var distanceFromBounds;
console.log('deccel: x='+newOffsetX+' y='+newOffsetY+' width='+this.__contentWidth+' dx='+distanceX+' v='+velocity)

			var animation = self.__animation = {
				start: Date.now(),
				duration: duration,
				easing: easeOutExpo,
				fromX: self.__scrollOffsetX,
				fromY: self.__scrollOffsetY,
				fromZoom: self.__zoom,
				distanceX: (distanceX + 0.5) | 0,
				distanceY: (distanceY + 0.5) | 0,
				changeZoom: 0
			};

			var overscrolledX = (newOffsetX < 0 || newOffsetX > self.__maxScrollOffsetX);
			//var overscrolledY = (newOffsetY < 0 || newOffsetY > self.__maxScrollOffsetY);

			if(self.options.bouncing && overscrolledX) {
				if(newOffsetX < 0) {
					animation.distanceX = -offsetX;
				} else if (newOffsetX > self.__maxScrollOffsetX) {
					animation.distanceX = self.__maxScrollOffsetX - offsetX;
				}

				/* if(newOffsetY < 0) {
					animation.distanceY = -offsetY;
				} else if (newOffsetY > self.__maxScrollOffsetY) {
					animation.distanceY = self.__maxScrollOffsetY - offsetY;
				} */

				animation.easing = easeOutBack;
				animation.duration = animation.duration / EDGE_RESISTANCE;
			}
		}
	};

	// Copy over members to prototype.
	for(var key in members) {
		ScrollLogic.prototype[key] = members[key];
	}

	if(typeof exports !== 'undefined') {
		if(typeof module !== 'undefined' && module.exports) {
			exports = module.exports = ScrollLogic;
		}
	} else {
		window.ScrollLogic = ScrollLogic;
	}
})();
