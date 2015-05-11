#! /usr/bin/env node

var fs = require('fs'),
    program = require('commander'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    httpProxy = require('http-proxy');

function handlePort(value) {
    return Number(value);
}

program
  .version('0.0.6')
  .option('-p, --port [3000]', 'Start web server with given port', handlePort, 3000)
  .option('-d, --data [directory]', 'Data directory to serve. Should contain a info.json file.')
  .option('-s, --server-only', 'Do not open the web browser')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
    return program.outputHelp();
}

// Handle data path
var path = require('path'),
    dataPath = program.data ? program.data : process.env.PWD,
    needProxy = (dataPath.indexOf('http') === 0),
    before = [];

// Handle relative path
if(dataPath[0] === '.') {
    dataPath = path.normalize(path.join(process.env.PWD, dataPath));
}

// Build request handling
// - static HTML + JS
before.push(ecstatic({
    root: __dirname + "/../dist",
    cache: 3600,
    showDir: false,
    autoIndex: true,
    defaultExt: 'html',
    handleError: false
}));

// - Handle data
if(needProxy) {
    // Need to proxy the data directory
    var proxy = httpProxy.createProxyServer({});
    before.push(function (req, res) {
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
    before.push(ecstatic({
        root: dataPath,
        cache: 10,
        showDir: false,
        autoIndex: false,
        handleError: false,
        gzip: true
    }));
}

// Print server information
console.log("\nIn-Situ Data Viewer\n  => Serve " + dataPath + " on port " + program.port + "\n");

// Start server and listening
var serverOptions = {
        before: before,
        headers: {},
        onError: function (err, req, res) {
          console.log(req.url + ' => ' + err.message);
          res.end();
        }
    },
    server = union.createServer(serverOptions);

server.listen(program.port);

// Open browser if asked
if (!program.serverOnly) {
    require('open')('http://localhost:' + program.port);
}
