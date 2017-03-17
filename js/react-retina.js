var Retina =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 19);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var LayerUtils = __webpack_require__(8)

var View = React.createClass({

  displayName: 'View',
  layer: null,

  getDefaultProps: function() {
    return {tag: 'div'}
  },
  
  render: function() {
    let h = React.createElement
    return h(this.props.tag, {
      ref:this.handleRef,
      id:this.props.id,
      className:this.props.className,
      pointerEvents:this.props.pointerEvents,
      title:this.props.title
    }, this.props.children)
  },

  handleRef: function(ref) {
//console.log(ref)
    this.layer = LayerUtils.applyProps(this.layer, ref, this.props)
//console.log("handleRef: layer="+this.layer+" props/draw="+this.layer.layerProps['draw'])
  },

  componentDidMount: function(prevProps, prevState) {
    LayerUtils.update(this.layer, this.props)
  },

  componentDidUpdate: function(prevProps, prevState) {
    LayerUtils.update(this.layer, this.props)
  },
})

module.exports = View


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var View = __webpack_require__(1)
var ScrollLogic = __webpack_require__(12)

var Gallery = React.createClass({

  tabs:         [0, 0],  // itemCount needs tabs.length >= 2 to avoid modulus against zero
  sizes:        null,
  scrollHeight: null,
  selection:    0,
  scroller:     null,
  mscroller:    null,

  propTypes: {
    style: React.PropTypes.object.isRequired,
    itemGetter: React.PropTypes.func.isRequired,
    onChange: React.PropTypes.func.isRequired,
    sizes: React.PropTypes.array.isRequired,
    page: React.PropTypes.number,
    selecttion: React.PropTypes.number,
    scrollX: React.PropTypes.number,
    scrollY: React.PropTypes.number,
    scrollZoom: React.PropTypes.number,
    thumbZoom: React.PropTypes.number,
    mainX: React.PropTypes.number,
    mainY: React.PropTypes.number,
    mainZoom: React.PropTypes.number,
    snapping: React.PropTypes.bool,
  },

  render: function () {
    return (
      React.createElement(View, {
        style: this.props.style,
        isFocus: true,  // receives keyboard input
        onKeyDown: this.handleKeyDown,
        onClick: this.handleClick,
        onDoubleClick: this.handleDoubleClick,
        onWheel: this.handleWheel,
        handleTouchStart: this.handleTouchStart,
        handleTouchMove: this.handleTouchMove,
        handleTouchEnd: this.handleTouchEnd,
        handleTouchCancel: this.handleTouchEnd
      }, this.getVisibleItems())
    )
  },

  getVisibleItems: function () {
    let items = new Array(10)
    let client = this.props.style
    let r = this.props.scrollZoom
    let s = this.props.selection
    let bitmap = this.layoutScrolling(client, r, s)

    if (r < 1) {  // display main image
      let q = client.width / bitmap.width
      let h = Math.round(q * bitmap.height)
      let y = Math.round(r * this.props.style.height - this.props.mainY)
      items.push(this.props.itemGetter(s + 20 * this.props.sizes.length, 0, y, client.width, h, 1, 'main'))
    }

    if (r > 0) {  // display scroll images
      const OVERSCROLL = 1200
      let i = this.props.page
      let sx = this.props.scrollX
      let left = this.locateItem(i)
      let right = left + sx + (client.width/r) + OVERSCROLL

      for (let next, tab = left; tab <= right; tab = next) {
        next = this.locateItem(i+1)
        let bitmap = this.getItemSize(i)
        let cl = (i == this.props.selection) ? 'selected' : null
        let w = Math.round(next-tab)
        let h = Math.round(client.height)
        let x = Math.round(r*((this.props.left || 0) + tab-left-sx)) + (this.props.translateX || 0)
        let y = Math.round(r*((this.props.top || 0) + (i == this.props.selection) ? -this.props.scrollY : 0) + (this.props.translateY || 0))
//if (i == 0) console.log('renderpages: left='+left+' right='+right+' i='+i+' sx='+sx+' r='+r+' h='+h+' bitmap.height='+bitmap.height)
        items.push(this.props.itemGetter(i++, x, y, w, h, r, cl))
      }
    }

    return items
  },

  gotoItem: function(s, r) {
    // goto selection (resets mainX/Y to zero)
    if (s != this.props.selection || r != this.props.scrollZoom) {
      this.props.onChange({type:'SCROLL', mainX:0, mainY:0, selection:s})

      // ensure selection is within visible zone
      let sc = this.scroller
      let q = this.props.scrollZoom
      if (q > 0 && r > 0 && sc) {
        let w = this.props.style.width
        let i = this.props.page
        let m = this.locateItem(i)+this.props.scrollX + w/2/q  // current screen midpoint
        let j = this.indexItemAt(m - w/2/r)
        let k = this.indexItemAt(m + w/2/r)
        let y = r * this.props.scrollY
        if (s <= j) sc.scrollTo(r * this.locateItem(s), y, true, r)
        else if (s >= k) sc.scrollTo(r * this.locateItem(s+1) - w, y, true, r)
        else sc.scrollTo(r/q * sc.getTargetX() + w/2*r/q - w/2, y, true, r)
console.log('goto: s='+s+' right='+(r*this.locateItem(s+1) - w)+' r='+r+' w='+w+' left='+r*this.locateItem(s)+' j='+j+' k='+k)
        window.requestAnimationFrame(this.handleScrolling)
      } else if (q == 0 || r == 0) {
        this.props.onChange({type:'SCROLL', mainX:0, mainY:0, selection:s, scrollZoom:r})
      }
    }
  },

  gotoMain: function(deltaX, deltaY, constrain) {
    const R_THUMB = this.props.thumbZoom || 0.3
    let r = this.props.scrollZoom
    if (r >= 1) {
      this.zoomMain(deltaY < 0 ? r : R_THUMB)  // up arrow = negative deltaY
    } else if (r > 0) {
      this.zoomMain(deltaY < 0 ? (constrain ? r : 1) : 0)
    } else {
      let x = this.props.mainX
      let y = this.props.mainY
      if (y > 0 || deltaY > 0) {
        this.mscroller.scrollTo(x + deltaX, y + deltaY, false, 1)
        window.requestAnimationFrame(this.handleScrolling)
      } else this.zoomMain(R_THUMB)
    }
  },

  zoomMain: function(r) {
    if (this.props.scrollZoom != 0 && r != 0) {
      let sc = this.scroller
      let q = sc.getTargetZoom()
      let w = this.props.style.width
      let y = r * this.props.scrollY
      // zooms with origin set at midline of screen
      sc.scrollTo(r/q * sc.getTargetX() + w/2*r/q - w/2, y, true, r)
      window.requestAnimationFrame(this.handleScrolling)
    } else this.props.onChange({type:'SCROLL', scrollZoom:r})  // bypass ScrollLogic to zoom to & from zero
    return r
  },

  getItemSize: function(index) {
    let sizes = this.props.sizes
    let itemCount = sizes.length
    return sizes[(index % itemCount + itemCount) % itemCount]
  },

  locateItem: function(index) {
    let tabs = this.tabs
    let itemCount = tabs.length - 1
    let base = Math.floor(index / itemCount)
//if (!base) console.log('locateItem: base='+base+' i='+index+' tabs[i]='+tabs[index]+' count='+itemCount)
    return base * tabs[itemCount] + tabs[(index % itemCount + itemCount) % itemCount]
  },

  indexItemAt: function(x) {
    let tabs = this.tabs
    let itemCount = tabs.length - 1
    let wrap = tabs[itemCount]
    if (wrap == 0) return 0

    let base = Math.floor(x / wrap) * itemCount
    let search = (x % wrap + wrap) % wrap
//if (!(wrap > 0 && wrap < 2000000)) console.log('tabs: len='+tabs.length+' itemCount='+itemCount+' x='+x)

    //binary search
    let result = -1
    for (let min = 0, max = itemCount; min <= max; ) {
      let mid = (min + max) >> 1
      let tab = tabs[mid]
      if (search < tab) {
        max = mid - 1
      } else if (tab < search) {
        min = mid + 1
        result = mid
      } else return base + mid
    }
//console.log('binarysearch: min='+min+' max='+max+' tabs[min]='+tabs[min]+' tabs[max]='+tabs[max]+' search='+search)
    if (result >= 0) return base + result
    throw new RangeError('itemIndex: x='+x+' itemCount='+itemCount+' search='+search+' base='+base+' wrap='+wrap)
  },

  layoutScrolling: function(client, r, s) {
    let bitmap = this.getItemSize(s)
    let sizes = this.props.sizes
    let scrollw = client.width
    let scrollh = client.height  // tabs always calculated assuming height=gallery.height

    if (sizes !== this.sizes || s !== this.selection) {
      this.selection = s
      if (!bitmap.width || !bitmap.height) bitmap = client
      this.mscroller = this.createScrolling(this.mscroller, client, bitmap)

      //this.mscroller.scrollTo(this.props.mainX, this.props.mainY, false)
      this.mscroller.setDimensions(scrollw, scrollh, scrollw, bitmap.height/bitmap.width * scrollw)
    }

    if (sizes !== this.sizes || scrollh !== this.scrollHeight) {
      this.scrollHeight = scrollh
      this.sizes = sizes
      let tabs = this.tabs
      let max = sizes.length
      this.scroller = this.createScrolling(this.scroller, client)

      let left = this.scroller.getTargetX() / r
      let j = this.indexItemAt(left)
      let x = left - this.locateItem(j)
//console.log('adjust scrolling: tabs[50]='+tabs[50]+' x='+x+' j='+j+' r='+r+' scrollx='+this.props.scrollX+' base='+this.locateItem(j)+' tx='+this.scroller.getOffsetX()+' lx='+left)
      for (let i = 0; i < max; i++) {
        let size = sizes[i], itemw = size.width, itemh = size.height
        //let w = (itemw && itemh) ? Math.round(Math.max(scrollh * 0.8, itemw * scrollh / itemh)) : client.width
        let w = (itemw && itemh) ? Math.round(itemw * scrollh / itemh) : client.width
        tabs[i+1] = tabs[i] + w
      }

      if (r > 0 && this.scroller) {
        this.scroller.setDimensions(scrollw, scrollh, Math.max(scrollw, 2*tabs[max]), scrollh)
        this.scroller.scrollTo(r * (this.locateItem(j) + x), this.scroller.getTargetY(), true, this.scroller.getTargetZoom())
      }
    }

    return bitmap
  },

  createScrolling: function(scroller, client, content) {
    if (!scroller) scroller = new ScrollLogic({bouncing:false})
    return scroller
  },

  handleScrolling: function() {
    let sc = this.scroller
    let mc = this.mscroller

    let r = this.props.scrollZoom ? sc.getCurrentZoom() : 0
    if (r > 0) {
      let left = sc.getOffsetX() / r
      let i = this.indexItemAt(left)
      let x = left - this.locateItem(i)
      let y = sc.getOffsetY() / r
//console.log('handlescrolling: x='+Math.round(x)+' y='+Math.round(y)+' r='+r)
      if (this.props.scrollX != x || this.props.page != i || this.props.scrollY != y || this.props.scrollZoom != r)
        this.props.onChange({type:'SCROLL', page:i, scrollX:x, scrollY:y, scrollZoom:r})  
    }

    if (r < 1) {
      let x = mc.getOffsetX()
      let y = mc.getOffsetY()
      if (this.props.mainX != x || this.props.mainY != y)
        this.props.onChange({type:'SCROLL', mainX:x, mainY:y})  
    }

    if (!sc.isResting() || !mc.isResting()) window.requestAnimationFrame(this.handleScrolling)
  },

  // Events
  // ======

  handleKeyDown: function(e) {
//console.log('keycode: '+e.keyCode+' charcode='+e.charCode)
    switch(e.keyCode) {
      case 32: case 39: case 78:
        this.gotoItem(this.props.selection+1, this.props.scrollZoom)
        e.preventDefault()
        break
      case 37: case 66:
        this.gotoItem(this.props.selection-1, this.props.scrollZoom)
        e.preventDefault()
        break
      case 188:  // < key
        this.gotoItem(this.props.selection-50, this.props.scrollZoom)
        e.preventDefault()
        break
      case 190:  // > key
        this.gotoItem(this.props.selection+50, this.props.scrollZoom)
        e.preventDefault()
        break
      case 38:   // up arrow
        this.gotoMain(0, -100, e.altKey ? 0 : 1)
        e.preventDefault()
        break
      case 40:   // down arrow
        this.gotoMain(0, +100, e.altKey ? 0 : 1)
        e.preventDefault()
        break
      default:
    }
  },

  handleClick: function(e) {
    let p = e.pointerTarget.props
    if (p && p.id) this.gotoItem(p.id, this.props.scrollZoom)
  },

  handleDoubleClick: function(e) {
    let p = e.pointerTarget.props
    if (p) {
      const R_THUMB = this.props.thumbZoom || 0.3
      let r = this.props.scrollZoom
      if (r >= 1) {
        // fullscreen main image
        this.gotoItem(p.id, R_THUMB)
      } else if (r > 0) {
        // split screen
        if (p.className == 'main') this.gotoItem(p.id, 0)
        else this.gotoItem(p.id, 1)
      } else {
        // fullscreen scroll images
        this.gotoItem(p.id, R_THUMB)
      }
    }
  },

  handleWheel: function (e) {
    e.preventDefault()
    let scroller = this.scroller
    if (scroller) {
      let p = e.pointerTarget.props
      if (p && p.className == 'main' && this.mscroller) scroller = this.mscroller

      if (scroller.handleInteraction(-e.deltaX/2, -e.deltaY/2, e.timeStamp)) {
        window.requestAnimationFrame(this.handleScrolling)
      }

      if (this._wheelDebouncer) clearTimeout(this._wheelDebouncer)
      this._wheelDebouncer = setTimeout(this.debounceWheel.bind(this, e.timeStamp, scroller), 100)
    }
  },

  debounceWheel: function(timestamp, scroller) {
    scroller.endInteraction(timestamp)
  },

  handleTouchStart: function(e) {
    if (this.scroller) {
      let touch = e.touches[0]
      this.scroller.beginInteraction(touch.pageX, touch.pageY, e.timeStamp)
    }
  },

  handleTouchMove: function(e) {
    if (this.scroller) {
      e.preventDefault()
      let touch = e.touches[0]
      this.scroller.interact(touch.pageX, touch.pageY, e.timeStamp)
    }
  },

  handleTouchEnd: function(e) {
    if (this.scroller) {
      this.scroller.endInteraction(e.timeStamp)
    }
  },

})

module.exports = Gallery


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var View = __webpack_require__(1)
var EventEmitter = __webpack_require__(17).EventEmitter

var Image = React.createClass({

  propTypes: {
    src: React.PropTypes.string.isRequired,
    style: React.PropTypes.object,
    fadeIn: React.PropTypes.bool,
    fadeInDuration: React.PropTypes.number
  },

  getInitialState: function () {
    let img = ImageUtils.getImage(this.props.src, this.handleImageLoad)
    let loaded = img.naturalWidth > 0
    return {
      loaded: loaded,
      imageAlpha: loaded ? 1 : 0
    };
  },

  componentDidMount: function() {
    //let img = ImageUtils.getImage(this.props.src, this.handleImageLoad)
    //if (this.props.handleImageLoad) this.props.handleImageLoad(this, e.target)
  },

  componentWillUnmount: function () {
    if (this._pendingAnimationFrame) {
      cancelAnimationFrame(this._pendingAnimationFrame);
    }
  },

  render: function() {
    let h = React.createElement
    return h(View, {
      tag:'div', draw:this.handleDraw,
      style:this.props.style,
      pointerEvents:this.props.pointerEvents,
      title:this.props.title
    }, this.props.children)
  },

  handleDraw: function(ctx, layerProps) {
    let img = ImageUtils.getImage(this.props.src, this.handleImageLoad)
    let style = this.props.style
    let alpha = this.state.imageAlpha
    let r = style.scale
    let x = (style.translateX || 0) + r * (style.left || 0)
    let y = (style.translateY || 0) + r * (style.top || 0)
    let w = Math.round(r * style.width)
    let h = Math.round(r * style.height)
    if (style.backgroundColor && alpha < 0.95) {
      ctx.fillStyle = style.backgroundColor
      ctx.fillRect(x, y, w, h)
    }
    if (alpha < 0.95) ctx.globalAlpha = alpha
    ctx.drawImage(img, x, y, w, h)
    ctx.globalAlpha = 1
  },

  handleImageLoad: function(e) {
    //TODO: also handle image load error callbacks
    e.preventDefault()
    e.stopPropagation()
    let imageAlpha = 1;
    if (this.props.fadeIn) {
      imageAlpha = 0;
      this._animationStartTime = Date.now();
      this._pendingAnimationFrame = requestAnimationFrame(this.stepThroughAnimation);
    }
    this.setState({ loaded: true, imageAlpha: imageAlpha });
    if (this.props.handleImageLoad) this.props.handleImageLoad(this, e.target)
  },

  stepThroughAnimation: function () {
    const FADE_DURATION = 100
    let fadeInDuration = this.props.fadeInDuration || FADE_DURATION;
    let alpha = this.easeInCubic((Date.now() - this._animationStartTime) / fadeInDuration);
    alpha = Math.max(0, Math.min(alpha, 1))
//console.log('load image: src='+this.props.src+' alpha='+alpha+' state='+JSON.stringify(this.state))
    this.setState({ imageAlpha: alpha });
    if (alpha < 1) {
      this._pendingAnimationFrame = requestAnimationFrame(this.stepThroughAnimation);
    }
  },

  easeInCubic: function (t) {
    return t * t * t;
  },

});

var ImageUtils = {
  POOLSIZE: 50,
  counter: 0,
  imageMap: {},
  imageStore: new Array(50),

  // TODO: fix known bug when multiple Image components using same img (only one gets callback & others do not get callback)
  getImage: function(src, handler) {
    let loader = ImageUtils.imageMap[src]
//console.log('get image: handler='+handler+' loader='+loader)
    if (!loader) {
      loader = ImageUtils.imageStore[ImageUtils.counter]
      if (loader) {
        loader.destructor()
        delete ImageUtils.imageMap[loader.getImage().src]
      } else {
        loader = new ImageController()
        ImageUtils.imageStore[ImageUtils.counter] = loader
      }
      loader.once('load', handler)
      loader.load(src)
      ImageUtils.imageMap[src] = loader
      if (++ImageUtils.counter == 50) ImageUtils.counter = 0
    } else if (!loader.isLoaded()) {
      loader.removeListener('load', handler)
      loader.once('load', handler)
    }
    return loader.getImage()
  },

}

function ImageController() {
  this._img = document.createElement('img');
  this._img.onload = this.emit.bind(this, 'load');
  this._img.onerror = this.emit.bind(this, 'load');
  this._img.crossOrigin = true;

  // Default is just 10.
  //this.setMaxListeners(100);
}

Object.assign(ImageController.prototype, EventEmitter.prototype, {

  destructor: function () {
    this.removeAllListeners()
  },

  load: function (src) {
    this._img.src = src
  },

  isLoaded: function () {
    return this._img.naturalHeight > 0;
  },

  getImage: function () {
    return this._img;
  }
})

module.exports = Image;


/*


ctx.fillStyle = '#EEE'
ctx.fillRect(x, y, style.width, style.height)
console.log("drawimg: x="+x+" y="+y+" height="+style.height+' img='+img+' ctx='+ctx+' alpha='+alpha+' bg='+style.backgroundColor)
ctx.fillStyle = '#48C'
ctx.fillRect(x,y,200+200*alpha,200+200*alpha)

*/

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var View = __webpack_require__(1)

var Rect = React.createClass({

  render: function() {
    let h = React.createElement
    return h(View, {
      tag:'g', draw:this.handleDraw,
      style:this.props.style,
      pointerEvents:this.props.pointerEvents,
      title:'x='+this.props.style.translateX+',width='+this.props.style.width
    }, this.props.children)
  },

  getDefaultProps: function() {
    return {style: {left:0, top:0}}
  },

  handleDraw: function(ctx, layerProps) {
//console.log("handleDraw: layer="+this.layer+" this="+this)
    let style = this.props.style
    let r = style.scale
    let x = (style.translateX || 0) + r * (style.left || 0)
    let y = (style.translateY || 0) + r * (style.top || 0)
    let w = Math.round(r * style.width)
    let h = Math.round(r * style.height)
    if (style.backgroundColor) {
      ctx.fillStyle = style.backgroundColor
      ctx.fillRect(x, y, w, h)
    }
    if (style.borderColor) {
      ctx.lineWidth = style.borderWidth || 1;
      ctx.strokeStyle = style.borderColor;
      ctx.strokeRect(x, y, w, h);
    }
  },
})

module.exports = Rect


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var LayerUtils = __webpack_require__(8)

var Surface = React.createClass({

  displayName: 'Surface',
  layer: null,
  ctx: null,

  getDefaultProps: function() {
    return {
      scale: window.devicePixelRatio || 1
    }
  },

  render: function() {
    let children = this.props.children
    let h = React.createElement
    return h('canvas', {
      id:'canvas',
      ref:this.handleRef,
      tabIndex:1,
      width:this.props.width,
      height:this.props.height,
      style:this.props.style,
      onKeyDown: this.handleKeyDown,
      onKeyUp: this.handleKeyUp,
      onKeyPress: this.handleKeyPress,
      onClick: this.handleClick,
      onDoubleClick: this.handleDoubleClick,
      onWheel: this.handleWheel
    }, children)
  },

  componentDidMount: function() {
    if (this.layer) this.batchedTick()
    this.context2d().scale(this.props.scale, this.props.scale)
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.layer) this.batchedTick()
    //this.context2d().scale(this.props.scale, this.props.scale)
  },

  handleKeyDown: function(e) {
    let target = LayerUtils.focusTest(e, this.layer, this)
//console.log(target)
    if (target && target.onKeyDown) target.onKeyDown(e)
  },

  handleKeyUp: function(e) {
    let target = LayerUtils.focusTest(e, this.layer, this)
    if (target && target.onKeyUp) target.onKeyUp(e)
  },

  handleKeyPress: function(e) {
    let target = LayerUtils.focusTest(e, this.layer, this)
    if (target && target.onKeyPress) target.onKeyPress(e)
  },

  handleClick: function(e) {
    let target = LayerUtils.hitTest(e, this.layer, 'onClick')
  },

  handleDoubleClick: function(e) {
    let target = LayerUtils.hitTest(e, this.layer, 'onDoubleClick')
  },

  handleWheel: function(e) {
    let target = LayerUtils.hitTest(e, this.layer, 'onWheel')
  },

  handleRef: function(ref) {
    if (this.layer !== ref) {
console.log('canvas: ref='+ref+' focus='+(document.activeElement))
      ref.focus()
console.log('canvas: focus1='+(document.activeElement))
//document.getElementById('surface').focus();
//console.log('canvas: focus2='+(document.activeElement)+' c1='+document.getElementById('surface'))
      this.layer = ref
      this.layer.repaint = this.batchedTick
    }
//console.log(this.layer)
  },

  context2d: function() {
    return this.layer.getContext('2d')
  },

  batchedTick: function() {
    if (this._frameReady === false) {
      this._pendingTick = true
      return
    }
    this.doTick()
  },

  doTick: function () {
    // Block updates until next animation frame.
    this._frameReady = false
    LayerUtils.drawLayer(this.layer, this.context2d())
    requestAnimationFrame(this.afterTick)
  },

  afterTick: function () {
    // Execute pending draw that may have been scheduled during previous frame
    this._frameReady = true
    if (this._pendingTick) {
      this._pendingTick = false
      this.batchedTick()
    }
  },

})

module.exports = Surface

/*

let CanvasProxy = React.createClass({
  render: function() {
console.log("proxyctx: "+this.props.context.repainter)
    return this.props.children && this.props.children[0] || null
  },

  getChildContext: function() {
    return this.props.context
  },

  childContextTypes: {
    repainter: React.PropTypes.object
  }
})

let Canvas = React.createClass({
  componentDidMount() {
return
    //this.draw(this, 2)
    let h = React.createElement
      ReactDOM.render(h(CanvasProxy, {
        context:{repainter:this.state.repainter}, 
        width:this.props.width,
        height:this.props.height,
        style:this.props.style
      }, this.props.children), document.createElement("section"))
  },
})

    //img = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Sorted_binary_tree_inorder.svg/336px-Sorted_binary_tree_inorder.svg.png'

*/


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var View = __webpack_require__(1)

var Text = React.createClass({

  render: function() {
    let h = React.createElement
    return h(View, {
      tag:'span', draw:this.handleDraw,
      id:this.props.id, className:this.props.className,
      style:this.props.style,
      pointerEvents:this.props.pointerEvents,
      title:this.props.textContent
    }, this.props.children)
  },

  getDefaultProps: function() {
    return {style: {left:0, top:0}}
  },

  handleDraw: function(ctx, layerProps) {
    let style = this.props.style
    let r = style.scale
    let x = (style.translateX || 0) + r * (style.left || 0)
    let y = (style.translateY || 0) + r * (style.top || 0)
    let w = Math.round(r * style.width)
    let h = (style.lineHeight) || (r * style.height).toFixed(2)
    if (style.backgroundColor) {
      ctx.globalAlpha = style.textOpacity || 1
      ctx.fillStyle = style.backgroundColor
      ctx.fillRect(x, y, w, h)
      ctx.globalAlpha = 1
    }
//console.log("draw: text="+this.props.textContent+" x="+x+" y="+y+" h="+h)
    ctx.fillStyle = style.color || '#000'
    ctx.font = style.font || '12px sans-serif'
    ctx.textAlign = style.textAlign || 'left'
    ctx.textBaseline = style.textBaseline || 'alphabetic'
    ctx.fillText(this.props.textContent, x, y+h)
  },
})

module.exports = Text


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__slides__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scroll__ = __webpack_require__(15);



function reducers(state, action) {
  if (typeof state === 'undefined') {
    return {slides:__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__slides__["a" /* default */])(), scroll:__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__scroll__["a" /* default */])()}
  }
//console.log('reduce: action='+JSON.stringify(action))
  let s = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__slides__["a" /* default */])(state.slides, action)
  let x = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__scroll__["a" /* default */])(state.scroll, action)
  if (s != state.slides || x != state.scroll) return {slides:s, scroll:x}
  else return state
}

console.log('reducers',reducers)
/* harmony default export */ __webpack_exports__["default"] = reducers;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var DrawingUtils = __webpack_require__(11)

var LayerUtils = {

  eventTypes: [
    'draw', 'isFocus',
    'onKeyDown', 'onKeyPress', 'onKeyUp',
    'onWheel', 'onClick', 'onDoubleClick',
    'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'
  ],

  applyProps: function(current, ref, props) {
    if (current) {
      delete current.props
      LayerUtils.removeEventListeners(current)
    }
    if (ref) {
      ref.props = props
      LayerUtils.addEventListeners(ref, props)
    }
    return ref
  },

  addEventListeners: function(layer, props) {
    for (let i = 0, l = LayerUtils.eventTypes.length; i < l; i++) {
      let etype = LayerUtils.eventTypes[i]
      let handler = props[etype]
      if (handler) layer[etype] = handler
//console.log("listener: "+etype+"->"+(typeof handler))
    }
  },

  removeEventListeners: function(layer) {
    for (let i = 0, l = LayerUtils.eventTypes.length; i < l; i++) {
      let etype = LayerUtils.eventTypes[i]
      delete layer[etype]
    }
  },

  update: function(layer, props) {
    layer.props = props
    for (let parent = layer; parent; parent = parent.parentNode) {
      let handler = parent.repaint
      if (handler) handler()
    }
  },

  updateBackingStore: function(layer, props) {
    let p = layer.props
    if (p && p.id && p.useBackingStore) {
if (p.id) console.log('LayerUtil.updateBackingStore id='+p.id+' '+p.title)
      DrawingUtils.invalidateBackingStore(p.id);
    }
    LayerUtils.update(layer, props);
  },

  drawLayer: function(layer, ctx) {
    // cache layer into BackingStore if appropriate
    let p = layer.props
    if (p && p.useBackingStore !== undefined) {  // unique id is required for cached layers
      let bounds = p.style
      let r = bounds.scale
      let x = (bounds.translateX || 0) + r * (bounds.left || 0)
      let y = (bounds.translateY || 0) + r * (bounds.top || 0)
      let w = bounds.width
      let h = bounds.height

      let canvas = DrawingUtils.getBackingStore(p.useBackingStore)
      if (!canvas) {
        // initialise BackingStore always has full device pixel resolution regardless of scale transform style
//console.log('drawLayer: x='+x/r+' y='+y/r+' w='+w+' h='+h+' r='+r)
        canvas = DrawingUtils.createBackingStore(p.useBackingStore, x, y, w, h, r)
        LayerUtils.drawLayerTree(layer, canvas.getContext('2d'))
      }
      // draw BackingStore at scaled width & height
      ctx.drawImage(canvas, x, y, Math.round(r*w), Math.round(r*h))
    } else LayerUtils.drawLayerTree(layer, ctx)
  },

  drawLayerTree: function(layer, ctx) {
    // draw parent layer first
    if (layer.draw) layer.draw(ctx, layer.props)

    // draw child layers on top, with last child being highest z-index
    for (let child = layer.firstChild; child; child = child.nextSibling) {
      if (child.nodeType != 1) continue  // skip non-Element nodes
      LayerUtils.drawLayer(child, ctx)
    }
  },

  focusTest: function(e, layer, canvas) {
    // Early bail for non-visible layers
    if (typeof layer.alpha === 'number' && layer.alpha < 0.01) {
      return null;
    }

    if (layer.isFocus) return layer

    // child-first search of elements in reverse DOM order
    for (let child = layer.lastChild; child; child = child.previousSibling) {
      if (child.nodeType != 1) continue  // skip non-Element nodes
      layer = LayerUtils.focusTest(e, child, canvas)
      if (layer) return layer
    }

    return null
  },

  hitTest: function(e, root, etype) {
    let touch = e.touches ? e.touches[0] : e;
    let touchX = touch.pageX;
    let touchY = touch.pageY;
    if (root) {
      let box = root.getBoundingClientRect();
      touchX -= box.left;
      touchY -= box.top;
    }

    touchY = touchY - window.pageYOffset;
    touchX = touchX - window.pageXOffset;

    let child = LayerUtils.getLayerAtPoint(root, e.type, touchX, touchY)
    e.pointerTarget = child
    for (let layer = child; layer; layer = layer.parentNode) {
      if (e.cancelBubble) break
      let handler = layer[etype]
      if (handler) handler(e)
    }
    return child
  },

  getLayerAtPoint: function(parent, type, pointX, pointY) {
    let layer = null

    // Early bail for non-visible layers
    if (typeof parent.alpha === 'number' && parent.alpha < 0.01) {
      return null;
    }

    // Child-first search of elements in reverse DOM order
    for (let child = parent.lastChild; child; child = child.previousSibling) {
      if (child.nodeType != 1) continue  // skip non-Element nodes
      layer = LayerUtils.getLayerAtPoint(child, type, pointX, pointY);
      if (layer) break;
    }

    // No child layer at the given point. Try the parent layer.
    // TODO: Check for hit outsets
    if (!layer && parent.props) {
      let bounds = parent.props.style
      if (bounds && parent.props.pointerEvents !== 'none') {
        let r = bounds.scale
        let x = (bounds.translateX || 0) + r * (bounds.left || 0)
        let y = (bounds.translateY || 0) + r * (bounds.top || 0)
        let w = Math.round(r * bounds.width)
        let h = Math.round(r * bounds.height)
        if (LayerUtils.intersects(x, y, w, h, pointX, pointY)) layer = parent
      }
    }
    return layer;
  },

  intersects: function(left, top, width, height, x, y) {
    return x >= left && x < left+width && y >= top && y < top+height
  },
}

module.exports = LayerUtils


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var React = __webpack_require__(0)
var Surface = __webpack_require__(5)
var Gallery = __webpack_require__(2)
var SlidesPicker = __webpack_require__(14)
var Slide = __webpack_require__(13)
var Redux = __webpack_require__(18)
var reducers = __webpack_require__(7).default

var SlidesContainer = React.createClass({

  store: null,

  style: {
    left:0, top:0,
    width:1280, height:720,
    maxWidth:1280, maxHeight:720,
    scale:1
  },

  getInitialState: function() {
    this.style.scale = (window.devicePixelRatio || 1) / (window.webkitBackingStorePixelRatio || 1)
    this.style.maxWidth = screen.width
    this.style.maxHeight = screen.height
console.log('init: p='+this.style.maxWidth)
    //this.store = Redux.createStore(reducers) //, {slides:[]})
    return this.props.store.getState()
  },

  componentDidMount: function() {
    this.props.store.subscribe(this.handleChange)
  },

  componentWillUnmount: function() {
//    store.unsubscribe(this.render)
  },

  handleChange: function() {
    const state = this.props.store.getState()
    if (state != this.state) this.setState(state);
  },

  render: function() {
    const h = React.createElement
    const state = this.state
    let style = this.style
    style.width = window.innerWidth
    style.height = window.innerHeight
if (!this.state.slides) console.log('controller render: ',JSON.stringify(this.state))
    if (state.slides.length > 0) {
      return h(SlidesPicker, {
          items:state.slides,
          style:{display:'block', position:'absolute', left:'0', right:'0', top:'0', bottom:'0', margin:'10px', border:'10px dotted #ccc'},
          addItem:this.addSlide,
        },
        h(Surface, {
            style:{position:'fixed', left:0, top:0, width:style.maxWidth, height:style.maxHeight, cursor:'pointer'},
            scale:style.scale,
            width:style.maxWidth * style.scale, height:style.maxHeight * style.scale
          },
          h(Gallery, {
            style:      {left:0, top:0, width:style.width, height:style.maxHeight},
            itemGetter: this.renderPage,
            sizes:      state.slides,
            page:       state.scroll.page,
            selection:  state.scroll.selection,
            scrollX:    state.scroll.scrollX,
            scrollY:    state.scroll.scrollY,
            scrollZoom: state.scroll.scrollZoom,
            mainX:      state.scroll.mainX,
            mainY:      state.scroll.mainY,
            mainZoom:   state.scroll.mainZoom,
            thumbZoom:  0.3,
            onChange:   this.props.store.dispatch,
            snapping:   false
          })
        )
      )
    } else {
      return h(SlidesPicker, {
          items:state.slides,
          style:{display:'block', position:'absolute', left:'0', right:'0', top:'0', bottom:'0', margin:'10px', border:'10px dotted #ccc'},
          addItem:this.addSlide,
        }
      )
    }
  },

  renderPage: function(index, tx, ty, w, h, scale, cl) {
    const state = this.state //store.getState()
    let i = index % state.slides.length
    if (i < 0) i += state.slides.length
    let slide = state.slides[i]
    let s = slide.src
    let t = slide.title

    let style = {
      left:0, top:0, width:w, height:h,
      translateX:tx, translateY:ty, scale:scale,
      color:'#000', backgroundColor:(cl ? '#FCC' : '#CCC'), textOpacity:0.7,
      fontSize:12, textBaseline:'bottom', lineHeight:14
    }
//console.log('renderpage: i='+i+' tx='+tx+' ty='+ty+' w='+w+' h='+h+' clcheck='+(cl == 'main'))
    return React.createElement(Slide, {
      style:style,
      key:index, id:i, className:cl,
      title:t, src:s, data:slide,
      useBackingStore: (cl != 'main' && state.slides[i].width) ? i : undefined,
      handleUpdate:this.updateSlide
    })
  },

  addSlide: function(data) {
    this.props.store.dispatch({type:'SLIDES_ADDED', item:data})
  },

  updateSlide: function(data, index) {
    this.props.store.dispatch({type:'SLIDE_UPDATED', item:data, index:index})
  }
})

module.exports = SlidesContainer;


/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var DrawingUtils = {

  // Global backing store <canvas> cache
  POOLSIZE: 30,
  backingStores: [],

  getBackingStore: function(id) {
    for (var i=0, len = DrawingUtils.backingStores.length; i < len; i++) {
      if (DrawingUtils.backingStores[i].id === id) {
        return DrawingUtils.backingStores[i].canvas.getCanvas()
      }
    }
    return null
  },

  createBackingStore: function(id, x, y, width, height, scale) {
    if (DrawingUtils.backingStores.length >= DrawingUtils.POOLSIZE) {
      // Re-use the oldest backing store once we reach the pooling limit.
      let store = DrawingUtils.backingStores.shift()
      store.id = id
      CanvasController.call(store.canvas, x, y, width, height, scale)
      DrawingUtils.backingStores.push(store)
      return store.canvas.getCanvas()
    } else {
      // Create a new backing store, we haven't yet reached the pooling limit
      let canvas = new CanvasController(x, y, width, height, scale)
      DrawingUtils.backingStores.push({id:id, canvas:canvas})
      return canvas.getCanvas()
    }
  },

  invalidateBackingStore: function(id) {
    for (var i=0, len = DrawingUtils.backingStores.length; i < len; i++) {
      if (DrawingUtils.backingStores[i].id === id) {
        DrawingUtils.backingStores.splice(i, 1)
        break
      }
    }
  },

  invalidateAllBackingStores: function() {
    DrawingUtils.backingStores = []
  }
}

function CanvasController(x, y, width, height, scale) {
  // Re-purposing an existing canvas element
  if (!this.canvas) {
    this.canvas = document.createElement('canvas')
  }

  // canvas retains full resolution
  let p = (window.devicePixelRatio || 1)
  this.canvas.width = width * p
  this.canvas.height = height * p

  let ctx = this.getContext()
  ctx.scale(p / scale, p / scale)
  ctx.translate(-x, -y)
}

Object.assign(CanvasController.prototype, {

  getCanvas: function () {
    return this.canvas
  },

  getContext: function () {
    return this.canvas.getContext('2d')
  }
})

module.exports = DrawingUtils



/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

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

	if(true) {
		if(typeof module !== 'undefined' && module.exports) {
			exports = module.exports = ScrollLogic;
		}
	} else {
		window.ScrollLogic = ScrollLogic;
	}
})();


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(0)
var Image = __webpack_require__(3)
var Rect = __webpack_require__(4)
var Text = __webpack_require__(6)
var View = __webpack_require__(1)

var Slide = React.createClass({

  propTypes: {
    style: React.PropTypes.object.isRequired,
    src: React.PropTypes.string,
    id: React.PropTypes.number.isRequired,
    className: React.PropTypes.string,
    data: React.PropTypes.object,
    useBackingStore: React.PropTypes.number,
    handleUpdate: React.PropTypes.func
  },

  render: function() {
    let h = React.createElement
    let style = this.props.style
    let src = this.props.src
    let title = 'Item '+this.props.id+': '+this.props.title

    if (!src) return h(View, {style:style, title:title},
      h(Rect, {style:style, textContent:title}),
      h(Text, {style:style, textContent:title})
    )

    if (this.props.data) title += ' ('+this.props.data.width+' x '+this.props.data.height+')'
//console.log("slide: i="+this.props.id+" src="+src+" tx="+style.translateX+" w="+style.width)
    //return h(Image, {style:style, src:src, fadeIn:false, handleImageLoad:this.handleImageLoad})

    return h(View, {style:style, id:this.props.id, className:this.props.className, title:title},
      h(Image, {style:style, pointerEvents:'none', src:src, fadeIn:false,
		handleImageLoad:this.handleImageLoad, useBackingStore:this.props.useBackingStore}),
      h(Text, {style:style, pointerEvents:'none', textContent:title})
    )
  },

  handleImageLoad: function(image, raw) {
    let style = this.props.style
    this.props.handleUpdate({width:raw.naturalWidth, height:raw.naturalHeight}, this.props.id)
  },
});

module.exports = Slide;


/*
    return h(Image, {style:style, src:src, fadeIn:true, handleImageLoad:this.handleImageLoad})

      

*/

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

var React = __webpack_require__(0);

var SlidesPicker = React.createClass({

  render: function() {
    let h = React.createElement
    let props = this.props
    let items = props.items

    let itemHtml = items.map(function (listItem, i) {
      return h('li',{key:i},JSON.stringify(listItem))
    })

    return h('div', {id:'picker', style: this.props.style, onChange:this.pickSlides, onDrop:this.pickSlides, onDragOver:this.hoverSlides, onDragLeave:this.hoverSlides},
      //h('span', {style:{width:'100%', height:'100%'}, dangerouslySetInnerHTML:{__html:'<input type="file" multiple directory allowdirs webkitdirectory"/>'}}), 
      h('input', {
        type:'file',
        onChange:this.pickSlides,
        multiple:'multiple',
        ref:this.handleRef //directory:'directory'
      }),
      //h('ul', {id:'picker_list'}, 'slides:',itemHtml ? itemHtml : ''),
      this.props.children
    )
  },

  handleRef: function(node) {
    node.directory = true;
    node.webkitdirectory = true;
    node.allowdirs = true;
  },

  pickSlides: function(event) {
console.log("file: event=",event)
    event.stopPropagation()
    event.preventDefault()
    let files
    if (event.type === "drop") {
      files = event.dataTransfer.files
    } else if (event.type === "change") {
      files = event.target.files
    }
    if (files) this.listSlides(files)
  },

  hoverSlides: function(event) {
    event.stopPropagation();
    event.preventDefault();
  },

  listSlides: function(files) {
    let count = 0
console.log("pick: files="+files.length)
    let buffer = []
    let parents = [""]
    for (let i = 0; i < files.length; i++) {
      let parent = parents[parents.length-1]
      let file = files.item(i)
      let type = file.type
      let name = file.name
      let path = file.webkitRelativePath || (parent + name)
//if (i < 12) console.log(i+' list file='+name+' path='+path)

      if (type == '') {
        // special code for Rapp file open to enable preservation of directory structure
        if (name.endsWith('<dir_begin>')) {
          parents.push(path.slice(0, -11)+'/')
        } else if (name.endsWith('<dir_end>')) {
          parents.pop()
        }
      } else if (type.startsWith('image')) {
        let url = window.URL.createObjectURL(file)
        slide = {title:path, src:url, type:type, lastModified:file.lastModified, size:file.size}
        buffer.push(slide)
        if (buffer.length >= 30) {
          this.props.addItem(buffer)
          buffer.length = 0
        }
      }
//console.log(i+" list: url="+url)
    }
    if (buffer.length > 0) this.props.addItem(buffer)
  }

})

module.exports = SlidesPicker;


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

function scroll(state, action) {
  if (typeof state == 'undefined') {
    return {page:0, selection:0, scrollX:0, scrollY:0, scrollZoom:1, mainX:0, mainY:0, mainZoom:0}
  }

  switch (action.type) {
    // TODO: adjust scroll position if affected by slide updates
    case 'SCROLL':
//if (action.page && state.page != action.page) console.log('reduce: action='+JSON.stringify(action))
      let s = Object.assign({}, state, action)
//if (s.page == 0) console.log('reduce: page='+s.page+' action='+JSON.stringify(action))
      return s //Object.assign({}, state, action)
    default:
      return state
  }
}

/* harmony default export */ __webpack_exports__["a"] = scroll;



/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
function slides(state, action) {
  if (typeof state == 'undefined') {
//    return [{title:'blank', width:600, height:400}]
      return []
  }

//console.log('slide reducer: '+JSON.stringify(action))
  switch (action.type) {
    case 'SLIDES_LOADED':
console.log('slide reducer: '+action)
      return action.item
    case 'SLIDES_ADDED':
//console.log('slide reducer: '+action)
      return state.concat(action.item)
    case 'SLIDE_UPDATED':
      let max = state.length
      let i = action.index % max
      if (i < 0) i += max
      let slide = Object.assign({}, state[i], action.item)
      return [...state.slice(0, i), slide, ...state.slice(i+1)]
    default:
      return state
  }
}

/* harmony default export */ __webpack_exports__["a"] = slides;


/***/ }),
/* 17 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports = Redux;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

/**
 *  React-RETINA component library, plus main() function for application code
 **/

var React = __webpack_require__(0)
var ReactDOM = __webpack_require__(10)

function main() {
  let SlidesContainer = __webpack_require__(9)
  let reducers = __webpack_require__(7).default
  let store = Redux.createStore(reducers)
  let h = React.createElement
  ReactDOM.render(h(SlidesContainer, {store:store}), document.getElementById('main'))
}

module.exports = {
  main,
  View: __webpack_require__(1),
  Text: __webpack_require__(6),
  Image: __webpack_require__(3),
  Rect: __webpack_require__(4),
  Surface: __webpack_require__(5),
  Gallery: __webpack_require__(2)
}


/***/ })
/******/ ]);