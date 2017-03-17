'use strict'

var React = require('react')
var LayerUtils = require('./LayerUtils')

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
