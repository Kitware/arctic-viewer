#! /usr/bin/env node

var fs = require('fs'),
    program = require('commander'),
    express = require('express'),
    httpProxy = require('http-proxy'),
    downloader = require('./in-situ-data-downloader.js');

function handlePort(value) {
    return Number(value);
}

program
  .version('0.2.2')
  .option('-p, --port [3000]', 'Start web server with given port', handlePort, 3000)
  .option('-d, --data [directory/http]', 'Data directory to serve. Should contain a info.json file.')
  .option('-s, --server-only', 'Do not open the web browser')

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

        // Serve data from static content
        app.use('/data', express.static(dataPath));
    }

    // Print server information
    console.log("\nIn-Situ Data Viewer\n  => Serve " + dataPath + " on port " + program.port + "\n");

    // Start server and listening
    app.listen(program.port);

    // Open browser if asked
    if (!program.serverOnly) {
        require('open')('http://localhost:' + program.port);
    }
}
