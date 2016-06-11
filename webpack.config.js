var path = require('path');
var webpack = require('webpack');
var loaders = require('./node_modules/paraviewweb/config/webpack.loaders.js');
var plugins = [];

if (process.env.NODE_ENV === 'production') {
  console.log('==> Production build');
  plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }));
}

module.exports = {
  plugins: plugins,
  entry: './lib/arctic-viewer.js',
  output: {
    path: './dist',
    filename: 'viewer.js',
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
    }],
    loaders: [
      { test: require.resolve('./lib/arctic-viewer.js'), loader: 'expose?ArcticViewer' },
    ].concat(loaders),
  },
  externals: {
    three: 'THREE',
    Plotly: true,
  },
  resolve: {
    alias: {
      PVWStyle: path.resolve('./node_modules/paraviewweb/style'),
    },
  },
  postcss: [
    require('autoprefixer')({ browsers: ['last 2 versions'] }),
  ],
  eslint: {
    configFile: '.eslintrc.js',
  },
};
