# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/spheres_%s'
vti_sphere_path = '/Users/seb/Downloads/spheres.vti'

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

reader = vtkXMLImageDataReader()
reader.SetFileName(vti_sphere_path)
# reader.SetPointArrayStatus('ImageFile', 1)
# reader.Update()

mapper = vtkGPUVolumeRayCastMapper()
mapper.SetInputConnection(reader.GetOutputPort())
mapper.RenderToImageOn()

colorFunction = vtkColorTransferFunction()
colorFunction.AddRGBPoint(0.0, 1.0, 1.0, 1.0)
colorFunction.AddRGBPoint(255.0, 1.0, 1.0, 1.0)

dataRange = [0.0, 255.0]
nbSteps = 10
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
window.AddRenderer(renderer)

renderer.AddVolume(volume)
renderer.ResetCamera()
window.Render()

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
vcdsb = SortedCompositeDataSetBuilder(dataset_destination_path % nbSteps, {'type': 'spherical', 'phi': range(0, 360, 30), 'theta': range(-60, 61, 30)})

idx = 0
vcdsb.start(window, renderer)
for center in centers:
    idx += 1
    updatePieceWise(scalarOpacity, dataRange, center, halfSpread)

    # Capture layer
    vcdsb.activateLayer('ImageFile', center)

    # Write data
    vcdsb.writeData(mapper)

vcdsb.stop()


