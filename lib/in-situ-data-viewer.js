// CSS loading -----------------------------------------------------------------

require('font-awesome-webpack');
require('normalize.css');
require('tonic-widgets/lib/css/state.css');

// Dependencies injections -----------------------------------------------------

var // Core elements
    QueryDataModel     = require('tonic-query-data-model/lib/QueryDataModel'),
    LookupTableManager = require('tonic-image-builder/lib/model/LookupTable/LookupTableManager'),
    PipelineModel      = require('tonic-image-builder/lib/model/PipelineState'),

    // Image builder
    CompositeImageBuilder      = require('tonic-image-builder/lib/builder/Composite'),
    DataProberImageBuilder     = require('tonic-image-builder/lib/builder/DataProber'),
    QueryDataModelImageBuilder = require('tonic-image-builder/lib/builder/QueryDataModel'),
    WebGlCompositeImageBuilder = require('tonic-image-builder/lib/builder/WebGlComposite'),

    // Viewers
    ImageBuilderViewerWidget = require('tonic-widgets/lib/react/viewer/ImageBuilder'),
    ProbeViewerWidget        = require('tonic-widgets/lib/react/viewer/Probe3D'),
    MultiViewerWidget        = require('tonic-widgets/lib/react/viewer/MultiLayout'),

    // External dependencies
    React = require('react'),
    contains = require('mout/src/array/contains'),
    lutManager = new LookupTableManager();

// Helper method to fetch remote JSON object -----------------------------------

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

// Generic data viewer ---------------------------------------------------------

function createGenericViewer(queryDataModel, imageBuilder, container) {
    return React.render(
                React.createElement(
                    ImageBuilderViewerWidget,
                    { queryDataModel, imageBuilder}
                ),
                container);
}

// Expose viewer factory method ------------------------------------------------

export function load(url, container) {

    // Fetch JSON descriptor
    getDataDescription(url, function(error, data) {
        if(error) {
            return alert("Unable to download metadata at " + url);
        }

        // Update background if available
        if(data && data.metadata && data.metadata.backgroundColor) {
            container.style['background-color'] = data.metadata.backgroundColor;
        }

        // Reserve the set of possible variables
        var dataType = data.type,
            queryDataModel = null,
            imageBuilder = null;

        // Create a QueryDataModel if the data needs it
        if(contains(dataType, 'tonic-query-data-model')) {
            queryDataModel = new QueryDataModel(data, '/data/');
        }

        // Initialize viewers that need a QueryDataModel
        if(queryDataModel) {
            // Custom probe viewer
            if(contains(dataType, 'in-situ-data-prober')) {
                imageBuilder = new DataProberImageBuilder(queryDataModel, lutManager);
                imageBuilder.update();

                return React.render(
                            React.createElement(
                                ProbeViewerWidget,
                                { queryDataModel, imageBuilder}
                            ),
                            container);
            }

            // Basic image viewer
            if(dataType.length === 1) {
                imageBuilder = new QueryDataModelImageBuilder(queryDataModel);
                imageBuilder.update();
                return createGenericViewer(queryDataModel, imageBuilder, container);
            }

            // Composite Data Viewer
            if(contains(dataType, 'composite-pipeline')) {
                var pipelineModel = new PipelineModel(queryDataModel.originalData),
                imageBuilder = new CompositeImageBuilder(queryDataModel, pipelineModel);
                imageBuilder.update();
                return createGenericViewer(queryDataModel, imageBuilder, container);
            }

            // WebGL Composite data viewer
            if(contains(dataType, 'webgl-composite')) {
                var pipelineModel = new PipelineModel(queryDataModel.originalData),
                imageBuilder = new WebGlCompositeImageBuilder(queryDataModel, pipelineModel, lutManager);
                imageBuilder.update();

                return createGenericViewer(queryDataModel, imageBuilder, container);
            }
        } else {
            return alert("The metadata format seems to be unsupported.");
        }
    });
}
