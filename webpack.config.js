var webpack = require('webpack');
var pkg     = require('./package.json');

module.exports = {
  context: __dirname+'/src',
  entry: {
    app: './index.js',
  },
  output: {
    path: __dirname+'/js',
    filename: 'react-retina.js',
    libraryTarget: 'var',
    library: "Retina"
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
    "redux": "Redux"
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify('development')}
    })
  ]
};
