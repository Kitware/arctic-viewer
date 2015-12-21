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
            loader: "eslint-loader",
            exclude: /node_modules/,
      },
    ],
    loaders: [
      { test: require.resolve("./lib/arctic-viewer.js"), loader: "expose?ArcticViewer" },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=60000&mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=60000" },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
      { test: /\.css$/, loader: "style-loader!css-loader!autoprefixer-loader?browsers=last 2 version" },
      { test: /\.c$/i, loader: "shader" },
      { test: /\.js$/, include: /node_modules\/tonic-/, loader: "babel?presets[]=react,presets[]=es2015" },
      { test: /\.js$/, exclude: /node_modules/, loader: "babel?presets[]=react,presets[]=es2015" },
    ],
  },
  externals: {
    "three": "THREE",
    // "ArcticViewer": "ArcticViewer",
  },
  eslint: {
      configFile: '.eslintrc',
  },
};
