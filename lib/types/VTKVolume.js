import contains                             from 'mout/src/array/contains';
import VolumeBuilder                        from 'paraviewweb/src/Rendering/Geometry/VTKVolumeBuilder';
import VTKImageDataModel                    from 'paraviewweb/src/IO/Core/VTKImageDataModel';
import LookupTableManagerWidget             from 'paraviewweb/src/React/CollapsibleControls/LookupTableManagerControl';
import QueryDataModelWithExplorationWidget  from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';
import PieceWiseFunctionEditorWidget        from 'paraviewweb/src/React/Widgets/PieceWiseFunctionEditorWidget';
import CollapsibleWidget                    from 'paraviewweb/src/React/Widgets/CollapsibleWidget';
import { debounce }                         from 'paraviewweb/src/Common/Misc/Debounce';
import React                                from 'react';

class PiecewiseWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };

    // Bind methods
    this.onChange = this.onChange.bind(this);
    this.updateVolumeBuilder = debounce(this.updateVolumeBuilder.bind(this), 250);

    // Handle initialization
    const volumeBuilder = this.props.volumeBuilder;
    this.subscription = volumeBuilder.onImageReady(() => {
      const metadata = volumeBuilder.queryDataModel.originalData.metadata;
      if (metadata && metadata.piecewise) {
        const points = [];
        const dataRange = volumeBuilder.getDataRange() || [0, 255];
        const scale = (dataRange[1] - dataRange[0]);
        metadata.piecewise.forEach((node) => {
          points.push({
            x: (node[0] - dataRange[0]) / scale,
            y: node[1],
          });
        });
        this.setState({ points }, this.updateVolumeBuilder);
      }
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  onChange(points) {
    this.setState({ points }, this.updateVolumeBuilder);
  }

  updateVolumeBuilder() {
    const points = this.state.points;
    const volumeBuilder = this.props.volumeBuilder;
    if (volumeBuilder && volumeBuilder.getDataRange()) {
      const dataRange = volumeBuilder.getDataRange() || [0, 255];
      const pw = volumeBuilder.getPiecewiseFunction();
      const scale = (dataRange[1] - dataRange[0]);
      pw.removeAllPoints();
      points.forEach(({ x, y }) => {
        pw.addPoint(dataRange[0] + (x * scale), y);
      });
      volumeBuilder.render();
    }
  }

  render() {
    const dataRange = this.props.volumeBuilder.getDataRange() || [0, 255];
    return (
      <PieceWiseFunctionEditorWidget
        ref={c => (this.pwf = c)}
        points={this.state.points}
        rangeMin={dataRange[0]}
        rangeMax={dataRange[1]}
        onChange={this.onChange}
        height={150}
        width={262}
        visible
      />);
  }
}

PiecewiseWidget.propTypes = {
  volumeBuilder: React.PropTypes.object,
};

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'vtk-volume')) {
    return false;
  }

  const imageyDataModel = new VTKImageDataModel(basepath);
  imageyDataModel.setDataManager(viewer.queryDataModel.getDataManager());

  const lutMgr = viewer.config.lookupTableManager;
  const volumeBuilder = new VolumeBuilder(lutMgr, imageyDataModel, viewer.queryDataModel);

  volumeBuilder.onImageReady(() => {
    const dataRange = volumeBuilder.getDataRange();
    volumeBuilder.getLookupTable().setScalarRange(...dataRange);
    volumeBuilder.updateColoring();
  });

  imageyDataModel.setDataManager(viewer.queryDataModel.getDataManager());
  imageyDataModel.setFetchGzip(!!viewer.queryDataModel.originalData.metadata.fetchGzip);

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
