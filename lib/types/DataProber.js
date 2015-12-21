import DataProberImageBuilder       from 'tonic-core/lib/builder/image/DataProber';
import BinaryDataProberImageBuilder from 'tonic-core/lib/builder/image/BinaryDataProber';
import LineChartPainter             from 'tonic-core/lib/painter/LineChart';
import equals                       from 'mout/src/array/equals';
import contains                     from 'mout/src/array/contains';

export default function build({viewer, dataType, callback}) {
    var ProberImageBuilder = DataProberImageBuilder,
        dimensions = null;

    // Can we handle the data
    if(!contains(dataType, 'in-situ-data-prober') && !(contains(dataType, 'data-prober') && contains(dataType, 'binary'))) {
        return false;
    }

    // Handle the image and binary format
    if(contains(dataType, 'data-prober') && contains(dataType, 'binary')) {
        ProberImageBuilder = BinaryDataProberImageBuilder;
        dimensions = viewer.queryDataModel.originalData.DataProber.dimensions;
    } else {
        dimensions = viewer.queryDataModel.originalData.InSituDataProber.dimensions;
    }

    // Create 2 viewer choice
    const singleView = {
            name            : 'Single View',
            imageBuilder    : new ProberImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager),
            queryDataModel  : viewer.queryDataModel,
            ui              : 'ProbeViewerWidget',
            allowMagicLens  : false,
            destroy         : () => { this.imageBuilder.destroy(); },
        },
        multiView = {
            name            : 'Multi View',
            renderers       : {},
            queryDataModel  : viewer.queryDataModel,
            ui              : 'MultiViewerWidget',
            allowMagicLens  : false,
            destroy         : () => { while(this.renderers.length) { this.renderers.pop().destroy(); } },
        };

    // Configure single view
    singleView.imageBuilder.setProbeLineNotification(true);
    singleView.imageBuilder.update();

    if(!viewer.config.ensemble) {
        // Configure multi view
        const imageBuilders = [
                new ProberImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager),
                new ProberImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager),
                new ProberImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager),
            ],
            chartPainters = [
                new LineChartPainter('X: {x}'),
                new LineChartPainter('Y: {x}'),
                new LineChartPainter('Z: {x}'),
            ],
            updateProbeLocation = (data, envelope) => {
                imageBuilders.forEach(function(builder) {
                    if(!equals(data, builder.getProbe())) {
                        builder.setProbe(data[0], data[1], data[2])
                    }
                });

                // Update charts
                chartPainters[0].setMarkerLocation(data[0]/(dimensions[0]-1));
                chartPainters[1].setMarkerLocation(data[1]/(dimensions[1]-1));
                chartPainters[2].setMarkerLocation(data[2]/(dimensions[2]-1));
            },
            updateCrosshairVisibility = (data, envelope) => {
                imageBuilders.forEach(function(builder) {
                    builder.setCrossHairEnable(data);
                });
    
                // Update charts
                chartPainters[0].enableMarker(data);
                chartPainters[1].enableMarker(data);
                chartPainters[2].enableMarker(data);
            },
            updateChartPainters = (data, envelope) => {
                if(data.x.fields[0].data.length) {
                    chartPainters[0].updateData(data.x);
                }
                if(data.y.fields[0].data.length) {
                    chartPainters[1].updateData(data.y);
                }
                if(data.z.fields[0].data.length) {
                    chartPainters[2].updateData(data.z);
                }
            };

        // Initialize the Image builders
        const methods = [].concat(singleView.imageBuilder.getRenderMethods());
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
        const names = ['Line Chart X', 'Line Chart Y', 'Line Chart Z'];
        chartPainters.forEach(function(painter) {
            const name = names.shift();
            multiView.renderers[name] = { name, painter };
        })

        // Show the selector UI
        viewer.list = [singleView, multiView];
        viewer.ui = 'ViewerSelector';
        viewer.allowMagicLens = false;
        viewer.onChange = function(idx, list) {
            callback(viewer.list[idx]);
        }
    } else {
        viewer.imageBuilder = singleView.imageBuilder;
        viewer.ui = singleView.ui;
    }

    return true;
}
