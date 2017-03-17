import slides from './slides';
import scroll from './scroll';

function reducers(state, action) {
  if (typeof state === 'undefined') {
    return {slides:slides(), scroll:scroll()}
  }
//console.log('reduce: action='+JSON.stringify(action))
  let s = slides(state.slides, action)
  let x = scroll(state.scroll, action)
  if (s != state.slides || x != state.scroll) return {slides:s, scroll:x}
  else return state
}

console.log('reducers',reducers)
export default reducers;
