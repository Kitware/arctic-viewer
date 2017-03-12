import QueryDataModel       from 'paraviewweb/src/IO/Core/QueryDataModel';
import LookupTableManager   from 'paraviewweb/src/Common/Core/LookupTableManager';
import contains             from 'mout/src/array/contains';

import ViewerA from './Chart';
import ViewerB from './CompositeImageQueryDataModel';
import ViewerC from './CompositePipeline';
import ViewerD from './DataProber';
import ViewerE from './DepthComposite';
import ViewerF from './FloatImage';
import ViewerG from './Geometry';
import ViewerH from './ImageQueryDataModel';
import ViewerI from './SortedComposite';
import ViewerJ from './TimeFloatImage';
import ViewerK from './Histogram2D';
import ViewerL from './Histogram2DPlotly';
import ViewerM from './VTKGeometry';
import ViewerN from './VTKVolume';

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
  ViewerJ,
  ViewerK,
  ViewerL,
  ViewerM,
  ViewerN,
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
  while (viewerCount && !foundViewer) {
    viewerCount -= 1;
    foundViewer = dataViewers[viewerCount](args);
  }

  setImmediate(() => callback(viewer));
  return foundViewer;
}
