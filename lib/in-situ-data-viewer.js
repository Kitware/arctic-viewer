import * as QueryDataModel    from 'tonic-query-data-model/lib/tonic-query-data-model.js';
import DataProberImageBuilder from 'tonic-image-builder/lib/DataProberImageBuilder';

import React             from 'react';
import ProbeViewerWidget from 'tonic-widgets/lib/react/CatalystWeb/ProbeViewerWidget';
import ImageViewerWidget from 'tonic-widgets/lib/react/CatalystWeb/ImageViewerWidget';

// Load CSS
require('font-awesome-webpack');
require('normalize.css');
require('tonic-widgets/lib/css/state.css');
require('tonic-widgets/lib/react/ParameterSetWidget/style.css');
require('tonic-widgets/lib/react/CatalystWeb/ImageViewerWidget.css');
require('tonic-widgets/lib/react/CatalystWeb/ProbeViewerWidget.css');

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
            return alert("Unable to download metadata at " + url);
        }

        // Update background if needed
        if(data && data.metadata && data.metadata.backgroundColor) {
            container.style['background-color'] = data.metadata.backgroundColor;
        }

        var queryDataModel = null;

        if(data.type.indexOf('tonic-query-data-model') !== -1) {
            queryDataModel = QueryDataModel.createQueryDataModel(data, '/data/');
        }

        if(queryDataModel) {
            // Figure out which viewer should be used

            // > Basic image viewer ===========================================
            if(data.type.length === 1) {
                queryDataModel.fetchData();

                React.render(
                    React.createElement(ImageViewerWidget, {
                        model: queryDataModel
                    }),
                    container);
            }
            // < ==============================================================

            // > Probe Data Viewer ============================================
            if(data.type.indexOf('in-situ-data-prober') !== -1) {
                var imageBuilder = new DataProberImageBuilder(queryDataModel);
                imageBuilder.update();

                React.render(
                    React.createElement(ProbeViewerWidget, {
                        model: imageBuilder,
                        probe: true
                    }),
                    container);
            }
            // < ==============================================================

        } else {
            return alert("The metadata format seems to be unsupported.");
        }
    });
}


// Auto-load the data
load('/data/info.json', document.querySelector('.react-content'));
