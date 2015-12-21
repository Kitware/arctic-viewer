import FloatImageImageBuilder   from 'tonic-core/lib/builder/image/FloatImage';
import LineChartPainter         from 'tonic-core/lib/painter/LineChart';
import contains                 from 'mout/src/array/contains';

export default function build({viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'float-image')) {
        return false;
    }

    // No Magic Lens for us
    viewer.allowMagicLens = false;

    // Create ImageBuilder + Line Chart for time probe
    const imageBuilder = new FloatImageImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager);
    const timeSize = viewer.queryDataModel.getSize('time');
    imageBuilder.update();

    // If time available provide a chart painter
    if(timeSize && timeSize > 1 && !contains(dataType, 'single-view') && !viewer.config.SingleView) {
        let timeArray = null;
        const chartPainter = new LineChartPainter('');
        viewer.renderers = {
            '3D View':   { builder: imageBuilder, name: '3D View'},
            'Time data': { painter: chartPainter, name: 'Time data'},
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

    return true;
}
