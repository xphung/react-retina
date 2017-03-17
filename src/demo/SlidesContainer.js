var React = require('react')
var Surface = require('../components/Surface')
var Gallery = require('../components/Gallery')
var SlidesPicker = require('./SlidesPicker')
var Slide = require('./Slide')
var Redux = require('redux')
var reducers = require('../reducers/index').default

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
