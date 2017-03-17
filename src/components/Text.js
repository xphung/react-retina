'use strict'

var React = require('react')
var View = require('./View')

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
