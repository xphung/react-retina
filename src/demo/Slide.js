'use strict'

var React = require('react')
var Image = require('../components/Image')
var Rect = require('../components/Rect')
var Text = require('../components/Text')
var View = require('../components/View')

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