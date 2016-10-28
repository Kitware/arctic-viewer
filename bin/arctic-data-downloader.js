var fs = require('fs');
var path = require('path');
var program = require('commander');
var http = require('http');
var ProgressBar = require('progress');
var tarball = require('tarball-extract');
var shell = require('shelljs');

var outputDirectory = path.normalize(process.env.PWD),
    downloadQueries = [],
    downloadPatterns = [],
    argsIndex = [],
    argsValues = [],
    argsNames = [],
    dataDescriptor = null,
    progress = null;

require('shelljs/global');

var availableData = {
    'diskout-composite': {
        url: 'http://tonic.kitware.com/arctic-viewer/diskout-composite.tgz',
        size: ' 40.0 MB'
    },
    'ensemble': {
        url: 'http://tonic.kitware.com/arctic-viewer/ensemble.tgz',
        size: ' 94.2 MB'
    },
    // 'garfield': {
    //     url: 'http://tonic.kitware.com/arctic-viewer/garfield.tgz',
    //     size: '  292 KB'
    // },
    'head_ct_3_features': {
        url: 'http://tonic.kitware.com/arctic-viewer/head_ct_3_features.tgz',
        size: ' 13.7 MB'
    },
    'head_ct_4_features': {
        url: 'http://tonic.kitware.com/arctic-viewer/head_ct_4_features.tgz',
        size: ' 13.1 MB'
    },
    'hydra-image-fluid-velocity': {
        url: 'http://tonic.kitware.com/arctic-viewer/hydra-image-fluid-velocity.tgz',
        size: ' 50.8 MB'
    },
    'mpas-composite-earth': {
        url: 'http://tonic.kitware.com/arctic-viewer/mpas-composite-earth.tgz',
        size: '162.3 MB'
    },
    'mpas-flat-earth-prober': {
        url: 'http://tonic.kitware.com/arctic-viewer/mpas-flat-earth-prober.tgz',
        size: ' 37.5 MB'
    },
    'mpas-hd-500-7t': {
        url: 'http://tonic.kitware.com/arctic-viewer/mpas-hd-500-7t.tgz',
        size: '552.5 MB'
    }
};

function processFile(url, destFile, extractedDir, doneCallback) {
    fs.exists(extractedDir, function(exists) {
        if(exists) {
            console.log(" |  $ ArcticViewer -d " + extractedDir);
            doneCallback();
        } else {
            tarball.extractTarballDownload(
                url,
                destFile, path.dirname(destFile),
                {},
                function(err, result) {
                    if(!err) {
                        console.log(" |  $ ArcticViewer -d " + extractedDir);
                        rm(destFile);
                    } else {
                        console.log(' | oups something wrong happened while downloading ' + url);
                    }
                    doneCallback();
                }
            );
        }
    });
}

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
  shell.mkdir('-p', dirPath);
  done();
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

function downloadAvailableDatasets(list) {
    var downloadCount = 0,
        doneCount = 0;

    console.log(" |\n | => You will be able to try ArcticViewer with these commands:\n |");

    function done() {
        doneCount++;
        if(downloadCount === doneCount) {
            console.log(" |\n | Thank you for trying this out...\n");
        }
    }

    while(list.length) {
        var dsIdx = list.pop();
        var idx = 0;
        for(var name in availableData) {
            idx++;
            if(idx === dsIdx) {
                downloadCount++;
                var url = availableData[name].url,
                    destFile = path.join(outputDirectory, name + '.tgz'),
                    extractedDir = destFile.substring(0, destFile.length - 4);
                processFile(url, destFile, extractedDir, done);
            }
        }
    }
}

module.exports = {
    downloadSampleData: function() {
        console.log("\n | Available datasets for download (path: " + outputDirectory + ')');

        var idx = 1;
        for(var name in availableData) {
            console.log(" |   ("+ (idx++)+ ')', availableData[name].size, ' - ' , name);
        }
        console.log(' | ')

        var message = ' | Press Enter to quit or the dataset number to download: ',
            listToDownload = [];

        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdout.write(message);
        process.stdin.on('data', function (text) {
            var n = Number(text);
            listToDownload.push(n);
            if(text === '\n') {
                process.stdin.pause();
                downloadAvailableDatasets(listToDownload);
            } else {
                process.stdout.write(message);
            }
        });
    },

    downloadData: function(url) {
        http.get(url + '/index.json', function(res) {
            var buffer = [];
            res.on('data', function (chunk) {
                buffer.push(chunk);
            });
            res.on('end', function () {
                fs.writeFile(path.join(outputDirectory, 'index.json'),
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
    }
};
