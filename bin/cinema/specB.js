require('shelljs/global');

var fs = require('fs'),
    path = require('path'),
    reservedNames = {
      'phi':   'Camera_X',
      'theta': 'Camera_Y',
    },
    queryDataModelArg = require('./specA.js').queryDataModelArg,
    ENCODING = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function nextStep(exploreState) {
     // Move to next step
    var idxs = exploreState.idxs,
        sizes = exploreState.sizes,
        count = idxs.length;

    // May overshoot
    idxs[count - 1]++;

    // Handle overshoot
    while(count--) {
        if(idxs[count] < sizes[count]) {
            // We are good
            continue;
        } else {
            // We need to move the index back up
            if(count > 0) {
                idxs[count] = 0;
                idxs[count - 1]++;
            } else {
                return false; // We are done
            }
        }
    }

    return true;
}

function getPath(pattern, exploreState, args) {
    var query = {},
        path = pattern,
        count = exploreState.idxs.length;

    // Build query
    while(count--) {
        var name = exploreState.args[count];
        query[name] = args[name].values[exploreState.idxs[count]];
    }

    // Build file path
    var keyPattern = ['{', '}'];
    for(var key in query) {
        path = path.replace(keyPattern.join(key), query[key]);
    }

    return path;
}

function convertCinemaSpecBToQueryDataModel(cinemaMeta, srcPath, destPath, pvpythonPath) {
    // Build index.json for QueryDataModel
    var queryDataModelFormat = {
            CompositePipeline: {
                layers: [],
                pipeline: [],
                layer_fields: {},
                fields: {}
            },
            type: [ "tonic-query-data-model", "sorted-composite", "multi-color-by" ],
            arguments: {},
            SortedComposite: {
                reverseCompositePass: false,
                ranges: {},
                layers: 0,
                pipeline: [],
                dimensions: [ 500, 500 ],
                light: [ "intensity" ]
            },
            data: [
                {
                    pattern: "intensity.uint8",
                    type: "array",
                    name: "intensity",
                    categories: [ "intensity" ]
                },{
                    pattern: "order.uint8",
                    type: "array",
                    name: "order",
                }
            ],
            arguments_order: [],
            metadata: { }
    };

    // Extract arguments from real layers and colorBy
    var colors = {},
        layers = {},
        basePattern = "",
        fieldCodeMap = {},
        colorCount = 0,
        explorationState = {
            args: [],
            sizes: [],
            idxs:[]
        };
    for(var argName in cinemaMeta.arguments) {
        if(cinemaMeta.arguments[argName].isfield) {
            colors[argName] = cinemaMeta.arguments[argName];
        } else if(cinemaMeta.arguments[argName].islayer) {
            // We can't do anything at that point
        } else {
            queryDataModelFormat.arguments[argName] = queryDataModelArg(argName, cinemaMeta.arguments[argName]);
            basePattern += '{' + argName + '}/';
            queryDataModelFormat.arguments_order.push(argName);

            // Update structure for later iteration
            explorationState.args.push(argName)
            explorationState.sizes.push(cinemaMeta.arguments[argName].values.length);
            explorationState.idxs.push(0);
        }
    }

    // Update existing data pattern
    queryDataModelFormat.data.forEach(function(item){
        item.pattern = basePattern + item.pattern;
    });

    // Build fieldCodeMap
    for(var colorKey in colors) {
        var values = colors[colorKey].values,
            types = colors[colorKey].types,
            allRanges = colors[colorKey].valueRanges || {},
            count = types.length,
            colorCodeList = [];

        while(count--) {
            var fieldName = values[count],
                type = types[count],
                ranges = allRanges[fieldName] || [0, 1];
            if(!fieldCodeMap[fieldName]) {
                if(type !== 'depth' && type !== 'luminance' && type !== 'rgb') {
                    var colorCode = ENCODING[colorCount++]
                    fieldCodeMap[fieldName] = colorCode;
                    queryDataModelFormat.CompositePipeline.fields[colorCode] = fieldName;
                    colorCodeList.push(colorCode);

                    queryDataModelFormat.SortedComposite.ranges[fieldName] = ranges;
                }
            } else {
                colorCodeList.push(fieldCodeMap[fieldName]);
            }
        }

        // Register color code list to dependency layer
        for(var layerName in cinemaMeta.associations[colorKey]) {
            if(Array.isArray(cinemaMeta.associations[colorKey][layerName])) {
                cinemaMeta.associations[colorKey][layerName].forEach(function(layerValue){
                    var fullLayerName = layerValue; // [layerName, layerValue].join('=');
                    if(!layers[fullLayerName]) {
                        var idx = queryDataModelFormat.SortedComposite.layers++,
                            layerCode = ENCODING[idx];
                        layers[fullLayerName] = { idx: idx };

                        // Add layer in metadata
                        queryDataModelFormat.CompositePipeline.layers.push(layerCode)
                        queryDataModelFormat.CompositePipeline.pipeline.push({ name: fullLayerName, ids: [ layerCode ], parent: layerName });
                        queryDataModelFormat.SortedComposite.pipeline.push({ name: fullLayerName, colorBy: [ ] });

                        // Register associated color now
                        queryDataModelFormat.CompositePipeline.layer_fields[layerCode] = colorCodeList;
                        colorCodeList.forEach(function(colorCode){
                            queryDataModelFormat.SortedComposite.pipeline[idx].colorBy.push({type: 'field', name: queryDataModelFormat.CompositePipeline.fields[colorCode]});
                        });
                    }
                })
            } else {
                var fullLayerName = [layerName, cinemaMeta.associations[colorKey][layerName]].join('=');
                if(!layers[fullLayerName]) {
                    var idx = queryDataModelFormat.SortedComposite.layers++,
                        layerCode = ENCODING[idx];
                    layers[fullLayerName] = { idx: idx };

                    // Add layer in metadata
                    queryDataModelFormat.CompositePipeline.layers.push(layerCode)
                    queryDataModelFormat.CompositePipeline.pipeline.push({ name: fullLayerName, ids: [ layerCode ] });
                    queryDataModelFormat.SortedComposite.pipeline.push({ name: fullLayerName, colorBy: [ ] });

                    // Register associated color now
                    queryDataModelFormat.CompositePipeline.layer_fields[layerCode] = colorCodeList;
                    colorCodeList.forEach(function(colorCode){
                        queryDataModelFormat.SortedComposite.pipeline[idx].colorBy.push({type: 'field', name: queryDataModelFormat.CompositePipeline.fields[colorCode]});
                    });
                }
            }
        }
    }

    // Write data
    mkdir('-p', destPath);

    // Create mapping list between source and destination
    var directoryList = [
        {
            src: path.join(srcPath, getPath(cinemaMeta.name_pattern, explorationState, queryDataModelFormat.arguments).split('{')[0]),
            dest: path.join(destPath, getPath(basePattern, explorationState, queryDataModelFormat.arguments))
        }
    ];
    while(nextStep(explorationState)) {
        var dirItem = {
            src: path.join(srcPath, getPath(cinemaMeta.name_pattern, explorationState, queryDataModelFormat.arguments).split('{')[0]),
            dest: path.join(destPath, getPath(basePattern, explorationState, queryDataModelFormat.arguments))
        };
        directoryList.push(dirItem);
    }

    // Copy file for conversion
    var extension = '.' + cinemaMeta.name_pattern.split('.').pop(),
        dataEntryToAdd = {};
    directoryList.forEach(function(item){
        mkdir('-p', item.dest);
        ls('-R', item.src).forEach(function(file){
            if(file.endsWith('.im')) {
                for(var layerName in layers) {
                    var count = queryDataModelFormat.SortedComposite.layers,
                        layerSearch = layerName;

                    // Replace .../layer?Clip1=ON.im by .../layer0Clip1=ON.im
                    // as only the layer0 has the valid depth map
                    while(count--) {
                        layerSearch = layerSearch.replace('layer'+count, 'layer0');
                    }

                    // If it is a match then we copy the depth
                    if(file.indexOf(layerSearch) !== -1) {
                        // Depth file
                        cp(path.join(item.src, file), path.join(item.dest, layers[layerName].idx + '.im')); // '-f',
                    }
                }
            } else {
                for(var layerName in layers) {
                    if(file.indexOf(layerName) !== -1) {
                        // Found the layer name
                        var fileCopied = false;

                        // => need to find colorBy
                        queryDataModelFormat.SortedComposite.pipeline[layers[layerName].idx].colorBy.forEach(function(colorItem){
                            if(file.indexOf(colorItem.name) !== -1) {
                                var name = [layers[layerName].idx, colorItem.name].join('_');
                                if(!dataEntryToAdd[name]) {
                                    dataEntryToAdd[name] = {
                                      "pattern": basePattern + name + ".float32",
                                      "type": "array",
                                      "name": name,
                                      "categories": [ name ]
                                    }
                                }

                                cp('-f', path.join(item.src, file), path.join(item.dest, name + extension));
                                fileCopied = true;
                            }
                        });


                        if(!fileCopied && (file.indexOf('luminance') !== -1 || file.indexOf('lum') !== -1)) {
                            cp('-f', path.join(item.src, file), path.join(item.dest, layers[layerName].idx + '.luminance'));
                        }
                    }
                }
            }
        });
    });

    // Add extra data entry
    for(var dataKey in dataEntryToAdd) {
        queryDataModelFormat.data.push(dataEntryToAdd[dataKey]);
    }

    // Write index
    var outputFilename = path.join(destPath, 'index.json');
    fs.writeFile(outputFilename, JSON.stringify(queryDataModelFormat, null, 2), function(err) {
        if(err) {
            console.log(err);
        }
    });

    // Write metadata for next data conversion step
    var pythonMeta = { layers: queryDataModelFormat.SortedComposite.layers, scalars: queryDataModelFormat.SortedComposite.ranges, directories: [] };
    directoryList.forEach(function(dirInfo){
        pythonMeta.directories.push(dirInfo.dest);
    });
    var outputFilename = path.join(destPath, 'convert.json');
    fs.writeFile(outputFilename, JSON.stringify(pythonMeta, null, 2), function(err) {
        if(err) {
            console.log(err);
        } else {
            // Trigger data convertion in python
            exec([pvpythonPath, path.join(__dirname, 'convert-spec-b.py'), destPath].join(' '));

            console.log("Dataset converted from Cinema Store Spec B to QueryDataModel dataset: " + outputFilename);
        }
    });
}


module.exports = {
    cinema: function(){ console.log("QueryDataModel to Cinema Spec B is not a supported path.") },
    queryDataModel: convertCinemaSpecBToQueryDataModel,
};
