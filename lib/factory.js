var // Core elements
    QueryDataModel     = require('tonic-query-data-model/lib/QueryDataModel'),
    LookupTableManager = require('tonic-image-builder/lib/model/LookupTable/LookupTableManager'),
    PipelineModel      = require('tonic-image-builder/lib/model/PipelineState'),

    // Image builder
    CompositeImageBuilder      = require('tonic-image-builder/lib/builder/Composite'),
    RawDataProberImageBuilder   = require('tonic-image-builder/lib/builder/RawDataProber'),
    DataProberImageBuilder     = require('tonic-image-builder/lib/builder/DataProber'),
    PixelOperatorImageBuilder = require('tonic-image-builder/lib/builder/PixelOperator'),
    QueryDataModelImageBuilder = require('tonic-image-builder/lib/builder/QueryDataModel'),
    WebGlCompositeImageBuilder = require('tonic-image-builder/lib/builder/WebGlComposite'),

    // Painters
    LineChartPainter = require('tonic-image-builder/lib/painter/LineChart'),

    // React UI map
    ReactClassMap = {
        GenericViewer     : require('tonic-widgets/lib/react/viewer/ImageBuilder'),
        ProbeViewerWidget : require('tonic-widgets/lib/react/viewer/Probe3D'),
        MultiViewerWidget : require('tonic-widgets/lib/react/viewer/MultiLayout'),
        ViewerSelector    : require('tonic-widgets/lib/react/widget/ButtonSelector')
    },

    // Global instances
    lutManager = new LookupTableManager(),

    // External dependencies
    React = require('react'),
    equals = require('mout/src/array/equals'),
    contains = require('mout/src/array/contains'),
    isEnsembleBuild = false;

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

            if(contains(dataType, 'in-situ-data-prober') || (contains(dataType, 'data-prober') && contains(dataType, 'binary'))) {
                var ProberImageBuilder = DataProberImageBuilder,
                    dimensions = null;
                if(contains(dataType, 'data-prober') && contains(dataType, 'binary')) {
                    ProberImageBuilder = RawDataProberImageBuilder;
                    dimensions = viewer.queryDataModel.originalData.DataProber.dimensions;
                } else {
                    dimensions = viewer.queryDataModel.originalData.InSituDataProber.dimensions;
                }

                var singleView = {
                        name            : 'Single View',
                        imageBuilder    : new ProberImageBuilder(viewer.queryDataModel, lutManager),
                        queryDataModel  : viewer.queryDataModel,
                        ui              : 'ProbeViewerWidget',
                        destroy         : function() { this.imageBuilder.destroy(); }
                    },
                    multiView = {
                        name            : 'Multi View',
                        renderers       : {},
                        queryDataModel  : viewer.queryDataModel,
                        ui              : 'MultiViewerWidget',
                        destroy         : function() { while(this.renderers.length) { this.renderers.pop().destroy(); } }
                    };

                // Configure single view
                singleView.imageBuilder.setProbeLineNotification(true);
                singleView.imageBuilder.update();

                if(!isEnsembleBuild) {
                    // Configure multi view
                    var imageBuilders = [
                            new ProberImageBuilder(viewer.queryDataModel, lutManager),
                            new ProberImageBuilder(viewer.queryDataModel, lutManager),
                            new ProberImageBuilder(viewer.queryDataModel, lutManager)
                        ],
                        chartPainters = [
                            new LineChartPainter('X: {x}'),
                            new LineChartPainter('Y: {x}'),
                            new LineChartPainter('Z: {x}')
                        ];

                    function updateProbeLocation(data, envelope) {
                        imageBuilders.forEach(function(builder) {
                            if(!equals(data, builder.getProbe())) {
                                builder.setProbe(data[0], data[1], data[2])
                            }
                        });

                        // Update charts
                        chartPainters[0].setMarkerLocation(data[0]/(dimensions[0]-1));
                        chartPainters[1].setMarkerLocation(data[1]/(dimensions[1]-1));
                        chartPainters[2].setMarkerLocation(data[2]/(dimensions[2]-1));
                    }

                    function updateCrosshairVisibility(data, envelope) {
                        imageBuilders.forEach(function(builder) {
                            builder.setCrossHairEnable(data);
                        });

                        // Update charts
                        chartPainters[0].enableMarker(data);
                        chartPainters[1].enableMarker(data);
                        chartPainters[2].enableMarker(data);
                    }

                    function updateChartPainters(data, envelope) {
                        if(data.x.fields[0].data.length) {
                            chartPainters[0].updateData(data.x);
                        }
                        if(data.y.fields[0].data.length) {
                            chartPainters[1].updateData(data.y);
                        }
                        if(data.z.fields[0].data.length) {
                            chartPainters[2].updateData(data.z);
                        }
                    }

                    // Initialize the Image builders
                    var methods = [].concat(singleView.imageBuilder.getRenderMethods());
                    imageBuilders.forEach(function(builder) {
                        var name = methods.shift();
                        builder.setRenderMethod(name);
                        builder.setRenderMethodImutable();
                        builder.setProbeLineNotification(true);
                        builder.onProbeChange(updateProbeLocation);
                        builder.onCrosshairVisibilityChange(updateCrosshairVisibility);
                        builder.onProbeLineReady(updateChartPainters);
                        builder.update();
                        multiView.renderers[name] = { name, builder };
                    });

                    // Initialize the Chart painters
                    var names = ['Line Chart X', 'Line Chart Y', 'Line Chart Z'];
                    chartPainters.forEach(function(painter) {
                        var name = names.shift();
                        multiView.renderers[name] = { name, painter };
                    })

                    // Show the selector UI
                    viewer.list = [singleView, multiView];
                    viewer.ui = 'ViewerSelector';
                    viewer.onChange = function(idx, list) {
                        callback(viewer.list[idx]);
                    }
                } else {
                    viewer.imageBuilder = singleView.imageBuilder;
                    viewer.ui = singleView.ui;
                }
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
            var renderers = {},
                queryDataModel = null,
                ready = 0,
                expected = data.Ensemble.datasets.length;

            // Let the factory know to not build everything
            isEnsembleBuild = true;

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
        }
    });
}

// ----------------------------------------------------------------------------

export function createUI(viewer, container) {
    if(viewer.bgColor) {
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
