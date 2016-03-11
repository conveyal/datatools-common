var path = require('path');

module.exports = {

  entry: path.join(__dirname, '/src/index.js'),
  output: {
    path: path.join(__dirname, '/build/'),
    filename: '/bundle.js',
    publicPath: '/'
  },
  module: {
    loaders: [{
      test: /\.js?$/,
      loader: 'babel',
      exclude: /node_modules/
    }]
  }
};
