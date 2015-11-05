var QueryDataModel = require('tonic-query-data-model/lib/QueryDataModel'),
    LookupTableManager = require('tonic-image-builder/lib/model/LookupTable/LookupTableManager'),
    contains = require('mout/src/array/contains'),
    dataViewers = [
        require('./CompositeImageQueryDataModel'),
        require('./CompositePipeline'),
        require('./DataProber'),
        require('./DepthComposite'),
        require('./FloatImage'),
        require('./Geometry'),
        require('./ImageQueryDataModel'),
        require('./SortedComposite'),
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
