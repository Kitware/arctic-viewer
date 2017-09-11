import contains                             from 'mout/src/array/contains';
import VolumeBuilder                        from 'paraviewweb/src/Rendering/Geometry/VTKVolumeBuilder';
import VTKSLICDataModel                     from 'paraviewweb/src/IO/Core/VTKSLICDataModel';
import LookupTableManagerWidget             from 'paraviewweb/src/React/CollapsibleControls/LookupTableManagerControl';
import QueryDataModelWithExplorationWidget  from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';
import CollapsibleWidget                    from 'paraviewweb/src/React/Widgets/CollapsibleWidget';
import React                                from 'react';
import { PiecewiseWidget }                  from './VTKVolume';

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'vtk-slic-volume')) {
    return false;
  }

  const imageDataModel = new VTKSLICDataModel();

  const lutMgr = viewer.config.lookupTableManager;
  const volumeBuilder = new VolumeBuilder(lutMgr, imageDataModel, viewer.queryDataModel);

  volumeBuilder.onImageReady(() => {
    const dataRange = volumeBuilder.getDataRange();
    volumeBuilder.getLookupTable().setScalarRange(...dataRange);
    volumeBuilder.updateColoring();
  });

  viewer.ui = 'GeometryViewer';
  viewer.allowMagicLens = false;
  viewer.geometryBuilder = volumeBuilder;
  viewer.menuAddOn = [
    (<LookupTableManagerWidget
      key="LookupTableManagerWidget"
      field={lutMgr.getActiveField()}
      lookupTableManager={lutMgr}
    />),
    (<CollapsibleWidget title="Opacity Control" key="OpacityControl">
      <PiecewiseWidget
        key="pwf-editor"
        volumeBuilder={viewer.geometryBuilder}
      />
    </CollapsibleWidget>),
    (<QueryDataModelWithExplorationWidget
      key="QueryDataModel"
      handleExploration
      model={viewer.queryDataModel}
    />),
  ];

  return true;
}
