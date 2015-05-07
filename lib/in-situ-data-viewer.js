import React                 from 'react';
import * as QueryDataModel   from 'tonic-query-data-model/lib/tonic-query-data-model.js';
import ImageViewerWidget     from 'tonic-widgets/lib/react/CatalystWeb/ImageViewerWidget';

// Load CSS
require('font-awesome-webpack');
require('normalize.css');
require('tonic-widgets/lib/css/state.css');
require('tonic-widgets/lib/react/ParameterSetWidget/style.css');
require('tonic-widgets/lib/react/CatalystWeb/ImageViewerWidget.css');

function getDataDescription(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = 'text';

    xhr.onload = function(e) {
        if(this.status === 200) {
            return callback(null, JSON.parse(xhr.response));
        }
        callback(new Error(e), xhr);
    };
    xhr.send();
}

// Expose viewer factory method
export default function load(url, container) {

    getDataDescription(url, function(error, data) {
        if(error) {
            return alert(error);
        }

        if(data.type.indexOf('tonic-query-data-model') !== -1) {
            var queryDataModel = QueryDataModel.createQueryDataModel(data, '/data/');
            queryDataModel.fetchData();

            if(data.type.length === 1) {
                // Basic data
                React.render(
                    React.createElement(ImageViewerWidget, {model: queryDataModel}),
                    container);
            }
        } else {
            alert("Data does not seems compatible with the reader");
        }
    });
}


// Auto-load the data
load('/data/info.json', document.querySelector('body'));
