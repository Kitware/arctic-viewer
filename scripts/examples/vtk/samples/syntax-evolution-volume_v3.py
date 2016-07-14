# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/vtk_volume_v3'

# -----------------------------------------------------------------------------

from vtk import *
from vtk.web.dataset_builder import *

# -----------------------------------------------------------------------------
# VTK Helper methods
# -----------------------------------------------------------------------------

def updatePieceWise(pwf, dataRange, center, halfSpread):
    scalarOpacity.RemoveAllPoints()
    if (center - halfSpread) <= dataRange[0]:
        scalarOpacity.AddPoint(dataRange[0], 0.0)
        scalarOpacity.AddPoint(center, 1.0)
    else:
        scalarOpacity.AddPoint(dataRange[0], 0.0)
        scalarOpacity.AddPoint(center - halfSpread, 0.0)
        scalarOpacity.AddPoint(center, 1.0)

    if (center + halfSpread) >= dataRange[1]:
        scalarOpacity.AddPoint(dataRange[1], 0.0)
    else:
        scalarOpacity.AddPoint(center + halfSpread, 0.0)
        scalarOpacity.AddPoint(dataRange[1], 0.0)

# -----------------------------------------------------------------------------
# VTK Pipeline creation
# -----------------------------------------------------------------------------

source = vtkRTAnalyticSource()

mapper = vtkGPUVolumeRayCastMapper()
mapper.SetInputConnection(source.GetOutputPort())
mapper.RenderToImageOn()

colorFunction = vtkColorTransferFunction()
colorFunction.AddRGBPoint(37.35310363769531, 0.231373, 0.298039, 0.752941)
colorFunction.AddRGBPoint(157.0909652709961, 0.865003, 0.865003, 0.865003)
colorFunction.AddRGBPoint(276.8288269042969, 0.705882, 0.0156863, 0.14902)

dataRange = [37.3, 276.8]
nbSteps = 5
halfSpread = (dataRange[1] - dataRange[0]) / float(2*nbSteps)
centers = [ dataRange[0] + halfSpread*float(2*i+1) for i in range(nbSteps)]

scalarOpacity = vtkPiecewiseFunction()

volumeProperty = vtkVolumeProperty()
# volumeProperty.ShadeOn()
volumeProperty.SetInterpolationType(VTK_LINEAR_INTERPOLATION)
volumeProperty.SetColor(colorFunction)
volumeProperty.SetScalarOpacity(scalarOpacity)

volume = vtkVolume()
volume.SetMapper(mapper)
volume.SetProperty(volumeProperty)

window = vtkRenderWindow()
window.SetSize(500, 500)

renderer = vtkRenderer()
renderer.SetBackground(0.5, 0.5, 0.6)
window.AddRenderer(renderer)

renderer.AddVolume(volume)
renderer.ResetCamera()
window.Render()

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
vcdsb = VolumeCompositeDataSetBuilder(dataset_destination_path, 'image/png', {'type': 'spherical', 'phi': [0, 90], 'theta': [0]})

idx = 0
vcdsb.start(window, renderer)
for center in centers:
    idx += 1
    updatePieceWise(scalarOpacity, dataRange, center, halfSpread)

    # Capture layer
    vcdsb.activateLayer('Volumes', 'volume_%d' % idx, 'RTData')

    # Write data
    vcdsb.writeData(mapper)

vcdsb.stop()



