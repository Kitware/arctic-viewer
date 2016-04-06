import PipelineModel            from 'paraviewweb/src/Common/State/PipelineState';
import CompositeImageBuilder    from 'paraviewweb/src/Rendering/Image/CompositeImageBuilder';
import contains                 from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'composite-pipeline')) {
    return false;
  }

  viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
  viewer.imageBuilder = new CompositeImageBuilder(viewer.queryDataModel, viewer.pipelineModel);
  viewer.imageBuilder.update();

  return true;
}
