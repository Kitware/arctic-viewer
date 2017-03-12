import contains                             from 'mout/src/array/contains';
import VolumeBuilder                        from 'paraviewweb/src/Rendering/Geometry/VTKVolumeBuilder';
import VTKImageDataModel                    from 'paraviewweb/src/IO/Core/VTKImageDataModel';
import LookupTableManagerWidget             from 'paraviewweb/src/React/CollapsibleControls/LookupTableManagerControl';
import QueryDataModelWithExplorationWidget  from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';
import React                                from 'react';

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'vtk-volume')) {
    return false;
  }

  const imageyDataModel = new VTKImageDataModel(basepath);
  const lutMgr = viewer.config.lookupTableManager;

  imageyDataModel.setDataManager(viewer.queryDataModel.getDataManager());
  imageyDataModel.setFetchGzip(viewer.queryDataModel.originalData.metadata.fetchGzip);

  viewer.ui = 'GeometryViewer';
  viewer.allowMagicLens = false;
  viewer.geometryBuilder = new VolumeBuilder(lutMgr, imageyDataModel, viewer.queryDataModel);
  viewer.menuAddOn = [
    (<LookupTableManagerWidget
      key="LookupTableManagerWidget"
      field={lutMgr.getActiveField()}
      lookupTableManager={lutMgr}
    />),
    (<QueryDataModelWithExplorationWidget
      key="QueryDataModel"
      handleExploration
      model={viewer.queryDataModel}
    />),
  ];

  return true;
}
