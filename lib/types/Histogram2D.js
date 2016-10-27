import Histogram2DImageBuilder  from 'paraviewweb/src/Rendering/Image/Histogram2DImageBuilder';
import contains                 from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'histogram2D')) {
    return false;
  }

  viewer.imageBuilder = new Histogram2DImageBuilder(viewer.queryDataModel);
  viewer.imageBuilder.update();

  return true;
}
