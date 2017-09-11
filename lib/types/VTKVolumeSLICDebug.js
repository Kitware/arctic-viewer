import Monologue from 'monologue.js';

import contains                             from 'mout/src/array/contains';

import QueryDataModelWithExplorationWidget  from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';

import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import vtkDataArray               from 'vtk.js/Sources/Common/Core/DataArray';
import vtkCellArray               from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData                from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource              from 'vtk.js/Sources/Filters/Sources/CubeSource';

import React from 'react';

const IMAGE_READY_TOPIC = 'image-ready';

class ClusterSurfaceDataModel {
  constructor(queryDataModel, delta = 1.0) {
    this.queryDataModel = queryDataModel;
    this.initActions = [];
    this.count = 0;
    this.polydata = vtkPolyData.newInstance();
    this.mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      useLookupTableScalarRange: true,
    });
    this.actor = vtkActor.newInstance();
    this.mapper.setInputData(this.polydata);
    this.actor.setMapper(this.mapper);
    this.delta = queryDataModel.originalData.SLIC.delta || delta;

    this.lut = this.mapper.getLookupTable();
    this.lut.setHueRange(0.666, 0);
    this.min = Number.MAX_VALUE;
    this.max = -Number.MAX_VALUE;

    // Scene management
    // VTK renderWindow/renderer
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);

    queryDataModel.onDataChange((data, envelope) => {
      if (data.clusters) {
        this.updatePolyData(new Float32Array(data.clusters.data));
        this.render();
      }
    });

    // Add bounding box
    const [xLength, yLength, zLength] = queryDataModel.originalData.SLIC.dimensions;
    const boundingBox = vtkCubeSource.newInstance({ xLength, yLength, zLength, center: [xLength / 2, yLength / 2, zLength / 2] });
    const m = vtkMapper.newInstance();
    const a = vtkActor.newInstance();
    m.setInputConnection(boundingBox.getOutputPort());
    a.setMapper(m);
    a.getProperty().set({ opacity: 0.2 });
    this.renderer.addActor(a);
  }

  resetCamera() {
    this.renderer.resetCamera();
    this.renderWindow.render();
  }

  render() {
    this.renderer.resetCameraClippingRange();
    this.renderWindow.render();
  }

  updateSize(width, height) {
    this.openGlRenderWindow.setSize(width, height);
    this.renderWindow.render();
  }

  onImageReady(callback) {
    return this.on(IMAGE_READY_TOPIC, callback);
  }

  updatePolyData(clusterBuffer) {
    this.count += 1;
    const dataSize = clusterBuffer.length;
    const nbPoints = (dataSize / 7) * 6;
    const dataValues = new Float32Array(nbPoints);
    const cells = new Uint32Array(nbPoints * 10);
    const pointsValues = new Float32Array(nbPoints * 3);

    console.log('updatePolyData', nbPoints, clusterBuffer);

    let offset = 0;
    let cellOffset = 0;
    for (let i = 0; i < dataSize; i += 7) {
      const center = [clusterBuffer[i], clusterBuffer[i + 1], clusterBuffer[i + 2]];
      center[1] += this.delta;
      // 0:(0, 1, 0)
      pointsValues[(offset * 3)] = center[0];
      pointsValues[(offset * 3) + 1] = center[1];
      pointsValues[(offset * 3) + 2] = center[2];
      dataValues[offset] = clusterBuffer[i + 3] + (this.delta * clusterBuffer[i + 5]);
      this.min = Math.min(this.min, dataValues[offset]);
      this.max = Math.max(this.max, dataValues[offset]);
      offset += 1;
      center[0] += this.delta;
      center[1] -= this.delta;
      // 1:(1, 0, 0)
      pointsValues[(offset * 3)] = center[0];
      pointsValues[(offset * 3) + 1] = center[1];
      pointsValues[(offset * 3) + 2] = center[2];
      dataValues[offset] = clusterBuffer[i + 3] + (this.delta * clusterBuffer[i + 4]);
      this.min = Math.min(this.min, dataValues[offset]);
      this.max = Math.max(this.max, dataValues[offset]);
      offset += 1;
      center[0] -= this.delta;
      center[1] -= this.delta;
      // 2:(0, -1, 0)
      pointsValues[(offset * 3)] = center[0];
      pointsValues[(offset * 3) + 1] = center[1];
      pointsValues[(offset * 3) + 2] = center[2];
      dataValues[offset] = clusterBuffer[i + 3] - (this.delta * clusterBuffer[i + 5]);
      this.min = Math.min(this.min, dataValues[offset]);
      this.max = Math.max(this.max, dataValues[offset]);
      offset += 1;
      center[0] -= this.delta;
      center[1] += this.delta;
      // 3:(-1, 0, 0)
      pointsValues[(offset * 3)] = center[0];
      pointsValues[(offset * 3) + 1] = center[1];
      pointsValues[(offset * 3) + 2] = center[2];
      dataValues[offset] = clusterBuffer[i + 3] - (this.delta * clusterBuffer[i + 4]);
      this.min = Math.min(this.min, dataValues[offset]);
      this.max = Math.max(this.max, dataValues[offset]);
      offset += 1;
      center[0] += this.delta;
      center[2] += this.delta;
      // 4:(0, 1, 0)
      pointsValues[(offset * 3)] = center[0];
      pointsValues[(offset * 3) + 1] = center[1];
      pointsValues[(offset * 3) + 2] = center[2];
      dataValues[offset] = clusterBuffer[i + 3] + (this.delta * clusterBuffer[i + 6]);
      this.min = Math.min(this.min, dataValues[offset]);
      this.max = Math.max(this.max, dataValues[offset]);
      offset += 1;
      center[2] -= 2 * this.delta;
      // 5:(0, -1, 0)
      pointsValues[(offset * 3)] = center[0];
      pointsValues[(offset * 3) + 1] = center[1];
      pointsValues[(offset * 3) + 2] = center[2];
      dataValues[offset] = clusterBuffer[i + 3] - (this.delta * clusterBuffer[i + 6]);
      this.min = Math.min(this.min, dataValues[offset]);
      this.max = Math.max(this.max, dataValues[offset]);
      offset += 1;

      // cells
      cells[cellOffset] = 4;
      cells[cellOffset + 1] = offset - 6;
      cells[cellOffset + 2] = offset - 5;
      cells[cellOffset + 3] = offset - 4;
      cells[cellOffset + 4] = offset - 3;
      cells[cellOffset + 5] = 4;
      cells[cellOffset + 6] = offset - 6;
      cells[cellOffset + 7] = offset - 2;
      cells[cellOffset + 8] = offset - 4;
      cells[cellOffset + 9] = offset - 1;
      cellOffset += 10;
    }

    // Update polydata
    // - points
    this.polydata.getPoints().setData(pointsValues, 3);

    // - cells
    if (!this.polydata.getPolys()) {
      console.log('create cells');
      this.polydata.setPolys(vtkCellArray.newInstance());
    }
    this.polydata.getPolys().setData(cells);

    // - scalars
    if (!this.polydata.getPointData().getScalars()) {
      const scalars = vtkDataArray.newInstance({ name: 'scalars', values: dataValues });
      this.polydata.getPointData().setScalars(scalars);
    } else {
      this.polydata.getPointData().getScalars().setData(dataValues);
    }

    this.polydata.modified();
    console.log('bu', this.polydata.getBounds());

    if (this.count === 1) {
      this.renderer.addActor(this.actor);
      this.renderer.resetCamera();
      this.renderer.updateLightsGeometryToFollowCamera();
      this.initActions.forEach(cb => cb());
    }

    this.lut.setRange(this.min, this.max);

    this.emit(IMAGE_READY_TOPIC, this.count === 1);
  }

  addInitializationAction(initCallback) {
    this.initActions.push(initCallback);
  }

  clearInitializationActions() {
    this.initActions = [];
  }

  configureRenderer(canvas) {
    // OpenGlRenderWindow
    this.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.openGlRenderWindow.setCanvas(canvas);
    this.renderWindow.addView(this.openGlRenderWindow);

    // Interactor
    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.interactor.setView(this.openGlRenderWindow);
    this.interactor.initialize();
    this.interactor.bindEvents(canvas);

    // Create a render() method that can be called from anywhere
    this.render = this.renderWindow.render;

    this.queryDataModel.fetchData();
  }
}

Monologue.mixInto(ClusterSurfaceDataModel);

export default function build({ basepath, viewer, dataType }) {
  // Can we handle the data
  if (!contains(dataType, 'vtk-slic-volume-debug')) {
    return false;
  }

  const surfaceClusters = new ClusterSurfaceDataModel(viewer.queryDataModel, 2);

  viewer.ui = 'GeometryViewer';
  viewer.allowMagicLens = false;
  viewer.geometryBuilder = surfaceClusters;
  viewer.menuAddOn = [
    (<QueryDataModelWithExplorationWidget
      key="QueryDataModel"
      handleExploration
      model={viewer.queryDataModel}
    />),
  ];

  return true;
}
