import FloatDataImageBuilder     from 'paraviewweb/src/Rendering/Image/FloatDataImageBuilder';
import FloatTimeDataImageBuilder from 'paraviewweb/src/Rendering/Image/FloatTimeDataImageBuilder';
import GenericViewer             from 'paraviewweb/src/React/Viewers/ImageBuilderViewer';
import OverlayWindow             from 'paraviewweb/src/React/Containers/OverlayWindow';
import PlotlyRenderer            from 'paraviewweb/src/React/Renderers/PlotlyRenderer';
import palettes                  from 'paraviewweb/src/Common/Misc/ColorPalettes';
import React                     from 'react';
import { TimeProbeManager }      from 'paraviewweb/src/Common/Misc/TimeProbeManager';

import contains from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'float-image')) {
    return false;
  }

  let colors = palettes.Paired;
  const configJson = viewer.queryDataModel.originalData;
  if (configJson.metadata
    && configJson.metadata.probePalette
    && configJson.metadata.probePalette in palettes) {
    colors = palettes[configJson.metadata.probePalette];
  }

  const timeSize = viewer.queryDataModel.getSize('time');
  if (viewer.queryDataModel.originalData.FloatImage.layers.length > 1 || !timeSize || timeSize < 2) {
    return false;
  }

  // No Magic Lens for us
  viewer.allowMagicLens = false;

  let listenerForData = null;

  function createFakeBuilder() {
    let traces = [];
    let hoverList = [];

    const triggerPlotUpdate = () => {
      if (listenerForData) {
        listenerForData({
          forceNewPlot: false,
          traces,
          hoverList,
        });
      }
    };

    const setBackgroundColor = () => {};

    const setMarkerLocation = loc => {
      if (listenerForData) {
        // Plotly just wants the point index, so we convert back to that
        const timeIdx = loc * (viewer.queryDataModel.getSize('time') - 1);
        hoverList.forEach(item => {
          item.pointNumber = timeIdx;
        });
        listenerForData({
          forceNewPlot: false,
          traces,
          hover: {
            enable: true,
            hoverList,
          },
        });
      }
    };

    const isReady = () => false; // So that we never trigger painting
    const paint = () => {};

    const updateData = data => {
      // Assign color if no color
      let colorIdx = 0;
      data.fields.forEach((field) => {
        if (!field.color) {
          field.color = colors[colorIdx++ % colors.length];
        }
      });

      traces = [];
      hoverList = [];

      data.fields.forEach((field) => {
        const fieldData = field.data;
        const plotData = {
          /* eslint-disable prefer-spread */
          x: Array.apply(null, { length: fieldData.length }).map(Number.call, Number), // [1, 2, 3, 4, 5],
          /* eslint-enable prefer-spread */
          y: fieldData,
          name: field.name,
          line: { color: field.color },
          type: 'scatter',
          text: [],   // suppress some labelling on markers
        };
        traces.push(plotData);
        hoverList.push({ curveNumber: traces.length - 1 });
      });
      triggerPlotUpdate();
    };

    const onDataReady = callback => {
      listenerForData = callback;
      return null;
    };

    return {
      setBackgroundColor,
      setMarkerLocation,
      isReady,
      paint,
      updateData,
      onDataReady,
    };
  }

  const fakePainterAndChartBuilder = createFakeBuilder();
  const floatImageBuilder = new FloatDataImageBuilder(viewer.queryDataModel, viewer.config.lookupTableManager);
  const probeManager = new TimeProbeManager();
  const imageBuilder = new FloatTimeDataImageBuilder(floatImageBuilder, probeManager, fakePainterAndChartBuilder);

  imageBuilder.onModelChange(() => {
    // rerender
    viewer.instance.forceUpdate();
  });

  function resize(w, h, overlayWindow) {
    if (viewer.instance) {
      viewer.instance.plotly.updateDimensions();
    }
  }

  const Component = React.createClass({
    displayName: 'MainContainer',

    propTypes: {
      chartBuilder: React.PropTypes.object,
      imageBuilder: React.PropTypes.object,
      queryDataModel: React.PropTypes.object,
      chartVisible: React.PropTypes.bool,
    },

    render() {
      return (
        <div>
          <OverlayWindow
            title="Time Probe Chart" width={500} height={250} x={100} y={100}
            titleBarHeight={20} marginSize={5} hotCornerExtra={4}
            minContentWidth={200} minContentHeight={100} onResize={resize}
            visible={!!this.props.imageBuilder.getActiveView()}
          >
            <PlotlyRenderer chartBuilder={this.props.chartBuilder} ref={c => { this.plotly = c; }} />
          </OverlayWindow>
          <GenericViewer imageBuilder={this.props.imageBuilder} queryDataModel={this.props.queryDataModel} />
        </div>);
    },
  });

  viewer.ui = 'ReactComponent';
  viewer.component = (
    <Component
      imageBuilder={imageBuilder}
      queryDataModel={viewer.queryDataModel}
      chartBuilder={fakePainterAndChartBuilder}
    />);

  // Make sure we trigger a render when the UI is mounted
  setImmediate(() => {
    imageBuilder.update();
  });

  return true;
}
