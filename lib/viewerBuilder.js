var // Core elements
    QueryDataModel     = require('tonic-query-data-model/lib/QueryDataModel'),
    LookupTableManager = require('tonic-image-builder/lib/model/LookupTable/LookupTableManager'),
    PipelineModel      = require('tonic-image-builder/lib/model/PipelineState'),

    // Image builder
    CompositeImageBuilder          = require('tonic-image-builder/lib/builder/Composite'),
    DataProberImageBuilder         = require('tonic-image-builder/lib/builder/DataProber'),
    FloatImageImageBuilder         = require('tonic-image-builder/lib/builder/FloatImage'),
    MultiColorBySortedImageBuilder = require('tonic-image-builder/lib/builder/MultiColorBySortedComposite'),
    PixelOperatorImageBuilder      = require('tonic-image-builder/lib/builder/PixelOperator'),
    QueryDataModelImageBuilder     = require('tonic-image-builder/lib/builder/QueryDataModel'),
    RawDataProberImageBuilder      = require('tonic-image-builder/lib/builder/RawDataProber'),
    WebGlCompositeImageBuilder     = require('tonic-image-builder/lib/builder/WebGlComposite'),
    WebGLSortedVolumeImageBuilder  = require('tonic-image-builder/lib/builder/WebGlSortedComposite'),

    // Painters
    LineChartPainter = require('tonic-image-builder/lib/painter/LineChart'),

    // Inline React widgets
    CollapsibleElement = require('tonic-widgets/lib/react/widget/CollapsibleElement'),
    CompositeControl = require('tonic-widgets/lib/react/widget/CompositeControl'),

    // Global instances
    lutManager = new LookupTableManager(),

    // External dependencies
    React = require('react'),
    equals = require('mout/src/array/equals'),
    contains = require('mout/src/array/contains'),
    merge = require('mout/src/object/merge'),
    extractURL = require('mout/src/queryString/parse');

export default function build(basepath, data, config, callback) {
    var dataType = data.type,
        viewer = { ui: 'GenericViewer', config: config };

    // Update background if available
    if(data && data.metadata && data.metadata.backgroundColor) {
        viewer.bgColor = data.metadata.backgroundColor;
    }

    // Handle QueryDataModel data type
    if(contains(dataType, 'tonic-query-data-model')) {
        viewer.queryDataModel = config.queryDataModel || new QueryDataModel(data, basepath);

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

            if(!config.ensemble) {
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
        } else if(contains(dataType, 'composite-pipeline-image')) {
            viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
            viewer.imageBuilder = new QueryDataModelImageBuilder(viewer.queryDataModel);

            viewer.pipelineModel.onChange(function(pipeline){
                viewer.queryDataModel.setValue('pipeline', pipeline);
                viewer.imageBuilder.update();
            });
            viewer.queryDataModel.setValue('pipeline', viewer.pipelineModel.getPipelineQuery());

            viewer.menuAddOn = [
                (<CollapsibleElement title="Pipeline" key='CompositeControl_parent'>
                    <CompositeControl
                        key='CompositeControl'
                        model={ viewer.pipelineModel }
                    />
                </CollapsibleElement>)
            ];

            viewer.imageBuilder.update();
        } else if(contains(dataType, 'float-image')) {
            // Create ImageBuilder + Line Chart for time probe
            let imageBuilder = new FloatImageImageBuilder(viewer.queryDataModel, lutManager);
            let timeSize = viewer.queryDataModel.getSize('time');
            imageBuilder.update();

            // If time available provide a chart painter
            if(timeSize && timeSize > 1 && !contains(dataType, 'single-view') && !config.SingleView) {
                var timeArray = null;
                let chartPainter = new LineChartPainter('');
                viewer.renderers = {
                    '3D View':   { builder: imageBuilder, name: '3D View'},
                    'Time data': { painter: chartPainter, name: 'Time data'}
                };
                viewer.ui = 'MultiViewerWidget';
                viewer.layout = '2x1';

                // Link chartPainter with image builder
                imageBuilder.onTimeDataReady( (data, envelope) => {
                    timeArray = data.fields[0].data;
                    chartPainter.setTitle('Field: ' + data.fields[0].name);
                    chartPainter.updateData(data)
                });
                // Link time change with painter mark
                viewer.queryDataModel.onStateChange( (data, envelope) => {
                    var timeIdx = viewer.queryDataModel.getIndex('time');
                    imageBuilder.getTimeProbe().value = timeArray ? timeArray[timeIdx] : '';
                    chartPainter.setMarkerLocation( timeIdx / timeSize);
                });
            } else {
                // Single view
                viewer.imageBuilder = imageBuilder;
            }
        } else if(contains(dataType, 'composite-pipeline')) {
            viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
            viewer.imageBuilder = new CompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel);
            viewer.imageBuilder.update();
        } else if(contains(dataType, 'webgl-composite')) {
            viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
            viewer.imageBuilder = new WebGlCompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel, lutManager);
            viewer.imageBuilder.update();
        } else if(contains(dataType, 'sorted-composite')) {
            if(contains(dataType, 'multi-color-by')) {
                viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData, true);
                viewer.imageBuilder = new MultiColorBySortedImageBuilder(viewer.queryDataModel, lutManager, viewer.pipelineModel);
                viewer.imageBuilder.update();
            } else {
                viewer.imageBuilder = new WebGLSortedVolumeImageBuilder(viewer.queryDataModel, lutManager);
                viewer.imageBuilder.update();
            }
        }
        callback(viewer);
        return true;
    }
    return false;
}
