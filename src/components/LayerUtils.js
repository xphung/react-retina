'use strict'

var DrawingUtils = require('./DrawingUtils')

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
