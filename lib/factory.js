var // Core elements
    QueryDataModel     = require('tonic-query-data-model/lib/QueryDataModel'),
    LookupTableManager = require('tonic-image-builder/lib/model/LookupTable/LookupTableManager'),
    PipelineModel      = require('tonic-image-builder/lib/model/PipelineState'),

    // Image builder
    CompositeImageBuilder      = require('tonic-image-builder/lib/builder/Composite'),
    DataProberImageBuilder     = require('tonic-image-builder/lib/builder/DataProber'),
    QueryDataModelImageBuilder = require('tonic-image-builder/lib/builder/QueryDataModel'),
    WebGlCompositeImageBuilder = require('tonic-image-builder/lib/builder/WebGlComposite'),

    // React UI map
    ReactClassMap = {
        GenericViewer     : require('tonic-widgets/lib/react/viewer/ImageBuilder'),
        ProbeViewerWidget : require('tonic-widgets/lib/react/viewer/Probe3D'),
        MultiViewerWidget : require('tonic-widgets/lib/react/viewer/MultiLayout')
    },

    // Global instances
    lutManager = new LookupTableManager(),

    // External dependencies
    React = require('react'),
    contains = require('mout/src/array/contains');

// ----------------------------------------------------------------------------

export function getJSON(url, callback) {
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

    xhr.onerror = function(e) {
        callback(e, xhr);
    };

    xhr.send();
}

// ----------------------------------------------------------------------------

export function createViewer(url, callback) {
    var viewer = { ui: 'GenericViewer' },
        pathItems = url.split('/'),
        basepath = pathItems.slice(0, pathItems.length - 1).join('/') + '/';

    getJSON(url, function(error, data) {
        var dataType = data.type;

        // Update background if available
        if(data && data.metadata && data.metadata.backgroundColor) {
            viewer.bgColor = data.metadata.backgroundColor;
        }

        // Handle QueryDataModel data type
        if(contains(dataType, 'tonic-query-data-model')) {
            viewer.queryDataModel = new QueryDataModel(data, basepath);

            if(contains(dataType, 'in-situ-data-prober')) {
                viewer.imageBuilder = new DataProberImageBuilder(viewer.queryDataModel, lutManager);
                viewer.imageBuilder.setProbeLineNotification(true);
                viewer.imageBuilder.update();
                viewer.ui = 'ProbeViewerWidget';
            } else if(dataType.length === 1) {
                viewer.imageBuilder = new QueryDataModelImageBuilder(viewer.queryDataModel);
                viewer.imageBuilder.update();
            } else if(contains(dataType, 'composite-pipeline')) {
                viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
                viewer.imageBuilder = new CompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel);
                viewer.imageBuilder.update();
            } else if(contains(dataType, 'webgl-composite')) {
                viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
                viewer.imageBuilder = new WebGlCompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel, lutManager);
                viewer.imageBuilder.update();
            }

            callback(viewer);
        } else if(contains(dataType, 'ensemble-dataset')) {
            var imageBuilders = {},
                queryDataModel = null,
                ready = 0,
                expected = data.Ensemble.datasets.length;

            data.Ensemble.datasets.forEach(function(ds) {
                createViewer(basepath + ds.data, function(viewer) {
                    ready++;
                    imageBuilders[ds.name] = { builder: viewer.imageBuilder, name: ds.name, queryDataModel: viewer.queryDataModel };

                    // Debug start
                    viewer.imageBuilder.name = ds.name;
                    viewer.queryDataModel.name = ds.name;
                    // Debug end

                    if(!queryDataModel) {
                        queryDataModel = viewer.queryDataModel;
                    }

                    if(ready === expected) {
                        // Apply binding if any
                        bindDatasets(data.Ensemble.binding || [], imageBuilders);

                        // Ready for UI deployment
                        callback({ imageBuilders, queryDataModel, ui: 'MultiViewerWidget' });
                    }
                });
            });
        }
    });
}

// ----------------------------------------------------------------------------

export function createUI(viewer, container) {
    if(viewer.bgColor) {
        container.style['background-color'] = viewer.bgColor;
    }

    return React.render(React.createElement(ReactClassMap[viewer.ui], viewer), container);
}

// ----------------------------------------------------------------------------

function createQueryDataModelCallback(datasets, args) {
    return function(data, envelope) {
        var argName = data.name,
            argValue = data.value,
            count = datasets.length;

        if(args.indexOf(argName) !== -1) {
            while(count--) {
                var dataset = datasets[count];
                if(dataset.getValue(argName) !== argValue) {
                    dataset.setValue(argName, argValue);
                    dataset.fetchData();
                }
            }
        }
    };
}

// ----------------------------------------------------------------------------

function createImageBuilderCallback(imageBuilders, methodToCall) {
    return function(data, envelope) {
        var count = imageBuilders.length;

        while(count--) {
            var builder = imageBuilders[count];
            builder[methodToCall](data);
        }
    };
}

// ----------------------------------------------------------------------------

export function bindDatasets(bindConfig, imageBuilders) {
    bindConfig.forEach(function(binding) {
        var datasets = [],
            builders = [];
        for(var name in imageBuilders) {
            if(binding.datasets.indexOf(name) !== -1) {
                builders.push(imageBuilders[name].builder);
                datasets.push(imageBuilders[name].builder.getQueryDataModel());
            }
        }
        var callbackFn = createQueryDataModelCallback(datasets, binding.arguments);
        datasets.forEach(function(queryDataModel) {
            queryDataModel.onStateChange(callbackFn);
        });

        // Bind image builder properties
        if(binding.other) {
            binding.other.forEach(function(builderBinding) {
                var builderCallback = createImageBuilderCallback(builders, builderBinding.setter);
                builders.forEach(function(imageBuilder) {
                    imageBuilder[builderBinding.listener](builderCallback);
                });
            });

        }
    });
}
