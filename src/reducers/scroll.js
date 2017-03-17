
function scroll(state, action) {
  if (typeof state == 'undefined') {
    return {page:0, selection:0, scrollX:0, scrollY:0, scrollZoom:1, mainX:0, mainY:0, mainZoom:0}
  }

  switch (action.type) {
    // TODO: adjust scroll position if affected by slide updates
    case 'SCROLL':
//if (action.page && state.page != action.page) console.log('reduce: action='+JSON.stringify(action))
      let s = Object.assign({}, state, action)
//if (s.page == 0) console.log('reduce: page='+s.page+' action='+JSON.stringify(action))
      return s //Object.assign({}, state, action)
    default:
      return state
  }
}

export default scroll;

