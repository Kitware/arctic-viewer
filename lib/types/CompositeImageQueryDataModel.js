import CollapsibleElement         from 'tonic-ui/lib/react/widget/CollapsibleElement';
import CompositeControl           from 'tonic-ui/lib/react/widget/CompositeControl';
import contains                   from 'mout/src/array/contains';
import PipelineModel              from 'tonic-core/lib/model/PipelineState';
import QueryDataModelImageBuilder from 'tonic-core/lib/builder/image/QueryDataModel';
import React                      from 'react';

export default function build({viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'tonic-query-data-model') && !contains(dataType, 'composite-pipeline-image')) {
        return false;
    }

    viewer.pipelineModel = new PipelineModel(viewer.queryDataModel.originalData);
    viewer.imageBuilder = new QueryDataModelImageBuilder(viewer.queryDataModel);

    viewer.pipelineModel.onChange(function(pipeline){
        viewer.queryDataModel.setValue('pipeline', pipeline);
        viewer.imageBuilder.update();
    });
    viewer.queryDataModel.setValue('pipeline', viewer.pipelineModel.getPipelineQuery());

    viewer.menuAddOn = [
        (<CollapsibleElement title="Pipeline" key='CompositeControl_parent'>
            <CompositeControl
                key='CompositeControl'
                model={ viewer.pipelineModel }
            />
        </CollapsibleElement>),
    ];
    viewer.imageBuilder.update();

    return true;
}
