#! /usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    program = require('commander'),
    express = require('express'),
    bodyParser = require('body-parser'),
    httpProxy = require('http-proxy'),
    gzipStatic = require('connect-gzip-static'),
    downloader = require('./arctic-data-downloader.js'),
    preCheckDataDir = require('./arctic-dataset-list-builder.js'),
    oneDay = 86400000,
    onMinute = 60000;

function handlePort(value) {
    return Number(value);
}

function getExportPath(args) {
    var result = program.outputPattern,
        keyPattern = ['{', '}'];

    for(var opt in args) {
        result = result.replace(keyPattern.join(opt), args[opt]);
    }

    // Create directory if need be
    mkdirp.sync(path.dirname(result));

    return result;
}

program
  .version('0.0.8')
  .option('-p, --port [3000]', 'Start web server with given port', handlePort, 3000)
  .option('-d, --data [directory/http]', 'Data directory to serve. Should contain a info.json file.')
  .option('-s, --server-only', 'Do not open the web browser')

  .option('-o, --output-pattern [path/pattern]', 'Provide a destination path for the exported images. i.e.: /opt/data/{time}/{pipeline}/{phi}_{theta}.jpg', './export/{__}.jpg')

  .option('-D, --download-sample-data', 'Download some try-out data [~100MB] inside the current directory.')
  .option('-R, --download [http://remote-host/data]', 'Url to the source of your in-situ data that you want to download inside the current directory.')

  .parse(process.argv);

if (!process.argv.slice(2).length) {
    return program.outputHelp();
}

if(program.downloadSampleData) {
    downloader.downloadSampleData();
} else if(program.download) {
    downloader.downloadData(program.download);
} else {
    // Handle data path
    var path = require('path'),
        dataPath = program.data ? program.data : process.env.PWD,
        needProxy = (dataPath.indexOf('http') === 0);

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
        app.use('/data', gzipStatic(dataPath, { maxAge: onMinute }));
    }

    // Print server information
    console.log("\nArcticViewer\n  => Serve " + dataPath + " on port " + program.port + "\n");

    // Add image export handler
    app.use(bodyParser.json({limit: 10000000}));
    app.post('/export', function(req, res) {
        var data = req.body,
            args = data.arguments,
            base64Data = data.image.split('base64,')[1];

        require("fs").writeFile(getExportPath(args), base64Data, 'base64', function(err) {
        });

        res.send('Data saved');
    });

    // Start server and listening
    app.listen(program.port);

    // Open browser if asked
    if (!program.serverOnly) {
        require('open')('http://localhost:' + program.port);
    }
}
