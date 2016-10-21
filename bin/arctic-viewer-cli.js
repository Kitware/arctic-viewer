#! /usr/bin/env node

require('shelljs/global');

var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    downloader = require('./arctic-data-downloader.js'),
    clientConfiguration = {},
    ipList = require('./network'),
    pkg = require('../package.json'),
    version = /semantically-release/.test(pkg.version) ? 'development version' : pkg.version;

function handlePort(value) {
    if (!isNaN(parseInt(value, 10))) {
        return parseInt(value, 10);
    }
    throw Error('port option requires a number');
}

program
  .version(version)
  .option('-p, --port [3000]', 'Start web server with given port', handlePort, 3000)
  .option('-d, --data [directory/http]', 'Data directory to serve')
  .option('-s, --server-only', 'Do not open the web browser\n')

  .option('-o, --output-pattern [path/pattern]', 'Provide a path/pattern for the exported images\n', './export/{__}.jpg')

  .option('--download-sample-data', 'Choose data to download inside current directory')
  .option('--download [http://remote-host/data]', 'Download remote data inside current directory\n')

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
  var dataPath = program.data ? program.data : process.env.PWD,
    app = require('./server')(dataPath, { clientConfiguration: clientConfiguration, output: program.output });

  // Start server and listening
  app.listen(program.port);

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

  // Open browser if asked
  if (!program.serverOnly) {
      require('open')('http://localhost:' + program.port);
  }
}
