import QueryDataModel       from 'paraviewweb/src/IO/Core/QueryDataModel';
import LookupTableManager   from 'paraviewweb/src/Common/Core/LookupTableManager';
import contains             from 'mout/src/array/contains';

import ViewerA from './CompositeImageQueryDataModel';
import ViewerB from './CompositePipeline';
import ViewerC from './DataProber';
import ViewerD from './DepthComposite';
import ViewerE from './FloatImage';
import ViewerF from './Geometry';
import ViewerG from './ImageQueryDataModel';
import ViewerH from './SortedComposite';
import ViewerI from './TimeFloatImage';

const dataViewers = [
  ViewerA,
  ViewerB,
  ViewerC,
  ViewerD,
  ViewerE,
  ViewerF,
  ViewerG,
  ViewerH,
  ViewerI,
];

const lookupTableManager = new LookupTableManager();

export default function build(basepath, data, config, callback) {
  var foundViewer = false;
  var viewerCount = dataViewers.length;

  const dataType = data.type;
  const viewer = {
    ui: 'GenericViewer',
    config,
    allowMagicLens: true,
  };

  // Initializer shared variables
  config.lookupTableManager = lookupTableManager;

  // Update background if available
  if (data && data.metadata && data.metadata.backgroundColor) {
    viewer.bgColor = data.metadata.backgroundColor;
  }

  // Update QueryDataModel if needed
  if (contains(dataType, 'tonic-query-data-model')) {
    viewer.queryDataModel = config.queryDataModel || new QueryDataModel(data, basepath);
  }

  // Find the right viewer and build it
  const args = { basepath, data, callback, viewer, dataType };
  while (viewerCount-- && !foundViewer) {
    foundViewer = dataViewers[viewerCount](args);
  }

  setImmediate(() => callback(viewer));
  return foundViewer;
}
