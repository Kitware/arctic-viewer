#! /usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    usage = 'Usage: ArcticViewer2Cinema /path/to/Arctic/DataSet/directory';

// Make sure we have valid argument
if(process.argv.length !== 3) {
    console.log(usage);
    return;
}

// Load Tonic descriptor
var queryDataModelDescriptor = require(process.argv[2] + '/index.json');

// Find the possible type mapping
if(queryDataModelDescriptor.type.length === 1 && queryDataModelDescriptor.type[0] === 'tonic-query-data-model') {
    // Spec A
    require('./cinema/specA').cinema(queryDataModelDescriptor, process.argv[2]);
} else {
    console.log('The following ArcticViewer dataset can not be converted into Cinema database.');
    console.log('=>', queryDataModelDescriptor.type);
}
