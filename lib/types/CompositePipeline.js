import PipelineModel            from 'tonic-core/lib/model/PipelineState';
import CompositeImageBuilder    from 'tonic-core/lib/builder/image/Composite';
import contains                 from 'mout/src/array/contains';

export default function build({viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'composite-pipeline')) {
        return false;
    }

    viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
    viewer.imageBuilder = new CompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel);
    viewer.imageBuilder.update();

    return true;
}
