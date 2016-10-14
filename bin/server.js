// Handle data path
var path = require('path'),
  fs = require('fs'),
  express = require('express'),
  bodyParser = require('body-parser'),
  gzipStatic = require('connect-gzip-static'),
  httpProxy = require('http-proxy'),
  preCheckDataDir = require('./arctic-dataset-list-builder'),
  tenSeconds = 10000;

module.exports = function(dataPath, clientConfiguration) {
  // for electron
  if (!clientConfiguration) {
    clientConfiguration = {
      MagicLens: false,
      SingleView: false,
      Recording: false,
      Development: false
    };
  }
  var needProxy = (dataPath.indexOf('http') === 0);

  // Handle relative path
  if(dataPath[0] === '.') {
      dataPath = path.normalize(path.join(process.env.PWD, dataPath));
  }

  // Build request handling
  var app = express();
  // - static HTML + JS
  app.use(express.static(__dirname + "/../dist"));

  // - Handle data
  if(needProxy) {
      // Need to proxy the data directory
      var proxy = httpProxy.createProxyServer({});
      app.use('/data', function (req, res) {
          proxy.web(req, res, {
              target: dataPath,
              changeOrigin: true
          });
      });
  } else {
      // Handle the case we provide a file instead of directory
      if(!fs.statSync(dataPath).isDirectory()) {
          dataPath = path.dirname(dataPath);
      }

      // Build Dataset list if need be
      preCheckDataDir(dataPath);

      // Serve data from static content
      app.use('/data', gzipStatic(dataPath, { maxAge: tenSeconds }));
  }

  // Add image export handler
  app.use(bodyParser.json({limit: 10000000}));
  app.post('/export', function(req, res) {
      var data = req.body,
          args = data.arguments,
          base64Data = extractImageBase64(data.image);

      if(base64Data) {
          fs.writeFile(getExportPath(args), base64Data, 'base64', function(err) {
          });
      } else {
          // We should get the URL of image and copy it with a different name
      }

      res.send('Data saved');
  });

  // Add metadata update
  app.post('/update', function(req, res) {
      var data = req.body,
          title = data.title.replace(/<br>/g, '').replace(/<br\/>/g, ''),
          description = data.description.replace(/<br>/g, '').replace(/<br\/>/g, ''),
          dsPath = path.join(dataPath, removeHead(data.path, '/data/')),
          imagePath = data.image,
          base64Data = extractImageBase64(data.image);

      // Create thumbnail
      if(base64Data) {
          // Write thumbnail as base64
          var thumbnailPath = path.join(dsPath, 'thumbnail.png');
          fs.writeFile(thumbnailPath, base64Data, 'base64', function(err) {});
      } else {
          // Copy image
          console.log('Should copy image: ', imagePath);
      }

      // Update index.json
      var indexPath = path.join(dsPath, 'index.json'),
          originalData = require(indexPath);

      if(!originalData.metadata) {
          originalData.metadata = {};
      }

      originalData.metadata.title = title;
      originalData.metadata.description = description;
      fs.writeFile(indexPath, JSON.stringify(originalData, null, 2));

      res.send('Data updated');
  });

  // Add config.json endpoint
  app.get('/config.json', function(req, res) {
      res.send(JSON.stringify(clientConfiguration, null, 2));
  });

  return app;
};
