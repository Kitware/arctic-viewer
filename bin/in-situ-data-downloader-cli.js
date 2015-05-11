#! /usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    http = require('http'),
    ProgressBar = require('progress');

program
  .version('0.0.6')
  .option('-d, --download [http://remote-host/data]', 'Url to the source of your in-situ data.')
  .option('-o, --output [directory]', 'Data directory where to download remote data locally')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
    return program.outputHelp();
}

// Handle relative path
var outputDirectory = program.output ? program.output : process.env.PWD;
if (outputDirectory[0] === '.') {
    outputDirectory = path.normalize(path.join(process.env.PWD, outputDirectory));
}

var downloadQueries = [],
    downloadPatterns = [],
    argsIndex = [],
    argsValues = [],
    argsNames = [],
    dataDescriptor = null,
    progress = null;

// Download and save the info.json
http.get(program.download + '/info.json', function(res) {
    var buffer = [];
    res.on('data', function (chunk) {
        buffer.push(chunk);
    });
    res.on('end', function () {
        fs.writeFile(path.join(outputDirectory, 'info.json'),
                    buffer.join(''),
                    function (err) {
                        if (err) throw err;
                    }
        );
        dataDescriptor = JSON.parse(buffer.join(''));
        buildDownloadStructure();
    });

}).on('error', function(e) {
    console.log("Got error: " + e.message);
});


// Process data descriptor and start download
function buildDownloadStructure() {
    // Handle args dimension
    for(var key in dataDescriptor.arguments) {
        argsNames.push(key);
        argsIndex.push(0);
        argsValues.push(dataDescriptor.arguments[key].values);
    }

    // Handle data pattern
    var array = dataDescriptor.data,
        count = array.length;
    while(count--) {
       downloadPatterns.push(array[count].pattern);
    }

    while(next()) {
        downloadQueries.push(getQuery());
    }
    progress = new ProgressBar('downloading [:bar] :percent | :current/:total | :etas', {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total: downloadQueries.length * downloadPatterns.length });

    downloadNextFile();
}

function next(idx) {
    if(idx === undefined) {
        idx = argsIndex.length - 1;
    }

    if(idx < 0) {
        return false;
    }

    if(argsIndex[idx] + 1 < argsValues[idx].length) {
        argsIndex[idx]++;
        return true;
    } else {
        if(next(idx - 1)) {
            argsIndex[idx] = 0;
            return true;
        }
        return false;
    }
}

function getQuery() {
    var query = {},
        count = argsNames.length;

    while(count--) {
        query[argsNames[count]] = argsValues[count][argsIndex[count]];
    }

    return query;
}

function toUrl(pattern, query) {
    var result = '/' + pattern,
        keyPattern = ['{', '}'];

    for(var opt in query) {
        result = result.replace(keyPattern.join(opt), query[opt]);
    }

    return result;
}

function downloadNextFile() {
    if(downloadQueries.length === 0) {
        console.log("\nAll download are completed\n");
        return;
    }
    var query = downloadQueries.pop(),
        count = downloadPatterns.length;
    while(count--) {
        downloadFile(toUrl(downloadPatterns[count], query));
    }
}

function mkdirp(dirPath, done) {
    var parent = path.dirname(dirPath);
    fs.exists(dirPath, function(exists) {
        if(exists) {
            done();
        } else {
            mkdirp(parent, function(){
                fs.mkdirSync(dirPath);
                done();
            });
        }
    });
}

function downloadFile(url) {
    // Create content directory if need be
    var destFile = path.join(outputDirectory, url),
        destDirectory = path.dirname(destFile);

    fs.exists(destFile, function(exists) {
        if(exists) {
            progress.tick(1);
            downloadNextFile();
        } else {
            mkdirp(destDirectory, function(){
                // Download file
                http.get(program.download + url, function(res) {
                    res.on('data', function (chunk) {
                        fs.appendFile(destFile,
                                    chunk,
                                    function (err) { if (err) throw err; }
                        );
                    });
                    res.on('end', function () {
                        progress.tick(1);
                        downloadNextFile();
                    });

                }).on('error', function(e) {
                    console.log("Got error: " + e.message);
                });
            });
        }
    });
}
