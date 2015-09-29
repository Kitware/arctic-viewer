var fs = require('fs'),
    path = require('path'),
    du = require('du');

function formatFileSize(size) {
    var units = [' B', ' KB', ' MB', ' GB', ' TB'],
        unitIdx = 0;

    while(size > 1000) {
        unitIdx++;
        size /= 1000;
    }

    // Truncate decimals + add unit
    return size.toFixed(1) + units[unitIdx];
}

function updateDatasetSize(basepath) {
    var infoPath = path.join(basepath, 'info.json'),
        originalData = require(infoPath);
    du(basepath, function(err, size) {
        if(err) {
            return console.log('Error computing size of', basepath);
        }

        // Make sure we have a metadata section
        if(!originalData.metadata) {
            originalData.metadata = {};
        }

        // Add size section
        originalData.metadata.size = formatFileSize(size);

        // Save to disk
        fs.writeFile(infoPath, JSON.stringify(originalData, null, 2));
    });
}

function addDataset(listToFill, fullpath, dirName, json) {
    var dataset = {},
        metadata = json.metadata || {};

    // Extract everything
    dataset.name        = metadata.title || dirName;
    dataset.description = metadata.description || 'No description available';
    dataset.size        = metadata.size || '';
    dataset.thumbnail   = metadata.thumbnail;
    dataset.type        = json.type;
    dataset.path        = dirName + '/info.json';

    if(!metadata.size) {
        // Update size for next time
        updateDatasetSize(fullpath);
    }

    // Find thumbnail if any
    if(!dataset.thumbnail) {
        ['thumbnail.png', 'thumbnail.jpg'].forEach(function(th) {
            var fullImagePath = path.join(fullpath, th);
            if (fs.existsSync(fullImagePath)) {
                dataset.thumbnail = dirName + '/' + th;
            }
        });
    }

    listToFill.push(dataset);
}

function processDirectory(basePath) {
    var dataToLoadPath = path.join(basePath, 'info.json');
    if (fs.existsSync(dataToLoadPath)) {
        var existingDataset = require(dataToLoadPath);
        try {
           if(existingDataset.type.indexOf('arctic-viewer-list') === 0) {
                // OK
            } else {
                return;
            }
        } catch(e) {
            return;
        }

    }

    var datasets = [],
        result = { type: ['arctic-viewer-list'], list: datasets },
        subDirectories = fs.readdirSync(basePath).filter(function(file) { return fs.statSync(path.join(basePath, file)).isDirectory(); });

    subDirectories.forEach(function(dirName) {
        var dsPath = path.join(basePath, dirName),
            infoPath = path.join(dsPath, 'info.json');
        if (fs.existsSync(infoPath)) {
            addDataset(datasets, dsPath, dirName, require(infoPath));
        }
    });


    fs.writeFile(path.join(basePath, 'info.json'), JSON.stringify(result, null, 2));
}

// Expose method
module.exports = processDirectory;
