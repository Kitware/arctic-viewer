var // Core elements
    PipelineModel      = require('tonic-image-builder/lib/model/PipelineState'),

    // Image builder
    DepthCompositeImageBuilder = require('tonic-image-builder/lib/builder/DepthComposite'),

    // External dependencies
    contains = require('mout/src/array/contains');

export default function build({viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'webgl-composite') && !contains(dataType, 'depth-composite')) {
        return false;
    }

    viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
    viewer.imageBuilder = new DepthCompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel, viewer.config.lookupTableManager);
    viewer.imageBuilder.update();

    return true;
}
