'use strict'

var React = require('react')
var View = require('./View')
var ScrollLogic = require('./ScrollLogic')

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
