var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    http = require('http'),
    ProgressBar = require('progress'),
    tarball = require('tarball-extract');

var outputDirectory = path.normalize(process.env.PWD),
    downloadQueries = [],
    downloadPatterns = [],
    argsIndex = [],
    argsValues = [],
    argsNames = [],
    dataDescriptor = null,
    progress = null;

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

module.exports = {
    downloadSampleData: function() {
        console.log("\n | Downloading sample data (~100MB) into directory " + outputDirectory);
        var baseURL = 'http://www.kitware.com/in-situ-data/tonic-sample-data/',
            files = ['mpas-probe-flat-earth.tgz', 'hydra-image-fluid-velocity.tgz'],
            doneCount = 0;

        function done() {
            doneCount++;

            if(doneCount === files.length) {
                console.log(" |\n | Thank you for trying this out...\n");
            }
        }

        mkdirp(outputDirectory, function(){
            console.log(" |\n | => Once the data will be downloaded, you will be able to try the ArcticViewer with the following commands:\n |");
            for(var i = 0; i < files.length; i++) {
                var url = baseURL + files[i],
                    destFile = path.join(outputDirectory, files[i]),
                    extractedDir = destFile.substring(0, destFile.length - 4);

                processFile(url, destFile, extractedDir, done);
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
