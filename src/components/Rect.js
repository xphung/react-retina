'use strict'

var React = require('react')
var View = require('./View')

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
