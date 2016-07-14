# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/wavelet_%s'

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
colorFunction.AddRGBPoint(37.35310363769531, 1.0, 1.0, 1.0)
colorFunction.AddRGBPoint(276.8288269042969, 1.0, 1.0, 1.0)

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
vcdsb = SortedCompositeDataSetBuilder(dataset_destination_path % nbSteps, {'type': 'spherical', 'phi': range(0, 360, 30), 'theta': range(-60, 61, 60)})

idx = 0
vcdsb.start(window, renderer)
for center in centers:
    idx += 1
    updatePieceWise(scalarOpacity, dataRange, center, halfSpread)

    # Capture layer
    vcdsb.activateLayer('RTData', center)

    # Write data
    vcdsb.writeData(mapper)

vcdsb.stop()



