'use strict'

var React = require('react')
var LayerUtils = require('./LayerUtils')

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
