import PipelineModel from 'paraviewweb/src/Common/State/PipelineState';
import MultiColorBySortedImageBuilder from 'paraviewweb/src/Rendering/Image/MultiColorBySortedCompositeImageBuilder';
import SortedCompositeImageBuilder from 'paraviewweb/src/Rendering/Image/SortedCompositeImageBuilder';
import contains from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'sorted-composite')) {
    return false;
  }

  if (contains(dataType, 'multi-color-by')) {
    viewer.pipelineModel = new PipelineModel(
      viewer.queryDataModel.originalData,
      true
    );
    viewer.imageBuilder = new MultiColorBySortedImageBuilder(
      viewer.queryDataModel,
      viewer.config.lookupTableManager,
      viewer.pipelineModel
    );
    viewer.imageBuilder.update();
  } else {
    viewer.imageBuilder = new SortedCompositeImageBuilder(
      viewer.queryDataModel,
      viewer.config.lookupTableManager
    );
    viewer.imageBuilder.update();
  }

  return true;
}
