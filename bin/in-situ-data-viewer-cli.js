#! /usr/bin/env node

var connect = require('connect'),
    createStatic = require('connect-static'),
    path = require('path'),
    app = connect(),
    port = 3000;

// Serve HTML + JS
createStatic({
    dir: path.normalize(__dirname + "/../dist"),
    aliases: [ ['/', '/index.html'] ],
    ignoreFile: function(path) { return false; },
    followSymlinks: false
}, function(err, handler) {
    if(err) throw err;
    app.use('/', handler);
});

// Serve Data
createStatic({
    dir: process.argv[process.argv.length - 1],
    aliases: [ ['/', '/info.json'] ],
    ignoreFile: function(path) { return false; },
    followSymlinks: true
}, function(err, handler) {
    if(err) throw err;
    app.use('/data/', handler);
});

var server = app.listen(port);
