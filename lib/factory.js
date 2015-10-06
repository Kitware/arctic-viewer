var // Core viewer builder
    viewerBuilder = require('./viewerBuilder'),

    // Image builder for ensemble
    PixelOperatorImageBuilder = require('tonic-image-builder/lib/builder/PixelOperator'),

    // Painters
    MagicLensImageBuilder = require('tonic-image-builder/lib/builder/MagicLens'),
    LineChartPainter = require('tonic-image-builder/lib/painter/LineChart'),

    // React UI map
    ReactClassMap = {
        GenericViewer     : require('tonic-widgets/lib/react/viewer/ImageBuilder'),
        ProbeViewerWidget : require('tonic-widgets/lib/react/viewer/Probe3D'),
        MultiViewerWidget : require('tonic-widgets/lib/react/viewer/MultiLayout'),
        ViewerSelector    : require('tonic-widgets/lib/react/widget/ButtonSelector'),
        ArcticListViewer  : require('./viewer')
    },

    // Inline React widgets
    CollapsibleElement = require('tonic-widgets/lib/react/widget/CollapsibleElement'),
    CompositeControl = require('tonic-widgets/lib/react/widget/CompositeControl'),

    // Global instances

    // External dependencies
    React = require('react'),
    equals = require('mout/src/array/equals'),
    contains = require('mout/src/array/contains'),
    merge = require('mout/src/object/merge'),
    extractURL = require('mout/src/queryString/parse'),
    buildViewerForEnsemble = false;

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
    var pathItems = url.split('/'),
        basepath = pathItems.slice(0, pathItems.length - 1).join('/') + '/';

    getJSON('/config.json', function(configErr, config) {
        if(configErr) {
            config = {};
        }

        // Merge config with URL parameters as well
        config = merge(config, extractURL(window.location.href));

        // Update configuration if we build for ensemble
        if(buildViewerForEnsemble) {
            config.ensemble = true;
        }

        getJSON(url, function(error, data) {
            var dataType = data.type;

            if(contains(dataType, 'ensemble-dataset')) {
                var renderers = {},
                    queryDataModel = null,
                    ready = 0,
                    expected = data.Ensemble.datasets.length;

                // Let the factory know to not build everything
                buildViewerForEnsemble = true;

                data.Ensemble.datasets.forEach(function(ds) {
                    createViewer(basepath + ds.data, function(viewer) {
                        ready++;
                        if(viewer.ui === 'ViewerSelector') {
                            renderers[ds.name] = { builder: viewer.list[0].imageBuilder, name: ds.name, queryDataModel: viewer.list[0].queryDataModel };
                            viewer.list[0].imageBuilder.name = ds.name;
                            while(viewer.list.length > 1) {
                                viewer.list.pop().destroy();
                            }
                        } else {
                            renderers[ds.name] = { builder: viewer.imageBuilder, name: ds.name, queryDataModel: viewer.queryDataModel };
                            viewer.imageBuilder.name = ds.name; // Used for pixel operator if any
                        }

                        if(!queryDataModel) {
                            queryDataModel = viewer.queryDataModel;
                        }

                        if(ready === expected) {
                            // Apply binding if any
                            bindDatasets(data.Ensemble.binding || [], renderers);

                            // Create pixel operators if any
                            createOperators(data.Ensemble.operators || [], renderers);

                            // Ready for UI deployment
                            callback({ renderers, queryDataModel, ui: 'MultiViewerWidget' });
                        }
                    });
                });
            } else if(contains(dataType, 'arctic-viewer-list')) {
                // Show dataset listing
                callback({ ui: 'ArcticListViewer', list: data.list, basePath: '/data/'});
            } else if(config.MagicLens) {
                viewerBuilder(basepath, data, config, function(background) {
                    viewerBuilder(basepath, data, config, function(viewer) {
                        var defaultSynchList = ['phi', 'theta', 'n_pos', 'time'];
                        background.imageBuilder.getQueryDataModel().link(viewer.imageBuilder.getQueryDataModel(), defaultSynchList, true);
                        viewer.imageBuilder.getQueryDataModel().link(background.imageBuilder.getQueryDataModel(), defaultSynchList, true);

                        viewer.imageBuilder = new MagicLensImageBuilder(viewer.imageBuilder, background.imageBuilder);
                        callback(viewer);
                    });
                });
            } else if(viewerBuilder(basepath, data, config, callback)) {
                // We are good to go
            }
        });
    });
}

// ----------------------------------------------------------------------------

export function createUI(viewer, container) {
    if(viewer.bgColor && viewer.ui !== 'MultiViewerWidget') {
        container.style[(viewer.bgColor.indexOf('gradient') !== -1) ? 'background' : 'background-color'] = viewer.bgColor;
    }

    // Make sure we trigger a render when the UI is mounted
    setImmediate(function(){
        var renderers = viewer.renderers || {};
        for(var name in renderers) {
            if(renderers[name].builder && renderers[name].builder.update) {
                renderers[name].builder.update();
            }
        }
        if(viewer.imageBuilder && viewer.imageBuilder.update) {
            viewer.imageBuilder.update();
        }
    });

    return React.render(React.createElement(ReactClassMap[viewer.ui], viewer), container);
}

// ----------------------------------------------------------------------------

function createQueryDataModelCallback(datasets, args) {
    return function(data, envelope) {
        var argName = data.name,
            argValue = data.value,
            count = datasets.length,
            datasetToUpdate = [];

        if(args.indexOf(argName) !== -1) {
            while(count--) {
                var dataset = datasets[count];
                if(dataset.getValue(argName) !== argValue) {
                    dataset.setValue(argName, argValue);
                    datasetToUpdate.push(dataset)
                }
            }
        }

        setImmediate(function(){
            while(datasetToUpdate.length) {
                datasetToUpdate.pop().fetchData();
            }
        });
    };
}

// ----------------------------------------------------------------------------

function createImageBuilderCallback(renderers, methodToCall) {
    return function(data, envelope) {
        var count = renderers.length;

        while(count--) {
            var renderer = renderers[count];
            renderer[methodToCall](data);
        }
    };
}

// ----------------------------------------------------------------------------

export function bindDatasets(bindConfig, renderers) {
    bindConfig.forEach(function(binding) {
        var datasets = [],
            rendererList = [];
        for(var name in renderers) {
            if(binding.datasets.indexOf(name) !== -1) {
                rendererList.push(renderers[name].builder || renderers[name].painter);
                if(renderers[name].builder) {
                    datasets.push(renderers[name].builder.getQueryDataModel());
                }
            }
        }
        var callbackFn = createQueryDataModelCallback(datasets, binding.arguments);
        datasets.forEach(function(queryDataModel) {
            queryDataModel.onStateChange(callbackFn);
        });

        // Bind image builder properties
        if(binding.other) {
            binding.other.forEach(function(rendererBinding) {
                var rendererCallback = createImageBuilderCallback(rendererList, rendererBinding.setter);
                rendererList.forEach(function(renderer) {
                    renderer[rendererBinding.listener](rendererCallback);
                });
            });

        }
    });
}

// ----------------------------------------------------------------------------

export function createOperators(operatorConfig, renderers) {
    operatorConfig.forEach(function(operator){
        // Create Pixel Operator
        var pixelOperator = new PixelOperatorImageBuilder(operator.operation, operator.datasets);
        pixelOperator.name = operator.name; // Used for pixel operator if any

        // Register PixelOperator
        renderers[operator.name] = { builder: pixelOperator, name: operator.name };
    });

    // Bind each image builder after all have been created
    operatorConfig.forEach(function(operator){
        var pixelOperator = renderers[operator.name].builder;

        // Generic callback to push data into the PixelOperator
        function pushDataToPixelOperator(data, envelope) {
            pixelOperator.updateData(data.builder.name, data);
        }

        // Listen to all datasets that PixelOperator care about
        operator.datasets.forEach(function(name) {
            renderers[name].builder.onImageReady(pushDataToPixelOperator);
        });
    });
}
