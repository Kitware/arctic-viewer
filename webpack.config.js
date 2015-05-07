var webpack = require('webpack');

module.exports = {
  plugins: [],
  entry: './lib/in-situ-data-viewer.js',
  output: {
    path: './dist',
    filename: 'viewer.js',
  },
  module: {
    preLoaders: [
      {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "jshint-loader!babel-loader?optional=runtime"
      },{
          test: /\.js$/,
          include: /tonic-/,
          loader: "babel-loader?optional=runtime"
      }
    ],
    loaders: [
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=100000&minetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=1000000" },
      { test: /\.css$/, loader: "style-loader!css-loader!autoprefixer-loader?browsers=last 2 version" }
    ]
  },
  jshint: {
    esnext: true,
    globalstrict: true // Babel add 'use strict'
  }
};
