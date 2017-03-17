function slides(state, action) {
  if (typeof state == 'undefined') {
//    return [{title:'blank', width:600, height:400}]
      return []
  }

//console.log('slide reducer: '+JSON.stringify(action))
  switch (action.type) {
    case 'SLIDES_LOADED':
console.log('slide reducer: '+action)
      return action.item
    case 'SLIDES_ADDED':
//console.log('slide reducer: '+action)
      return state.concat(action.item)
    case 'SLIDE_UPDATED':
      let max = state.length
      let i = action.index % max
      if (i < 0) i += max
      let slide = Object.assign({}, state[i], action.item)
      return [...state.slice(0, i), slide, ...state.slice(i+1)]
    default:
      return state
  }
}

export default slides;
