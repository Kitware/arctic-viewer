import FloatDataImageBuilder   from 'paraviewweb/src/Rendering/Image/FloatDataImageBuilder';
import FloatTimeDataImageBuilder from 'paraviewweb/src/Rendering/Image/FloatTimeDataImageBuilder';
import { TimeProbeManager } from 'paraviewweb/src/Common/Misc/TimeProbeManager';

import contains from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'float-image')) {
    return false;
  }

  const timeSize = viewer.queryDataModel.getSize('time');
  if (viewer.queryDataModel.originalData.FloatImage.layers.length > 1 || !timeSize || timeSize < 2) {
    return false;
  }

  // No Magic Lens for us
  viewer.allowMagicLens = false;

  const floatImageBuilder = new FloatDataImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager);
  const probeManager = new TimeProbeManager();
  const imageBuilder = new FloatTimeDataImageBuilder(floatImageBuilder, probeManager);

  // Single view
  viewer.imageBuilder = imageBuilder;

  return true;
}
