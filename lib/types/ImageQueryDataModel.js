import QueryDataModelImageBuilder from 'paraviewweb/src/Rendering/Image/QueryDataModelImageBuilder';
import contains                   from 'mout/src/array/contains';

export default function build({ viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'tonic-query-data-model') || dataType.length > 1) {
    return false;
  }

  viewer.imageBuilder = new QueryDataModelImageBuilder(viewer.queryDataModel);
  viewer.imageBuilder.update();

  return true;
}
