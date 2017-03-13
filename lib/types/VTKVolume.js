import contains                             from 'mout/src/array/contains';
import VolumeBuilder                        from 'paraviewweb/src/Rendering/Geometry/VTKVolumeBuilder';
import VTKImageDataModel                    from 'paraviewweb/src/IO/Core/VTKImageDataModel';
import LookupTableManagerWidget             from 'paraviewweb/src/React/CollapsibleControls/LookupTableManagerControl';
import QueryDataModelWithExplorationWidget  from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';
import EqualizerWidget                      from 'paraviewweb/src/React/Widgets/EqualizerWidget';
import CollapsibleWidget                    from 'paraviewweb/src/React/Widgets/CollapsibleWidget';
import EqualizerState                       from 'paraviewweb/src/Common/State/EqualizerState';
import React                                from 'react';

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'vtk-volume')) {
    return false;
  }

  const imageyDataModel = new VTKImageDataModel(basepath);
  const lutMgr = viewer.config.lookupTableManager;
  const equalizer = new EqualizerState({ size: 20 });
  const volumeBuilder = new VolumeBuilder(lutMgr, imageyDataModel, viewer.queryDataModel);

  function updateOpacity() {
    const opacities = equalizer.getOpacities();
    const dataRange = volumeBuilder.getDataRange();
    const pw = volumeBuilder.getPiecewiseFunction();
    const delta = (dataRange[1] - dataRange[0]) / (opacities.length - 1);
    pw.removeAllPoints();
    opacities.forEach((opacity, idx) => {
      pw.addPoint(dataRange[0] + (idx * delta), opacity);
    });
  }

  equalizer.onChange(() => {
    updateOpacity();
    volumeBuilder.render();
  });

  volumeBuilder.onImageReady(() => {
    const dataRange = volumeBuilder.getDataRange();
    updateOpacity();
    volumeBuilder.getLookupTable().setScalarRange(...dataRange);
    volumeBuilder.updateColoring();
  });

  imageyDataModel.setDataManager(viewer.queryDataModel.getDataManager());
  imageyDataModel.setFetchGzip(viewer.queryDataModel.originalData.metadata.fetchGzip);

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
      <EqualizerWidget
        key="Equalizer"
        layers={equalizer.getOpacities()}
        onChange={equalizer.updateOpacities}
        colors={equalizer.getColors()}
        spacing={3}
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
