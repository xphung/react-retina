/**
 *  React-RETINA component library, plus main() function for application code
 **/

var React = require('react')
var ReactDOM = require('react-dom')

function main() {
  let SlidesContainer = require('./demo/SlidesContainer')
  let reducers = require('./reducers/index').default
  let store = Redux.createStore(reducers)
  let h = React.createElement
  ReactDOM.render(h(SlidesContainer, {store:store}), document.getElementById('main'))
}

module.exports = {
  main,
  View: require('./components/View'),
  Text: require('./components/Text'),
  Image: require('./components/Image'),
  Rect: require('./components/Rect'),
  Surface: require('./components/Surface'),
  Gallery: require('./components/Gallery')
}
