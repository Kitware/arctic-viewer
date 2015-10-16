#! /usr/bin/env node

require('shelljs/global');

var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    express = require('express'),
    bodyParser = require('body-parser'),
    httpProxy = require('http-proxy'),
    gzipStatic = require('connect-gzip-static'),
    downloader = require('./arctic-data-downloader.js'),
    preCheckDataDir = require('./arctic-dataset-list-builder.js'),
    oneDay = 86400000,
    tenSeconds = 10000,
    clientConfiguration = {},
    ipList = require('./network');

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
    mkdir('-p', path.dirname(result));

    return result;
}

function extractImageBase64(rawString) {
    return removeHead(rawString, 'base64,');
}

function removeHead(rawString, keyword) {
    var cutIdx = rawString.indexOf(keyword);

    if(cutIdx === -1) {
        return null;
    }

    // Need to shift idx and cut string
    cutIdx += keyword.length;
    return rawString.slice(cutIdx);
}

program
  .version('0.3.2')
  .option('-p, --port [3000]', 'Start web server with given port', handlePort, 3000)
  .option('-d, --data [directory/http]', 'Data directory to serve. Should contain a index.json file.')
  .option('-s, --server-only', 'Do not open the web browser')

  .option('-o, --output-pattern [path/pattern]', 'Provide a destination path for the exported images. i.e.: /opt/data/{time}/{pipeline}/{phi}_{theta}.jpg', './export/{__}.jpg')

  .option('--download-sample-data', 'Download some try-out data [~100MB] inside the current directory.')
  .option('--download [http://remote-host/data]', 'Url to the source of your data that you want to download inside the current directory.')

  .option('-M, --magic-lens', 'Enable MagicLens inside client configuration')
  .option('-S, --single-view', 'Enable SingleView inside client configuration')
  .option('-R, --recording', 'Enable Recording inside client configuration')
  .option('-D, --development', 'Enable Development inside client configuration')

  .parse(process.argv);

// Update client configuration:
clientConfiguration.MagicLens   = !!program.magicLens;
clientConfiguration.SingleView  = !!program.singleView;
clientConfiguration.Recording   = !!program.recording;
clientConfiguration.Development = !!program.development;

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
        app.use('/data', gzipStatic(dataPath, { maxAge: tenSeconds }));
    }

    // Print server information
    if(ipList.length === 1) {
        console.log("\nArcticViewer\n  => Serve " + dataPath + "\n  |  http://" + ipList[0].ip + ":" + program.port + "/\n");
    } else {
        console.log("\nArcticViewer\n  => Serve " + dataPath + " on port " + program.port + "\n");
        ipList.forEach(function(l){
            console.log("    ", l.name, "=> http://" + l.ip + ":" + program.port + "/");
        });
        console.log();
    }



    // Add image export handler
    app.use(bodyParser.json({limit: 10000000}));
    app.post('/export', function(req, res) {
        var data = req.body,
            args = data.arguments,
            base64Data = extractImageBase64(data.image);

        if(base64Data) {
            require("fs").writeFile(getExportPath(args), base64Data, 'base64', function(err) {
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

    // Start server and listening
    app.listen(program.port);

    // Open browser if asked
    if (!program.serverOnly) {
        require('open')('http://localhost:' + program.port);
    }
}
