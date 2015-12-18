import QueryDataModel       from 'tonic-io/lib/QueryDataModel';
import LookupTableManager   from 'tonic-core/lib/model/LookupTable/LookupTableManager';
import contains             from 'mout/src/array/contains';

import ViewerA from './CompositeImageQueryDataModel';
import ViewerB from './CompositePipeline';
import ViewerC from './DataProber';
import ViewerD from './DepthComposite';
import ViewerE from './FloatImage';
import ViewerF from './Geometry';
import ViewerG from './ImageQueryDataModel';
import ViewerH from './SortedComposite';

const
    dataViewers = [
        ViewerA,
        ViewerB,
        ViewerC,
        ViewerD,
        ViewerE,
        ViewerF,
        ViewerG,
        ViewerH,
    ],
    lookupTableManager = new LookupTableManager();

export default function build(basepath, data, config, callback) {
    // Initializer shared variables
    config.lookupTableManager = lookupTableManager;

    var dataType = data.type,
        foundViewer = false,
        viewerCount = dataViewers.length,
        viewer = { ui: 'GenericViewer', config, allowMagicLens: true };

    // Update background if available
    if(data && data.metadata && data.metadata.backgroundColor) {
        viewer.bgColor = data.metadata.backgroundColor;
    }

    // Update QueryDataModel if needed
    if(contains(dataType, 'tonic-query-data-model')) {
        viewer.queryDataModel = config.queryDataModel || new QueryDataModel(data, basepath);
    }

    // Find the right viewer and build it
    var args = { basepath, data, callback, viewer, dataType };
    while(viewerCount-- && !foundViewer) {
        foundViewer = dataViewers[viewerCount](args);
    }

    setImmediate( () => callback(viewer));
    return foundViewer;
}
