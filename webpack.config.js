const path = require('path');

const rules = require('paraviewweb/config/webpack.loaders.js');

const entry = path.join(__dirname, './lib/arctic-viewer.js');
const outputPath = path.join(__dirname, './dist');
const eslintrcPath = path.join(__dirname, '.eslintrc.js');

const plugins = [];

module.exports = {
  plugins,
  entry,
  output: {
    path: outputPath,
    filename: 'viewer.js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [{ test: entry, loader: 'expose-loader?ArcticViewer' }].concat(
      rules,
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        enforce: 'pre',
        options: { configFile: eslintrcPath },
      }
    ),
  },
  externals: {
    three: 'THREE',
    'plotly.js': 'Plotly',
  },
  resolve: {
    alias: {
      PVWStyle: path.resolve('./node_modules/paraviewweb/style'),
    },
  },
};
