#! /usr/bin/env node

/* eslint-disable */

require('shelljs/global');

var path = require('path'),
    tarball = require('tarball-extract'),
    nodeDest = path.join(__dirname, '../bundles/nodes'),
    bundleRoot = path.join(__dirname, '../bundles'),
    packageJSON = require(path.join(__dirname, '../package.json')),
    bundleIdx = 0,
    baseNodeModulePath = path.join(__dirname, '../node_modules'),
    directoryToCopy = [
        path.join(__dirname, '../bin'),
        path.join(__dirname, '../dist'),
        path.join(__dirname, '../LICENSE'),
    ],
    nodePaths = [
        { name: 'osx', url: 'https://nodejs.org/dist/v4.1.1/node-v4.1.1-darwin-x64.tar.gz' },
        { name: 'linux_x64', url: 'https://nodejs.org/dist/v4.1.1/node-v4.1.1-linux-x64.tar.gz' },
        { name: 'linux_x86', url: 'https://nodejs.org/dist/v4.1.1/node-v4.1.1-linux-x86.tar.gz' },
        // { name: 'win32', url: [ 'https://nodejs.org/dist/v4.1.1/win-x86/node.exe', 'https://nodejs.org/dist/v4.1.1/win-x86/node.lib'] },
        // { name: 'win64', url: [ 'https://nodejs.org/dist/v4.1.1/win-x64/node.exe', 'https://nodejs.org/dist/v4.1.1/win-x64/node.lib'] }
    ],
    unixScript = '#!/bin/bash\n'
               + 'SOURCE="${BASH_SOURCE[0]}"\n'
               + 'while [ -h "$SOURCE" ]; do\n'
               + '  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"\n'
               + '  SOURCE="$(readlink "$SOURCE")"\n'
               + '  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"\n'
               + 'done\n'
               + 'DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"\n'
               + '$DIR/bin/node $DIR/bin/arctic-viewer-cli.js $@';

// Create download destination
rm('-rf', bundleRoot);
mkdir('-p', nodeDest);

// Process next bundle
function next() {
    if(bundleIdx < nodePaths.length) {
        var bundle = nodePaths[bundleIdx++];
        generateBundle(bundle);
    } else {
        // Clean download
        rm('-rf', nodeDest);
    }
}

// Generate a bundle
function generateBundle(nodeConf) {
    var filePath = nodeConf.url.split('/').pop(),
        bundleDest = path.join(bundleRoot, nodeConf.name);
        nodeExecDest = path.join(bundleDest, 'bin');

    // Copy ArcticViewer into bundle
    directoryToCopy.forEach(function(d) {
        cp('-r', d, bundleDest);
    })

    // Copy only needed node_modules
    var destNodeModules = path.join(bundleDest, 'node_modules');
    mkdir('-p', destNodeModules);
    for(var moduleName in packageJSON.dependencies) {
        cp('-r', path.join(baseNodeModulePath, moduleName), destNodeModules);
    }

    // Create Exec file
    var execScript = path.join(bundleDest, 'ArcticViewer');
    unixScript.to(execScript);
    chmod('u+x', execScript);

    // Download node and put the binary into bundle
    tarball.extractTarballDownload(
        nodeConf.url,
        path.join(nodeDest, filePath),
        nodeDest,
        {},
        function(err, result) {
            if(!err) {
                // copy node exec
                var dirName = filePath.split('.tar')[0];
                cp(path.join(nodeDest, dirName, 'bin', 'node'), nodeExecDest);

                // Move to next bundle
                next();
            } else {
                console.log(' | oups something wrong happened while downloading ' + nodeConf.url);
            }
        }
    );
}

// Start bundle process
next();
