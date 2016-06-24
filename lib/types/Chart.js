import contains                             from 'mout/src/array/contains';
import ChartBuilder                         from 'paraviewweb/src/Rendering/Chart/PlotlyChartBuilder';

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'chart')) {
    return false;
  }

  viewer.ui = 'ChartViewer';
  viewer.allowMagicLens = false;
  viewer.chartBuilder = new ChartBuilder(viewer.queryDataModel);

  viewer.queryDataModel.fetchData();

  return true;
}
