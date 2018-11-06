const path = require('path');
const autoprefixer = require('autoprefixer');

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
    rules: [
      { test: entry, loader: 'expose-loader?ArcticViewer' },
      {
        test: /\.worker\.js$/,
        include: /vtk\.js/,
        use: [
          {
            loader: 'worker-loader',
            options: { inline: true, fallback: false },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer('last 2 version', 'ie >= 10')],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: /\.module\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
              modules: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer('last 2 version', 'ie >= 10')],
            },
          },
        ],
      },
      {
        test: /\.mcss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
              modules: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer('last 2 version', 'ie >= 10')],
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-sprite-loader?runtimeCompat=true',
        exclude: /fonts/,
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=60000&mimetype=application/font-woff',
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=60000',
        include: /fonts/,
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192',
      },
      {
        test: /\.c$/i,
        loader: 'shader-loader',
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.isvg$/,
        loader: 'html-loader?attrs=false',
      },
      {
        test: /\.js$/,
        include: /paraviewweb/,
        loader: 'babel-loader?presets[]=env,presets[]=react,babelrc=false',
      },
      {
        test: /\.js$/,
        include: /vtk.js/,
        loader: 'babel-loader?presets[]=env,presets[]=react,babelrc=false',
      },
      {
        test: /\.js$/,
        include: /wslink/,
        loader: 'babel-loader?presets[]=env,babelrc=false',
      },
      {
        test: /\.glsl$/,
        loader: 'shader-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader?presets[]=env,presets[]=react',
      },
    ].concat({
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
      enforce: 'pre',
      options: { configFile: eslintrcPath },
    }),
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
