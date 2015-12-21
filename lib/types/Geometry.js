import CollapsibleElement                   from 'tonic-ui/lib/react/widget/CollapsibleElement';
import CompositeControl                     from 'tonic-ui/lib/react/widget/CompositeControl';
import CompositePipelineModel               from 'tonic-core/lib/model/PipelineState';
import contains                             from 'mout/src/array/contains';
import GeometryBuilder                      from 'tonic-core/lib/builder/geometry/Three';
import GeometryDataModel                    from 'tonic-io/lib/GeometryDataModel';
import LookupTableManagerWidget             from 'tonic-ui/lib/react/widget/LookupTable/LookupTableManagerWidget';
import QueryDataModelWithExplorationWidget  from 'tonic-ui/lib/react/widget/ParameterSet/QueryDataModelWithExplorationWidget';
import React                                from 'react';

export default function build({basepath, viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'geometry')) {
        return false;
    }

    const pipelineModel = new CompositePipelineModel(viewer.queryDataModel.originalData),
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
            model={viewer.queryDataModel}/>),
    ];

    return true;
}
