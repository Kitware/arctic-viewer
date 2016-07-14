# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

outputDir = '/Users/seb/Desktop/FloatImage-diskout/'
inputFile = '/Users/seb/Downloads/ParaViewData-3.10.1/Data/disk_out_ref.ex2'

# -----------------------------------------------------------------------------

from paraview import simple
from paraview.web.dataset_builder import *

# -----------------------------------------------------------------------------
# Pipeline creation
# -----------------------------------------------------------------------------

variables = ['Temp', 'V', 'Pres', 'AsH3', 'GaMe3', 'CH4', 'H2']

reader = simple.OpenDataFile(inputFile)
reader.PointVariables = variables

clip = simple.Clip(Input=reader, Crinkleclip=1)
clip.ClipType.Normal = [0.0, 1.0, 0.0]

contourA = simple.Contour( Input = reader,
                           PointMergeMethod = "Uniform Binning",
                           ContourBy = 'AsH3',
                           Isosurfaces = [0.1],
                           ComputeScalars = 1)

contourB = simple.Contour( Input = reader,
                           PointMergeMethod = "Uniform Binning",
                           ContourBy = 'AsH3',
                           Isosurfaces = [0.14],
                           ComputeScalars = 1)

# -----------------------------------------------------------------------------
# Data To Export
# -----------------------------------------------------------------------------

layerFields = {
    'clip': variables,
    'contour_0.1': variables,
    'contour_0.14': variables
}

layerMesh = {
    'clip': True,
    'contour_0.1': True,
    'contour_0.14': True,
}

layerSource = {
    'clip': clip,
    'contour_0.1': contourA,
    'contour_0.14': contourB
}

layerList = ['clip', 'contour_0.1', 'contour_0.14']

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------
db = LayerDataSetBuilder(reader, outputDir, {'type': 'spherical', 'phi': range(-10, 11, 10), 'theta': range(-10, 11, 10)}, [400,630])

# Setup view with camera position
view = db.getView()
view.CenterOfRotation = [0.0, 2.875, 0.08]
view.CameraViewUp = [0.0, 0.0, 1.0]
view.CameraFocalPoint = [0.0, 2.875, 0.08]
view.CameraPosition = [0.0, -43.317, 0.08]

db.start()

for layerName in layerList:
    # Capture each field of each layer
    for field in layerFields[layerName]:
        db.setActiveLayer(layerName, field, layerMesh[layerName], layerSource[layerName])
        db.writeLayerData()

db.stop()
