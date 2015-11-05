var React = require('react'),
    QueryDataModelWithExplorationWidget = require('tonic-widgets/lib/react/widget/ParameterSet/QueryDataModelWithExplorationWidget'),
    GeometryDataModel = require('tonic-geometry-data-model'),
    contains = require('mout/src/array/contains');

export default function build({basepath, viewer, dataType}) {
    // Can we handle the data
    if(!contains(dataType, 'geometry')) {
        return false;
    }

    viewer.ui = 'GeometryViewer';
    viewer.allowMagicLens = false;
    viewer.geometryBuilder = new GeometryDataModel(basepath);
    viewer.queryDataModel.onDataChange( (data, envelope) => {
        if(data.scene) {
            viewer.geometryBuilder.loadScene(data.scene.data);
        }
    });
    viewer.queryDataModel.fetchData();

    viewer.menuAddOn = [
        (<QueryDataModelWithExplorationWidget
            key='QueryDataModel'
            handleExploration={true}
            model={viewer.queryDataModel}/>)
    ];

    return true;
}
