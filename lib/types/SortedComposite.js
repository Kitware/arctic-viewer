import PipelineModel                    from 'tonic-core/lib/model/PipelineState';
import MultiColorBySortedImageBuilder   from 'tonic-core/lib/builder/image/MultiColorBySortedComposite';
import SortedCompositeImageBuilder      from 'tonic-core/lib/builder/image/SortedComposite';
import contains                         from 'mout/src/array/contains';

export default function build({viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'sorted-composite')) {
        return false;
    }

    if(contains(dataType, 'multi-color-by')) {
        viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData, true);
        viewer.imageBuilder = new MultiColorBySortedImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager, viewer.pipelineModel);
        viewer.imageBuilder.update();
    } else {
        viewer.imageBuilder = new SortedCompositeImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager);
        viewer.imageBuilder.update();
    }

    return true;
}
