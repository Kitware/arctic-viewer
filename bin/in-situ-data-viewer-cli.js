#! /usr/bin/env node

var program = require('commander');

function handlePort(value) {
    return Number(value);
}

program
  .version('0.0.3')
  .option('-p, --port [3000]', 'Start web server with given port', handlePort, 3000)
  .option('-d, --data [directory]', 'Data directory to serve. Should contain a info.json file.')
  .option('-s, --server-only', 'Do not open the web browser')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
    return program.outputHelp();
}

// Handle data path
var path = require('path'),
    dataPath = program.data ? program.data : process.env.PWD;

if(dataPath[0] === '.') {
    dataPath = path.normalize(path.join(process.env.PWD, dataPath));
}

console.log("\nIn-Situ Data Viewer\n  => Serve " + dataPath + " on port " + program.port + "\n");

var static = require('node-static'),
    dataFiles = new static.Server(dataPath,  { cache: 10 }),
    wwwFiles = new static.Server(path.normalize(__dirname + "/../dist"));

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        dataFiles.serve(request, response, function (err, result) {
            if (err) { // There was an error serving the file
                wwwFiles.serve(request, response);
            }
        });
    }).resume();
}).listen(program.port);

if (!program.serverOnly) {
    require('open')('http://localhost:' + program.port);
}
