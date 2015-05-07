#! /usr/bin/env node

var path = require('path'),
    static = require('node-static'),
    dataFiles = new static.Server(process.argv[process.argv.length - 1],  { cache: 10 }),
    wwwFiles = new static.Server(path.normalize(__dirname + "/../dist")),
    port = 3000;

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        dataFiles.serve(request, response, function (err, result) {
            if (err) { // There was an error serving the file
                wwwFiles.serve(request, response);
            }
        });
    }).resume();
}).listen(port);
