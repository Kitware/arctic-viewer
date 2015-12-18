import PipelineModel                from 'tonic-core/lib/model/PipelineState';
import DepthCompositeImageBuilder   from 'tonic-core/lib/builder/image/DepthComposite';
import contains                     from 'mout/src/array/contains';

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
