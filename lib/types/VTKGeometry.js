import CollapsibleElement                   from 'paraviewweb/src/React/Widgets/CollapsibleWidget';
import CompositeControl                     from 'paraviewweb/src/React/Widgets/CompositePipelineWidget';
import CompositePipelineModel               from 'paraviewweb/src/Common/State/PipelineState';
import contains                             from 'mout/src/array/contains';
import GeometryBuilder                      from 'paraviewweb/src/Rendering/Geometry/VTKGeometryBuilder';
import GeometryDataModel                    from 'paraviewweb/src/IO/Core/VTKGeometryDataModel';
import LookupTableManagerWidget             from 'paraviewweb/src/React/CollapsibleControls/LookupTableManagerControl';
import QueryDataModelWithExplorationWidget  from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';
import React                                from 'react';

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'vtk-geometry')) {
    return false;
  }

  const pipelineModel = new CompositePipelineModel(viewer.queryDataModel.originalData);
  const geometryDataModel = new GeometryDataModel(basepath);
  const lutMgr = viewer.config.lookupTableManager;

  geometryDataModel.setDataManager(viewer.queryDataModel.getDataManager());

  viewer.ui = 'GeometryViewer';
  viewer.allowMagicLens = false;
  viewer.geometryBuilder = new GeometryBuilder(lutMgr, geometryDataModel, pipelineModel, viewer.queryDataModel);
  viewer.menuAddOn = [
    (<LookupTableManagerWidget
      key="LookupTableManagerWidget"
      field={lutMgr.getActiveField()}
      lookupTableManager={lutMgr}
    />),
    (<CollapsibleElement title="Pipeline" key="CompositeControl_parent">
      <CompositeControl
        key="CompositeControl"
        model={pipelineModel}
      />
    </CollapsibleElement>),
    (<QueryDataModelWithExplorationWidget
      key="QueryDataModel"
      handleExploration
      model={viewer.queryDataModel}
    />),
  ];

  return true;
}
