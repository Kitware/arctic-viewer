# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------
outputDir = '/Users/seb/Desktop/float-image/'
# -----------------------------------------------------------------------------

from paraview import simple
from paraview.web.dataset_builder import *

# -----------------------------------------------------------------------------
# VTK Pipeline creation
# -----------------------------------------------------------------------------

wavelet = simple.Wavelet()
calc = simple.Calculator()
calc.Function = 'coordsX'
calc.ResultArrayName = 'x'
contour = simple.Contour(
    PointMergeMethod="Uniform Binning",
    ComputeScalars = 1,
    ComputeNormals = 1,
    Isosurfaces = 157.09,
    ContourBy = ['POINTS', 'RTData'])
clip = simple.Clip()
clip.ClipType.Normal = [0.0, 0.0, -1.0]

# -----------------------------------------------------------------------------
# Data To Export
# -----------------------------------------------------------------------------

layerMesh = {
    'core1': False,
    'core2': True,
    'core3': True,
    'core4': True,
    'core5': True
}

fields = ['RTData', 'x']
cores = ['core1', 'core2', 'core3', 'core4', 'core5']
isoValues = [ 77.26, 117.18, 157.09, 197.0, 236.92 ]


# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------
db = LayerDataSetBuilder(clip, outputDir, {'type': 'spherical', 'phi': range(-10, 11, 10), 'theta': range(-10, 11, 10)}, [400,400])

# Setup view with camera position
view = db.getView()
simple.Show(wavelet, view)
simple.Render(view)
simple.ResetCamera(view)
simple.Hide(wavelet, view)

db.start()

layerIdx = 0
for layer in cores:
    # Select only one layer
    contour.Isosurfaces = isoValues[layerIdx]

    # Capture each field of each layer
    for field in fields:
        db.setActiveLayer(layer, field, layerMesh[layer])
        db.writeLayerData()

    # Move to the next layer
    layerIdx += 1

db.stop()
