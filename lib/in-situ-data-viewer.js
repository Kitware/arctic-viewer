var QueryDataModel = require('tonic-query-data-model/lib/QueryDataModel'),
    DataProberImageBuilder = require('tonic-image-builder/lib/DataProberImageBuilder'),
    CompositeImageBuilder = require('tonic-image-builder/lib/CompositeImageBuilder'),
    React = require('react'),
    CompositeViewerWidget = require('tonic-widgets/lib/react/CatalystWeb/CompositeViewerWidget'),
    ProbeViewerWidget = require('tonic-widgets/lib/react/CatalystWeb/ProbeViewerWidget'),
    ImageViewerWidget = require('tonic-widgets/lib/react/CatalystWeb/ImageViewerWidget'),
    LookupTableManager = require('tonic-image-builder/lib/LookupTable/LookupTableManager');

// Load CSS
require('font-awesome-webpack');
require('normalize.css');
require('tonic-widgets/lib/css/state.css');
require('tonic-widgets/lib/react/ParameterSetWidget/style.css');

function getDataDescription(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
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

        var queryDataModel = null,
            imageBuilder = null,
            lutManager = new LookupTableManager();

        if(data.type.indexOf('tonic-query-data-model') !== -1) {
            queryDataModel = new QueryDataModel(data, '/data/');
        }

        if(queryDataModel) {
            // Figure out which viewer should be used

            // > Basic image viewer ===========================================
            if(data.type.length === 1) {
                queryDataModel.fetchData();

                React.render(
                    React.createElement(ImageViewerWidget, {
                        queryDataModel
                    }),
                    container);
            }
            // // < ==============================================================

            // > Probe Data Viewer ============================================
            if(data.type.indexOf('in-situ-data-prober') !== -1) {
                imageBuilder = new DataProberImageBuilder(queryDataModel, true, lutManager);
                imageBuilder.update();

                React.render(
                    React.createElement(ProbeViewerWidget, {
                        queryDataModel,
                        imageBuilder,
                        probe: true
                    }),
                    container);
            }
            // < ==============================================================

            // > Composite Data Viewer ============================================
            if(data.type.indexOf('composite-pipeline') !== -1) {
                imageBuilder = new CompositeImageBuilder(queryDataModel);
                imageBuilder.update();

                React.render(
                    React.createElement(CompositeViewerWidget, {
                        queryDataModel,
                        imageBuilder
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
load('http://' + location.host + '/data/info.json', document.querySelector('.react-content'));
