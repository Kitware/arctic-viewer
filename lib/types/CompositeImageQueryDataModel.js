var // Core elements
    PipelineModel = require('tonic-image-builder/lib/model/PipelineState'),

    // Image builder
    QueryDataModelImageBuilder = require('tonic-image-builder/lib/builder/QueryDataModel'),

    // Inline React widgets
    CollapsibleElement = require('tonic-widgets/lib/react/widget/CollapsibleElement'),
    CompositeControl = require('tonic-widgets/lib/react/widget/CompositeControl'),

    // External dependencies
    React = require('react'),
    ReactDOM = require('react-dom'),
    contains = require('mout/src/array/contains');

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
        </CollapsibleElement>)
    ];
    viewer.imageBuilder.update();

    return true;
}
