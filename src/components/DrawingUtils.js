'use strict'

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

