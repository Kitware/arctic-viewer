var fs = require('fs');
var path = require('path');
var reservedNames = {
  phi: 'Camera_X',
  theta: 'Camera_Y',
};
var queryDataModelBinds = {
  theta: {
    mouse: { drag: { modifier: 0, coordinate: 1, step: 30, orientation: +1 } },
  },
  phi: {
    mouse: { drag: { modifier: 0, coordinate: 0, step: 10, orientation: +1 } },
  },
};

function convertQueryDataModelToCinemaSpecA(queryDataModelMetaData, destinationDirectory) {
    var cinemaFormat = {
        type: "simple",
        version: "1.1",
        metadata: {
            type: "parametric-image-stack"
        },
        name_pattern: queryDataModelMetaData.data[0].pattern,
        arguments: {}
    }

    // Register each arguments
    for(var name in queryDataModelMetaData.arguments) {
        var cinemaArg = {};

        // Add values
        cinemaArg.label = name; // Cinema does not support (label != name)
        cinemaArg.type = queryDataModelMetaData.arguments[name].ui ? (queryDataModelMetaData.arguments[name].ui === 'slider' ? 'range' : 'list') : 'list';
        cinemaArg.values = queryDataModelMetaData.arguments[name].values;
        cinemaArg.default = cinemaArg.values[queryDataModelMetaData.arguments[name].default || 0];

        if(reservedNames[name]) {
            cinemaFormat.name_pattern = cinemaFormat.name_pattern.replace('{'+name+'}','{' + reservedNames[name] + '}');
            name = cinemaArg.label = reservedNames[name];
        }

        cinemaFormat.arguments[name] = cinemaArg;
    }

    // Write into info.json
    var outputFilename = path.join(destinationDirectory, 'info.json');
    fs.writeFile(outputFilename, JSON.stringify(cinemaFormat, null, 2), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Dataset converted and Cinema Store saved to " + outputFilename);
        }
    });
}

function convertCinemaArgToQueryDataModel(argName, cinemaArg) {
    var queryDataModelArg = {};

    // Fill data if needed
    queryDataModelArg.values = cinemaArg.values;
    if(cinemaArg.values.indexOf(cinemaArg.default) > 0) {
        queryDataModelArg.default = cinemaArg.values.indexOf(cinemaArg.default);
    }
    if(cinemaArg.type === 'range') {
        queryDataModelArg.ui  = 'slider';
    }
    if(cinemaArg.label !== argName) {
        queryDataModelArg.label = cinemaArg.label;
    }

    // Add default binding
    if(queryDataModelBinds[argName]) {
        queryDataModelArg.bind = queryDataModelBinds[argName];
    }

    // Add default looping
    if(argName === 'phi') {
        queryDataModelArg.loop = 'modulo';
    }

    return queryDataModelArg;
}

function convertCinemaSpecAToQueryDataModel(cinemaMetadata, destinationDirectory) {
    var queryDataModelFormat = {
        type: [ 'tonic-query-data-model' ],
        arguments_order: [],
        arguments: {},
        data: [{ name: "image", type: "blob", mimeType: "image/", pattern: cinemaMetadata.name_pattern }],
        metadata: {}
    };

    // Extract mime type
    var patternList = cinemaMetadata.name_pattern.split('.');
    queryDataModelFormat.data[0].mimeType += patternList[patternList.length - 1];

    // Process arguments
    for(var argName in cinemaMetadata.arguments) {
        var cinemaArg = cinemaMetadata.arguments[argName],
            queryDataModelArg = convertCinemaArgToQueryDataModel(argName, cinemaArg);

        if(queryDataModelArg.values.length > 1) {
            queryDataModelFormat.arguments_order.push(argName);
        }
        queryDataModelFormat.arguments[argName] = queryDataModelArg;
    }

    // Process metadata
    for(var metaKey in cinemaMetadata.metadata) {
        if(metaKey !== 'type') {
            queryDataModelFormat.metadata[metaKey] = cinemaMetadata.metadata[metaKey];
        }
    }

    // Write into cinema.json
    var outputFilename = path.join(destinationDirectory, 'index.json');
    fs.writeFile(outputFilename, JSON.stringify(queryDataModelFormat, null, 2), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Dataset converted from Cinema Store Spec A to ArcticViewer dataset: " + outputFilename);
        }
    });
}

module.exports = {
    cinema: convertQueryDataModelToCinemaSpecA,
    queryDataModel: convertCinemaSpecAToQueryDataModel,
    queryDataModelArg: convertCinemaArgToQueryDataModel
};
