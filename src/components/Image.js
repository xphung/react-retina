'use strict'

var React = require('react')
var View = require('./View')
var EventEmitter = require('events').EventEmitter

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