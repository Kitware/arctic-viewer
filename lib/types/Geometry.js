var React = require('react'),
    QueryDataModelWithExplorationWidget = require('tonic-ui/lib/react/widget/ParameterSet/QueryDataModelWithExplorationWidget'),
    GeometryDataModel = require('tonic-io/lib/GeometryDataModel'),
    GeometryBuilder = require('tonic-core/lib/builder/geometry/Three'),
    CollapsibleElement = require('tonic-ui/lib/react/widget/CollapsibleElement'),
    CompositeControl = require('tonic-ui/lib/react/widget/CompositeControl'),
    LookupTableManagerWidget = require('tonic-ui/lib/react/widget/LookupTable/LookupTableManagerWidget'),
    CompositePipelineModel = require('tonic-core/lib/model/PipelineState'),
    contains = require('mout/src/array/contains');

export default function build({basepath, viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'geometry')) {
        return false;
    }

    var pipelineModel = new CompositePipelineModel(viewer.queryDataModel.originalData),
        geometryDataModel = new GeometryDataModel(basepath),
        lutMgr = viewer.config.lookupTableManager;

    viewer.ui = 'GeometryViewer';
    viewer.allowMagicLens = false;
    viewer.geometryBuilder = new GeometryBuilder(lutMgr, geometryDataModel, pipelineModel, viewer.queryDataModel);

    viewer.menuAddOn = [
        (<LookupTableManagerWidget
                        key='LookupTableManagerWidget'
                        field={ lutMgr.getActiveField() }
                        lookupTableManager={ lutMgr }
                    />),
        (<CollapsibleElement title="Pipeline" key='CompositeControl_parent'>
                <CompositeControl
                        key='CompositeControl'
                        model={ pipelineModel }
                    />
                </CollapsibleElement>),
        (<QueryDataModelWithExplorationWidget
            key='QueryDataModel'
            handleExploration={true}
            model={viewer.queryDataModel}/>)
    ];

    return true;
}
