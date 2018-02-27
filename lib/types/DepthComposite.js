import PipelineModel from 'paraviewweb/src/Common/State/PipelineState';
import DepthCompositeImageBuilder from 'paraviewweb/src/Rendering/Image/DepthCompositeImageBuilder';
import contains from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (
    !contains(dataType, 'webgl-composite') &&
    !contains(dataType, 'depth-composite')
  ) {
    return false;
  }

  viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
  viewer.imageBuilder = new DepthCompositeImageBuilder(
    viewer.queryDataModel,
    viewer.pipelineModel,
    viewer.config.lookupTableManager
  );
  viewer.imageBuilder.update();

  return true;
}
