var webpack = require('webpack');

module.exports = {
  plugins: [],
  entry: './lib/arctic-viewer.js',
  output: {
    path: './dist',
    filename: 'viewer.js',
  },
  module: {
    preLoaders: [
      {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "jshint-loader!babel" // ?optional[]=runtime&optimisation.react.inlineElements
      },{
          test: /\.js$/,
          include: /tonic-/,
          loader: "babel" // ?optional[]=runtime&optimisation.react.inlineElements
      }
    ],
    loaders: [
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=60000&mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=60000" },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
      { test: /\.css$/, loader: "style-loader!css-loader!autoprefixer-loader?browsers=last 2 version" },
      { test: /\.c$/i, loader: "shader" },
      { test: require.resolve("./lib/arctic-viewer.js"), loader: "expose?ArcticViewer" }
    ]
  },
  jshint: {
    esnext: true,
    devel: true, // suppress alert and console global warnings
    browser: true, // suppress global browser object warnings
    globalstrict: true // Babel add 'use strict'
  }
};
