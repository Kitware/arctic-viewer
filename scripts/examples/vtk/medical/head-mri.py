# -----------------------------------------------------------------------------
# Download data:
#  - Browser:
#      http://midas3.kitware.com/midas/folder/10409 => VisibleMale/vm_head_mri.mha
#  - Terminal
#      curl "http://midas3.kitware.com/midas/download?folders=&items=235237" -o vm_head_mri.mha
# -----------------------------------------------------------------------------

from vtk import *

from vtk.web.query_data_model import *
from vtk.web.dataset_builder import *

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/head_mri'
file_path = '/Users/seb/Downloads/vm_head_mri.mha'

field = 'MetaImage'
fieldRange = [0.0, 1134.0]
nbSteps = 25

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

reader = vtkMetaImageReader()
reader.SetFileName(file_path)

mapper = vtkGPUVolumeRayCastMapper()
mapper.SetInputConnection(reader.GetOutputPort())
mapper.RenderToImageOn()

colorFunction = vtkColorTransferFunction()
colorFunction.AddRGBPoint(fieldRange[0], 1.0, 1.0, 1.0)
colorFunction.AddRGBPoint(fieldRange[1], 1.0, 1.0, 1.0)

halfSpread = (fieldRange[1] - fieldRange[0]) / float(2*nbSteps)
centers = [ fieldRange[0] + halfSpread*float(2*i+1) for i in range(nbSteps)]

scalarOpacity = vtkPiecewiseFunction()

volumeProperty = vtkVolumeProperty()
volumeProperty.ShadeOn()
volumeProperty.SetInterpolationType(VTK_LINEAR_INTERPOLATION)
volumeProperty.SetColor(colorFunction)
volumeProperty.SetScalarOpacity(scalarOpacity)

volume = vtkVolume()
volume.SetMapper(mapper)
volume.SetProperty(volumeProperty)

window = vtkRenderWindow()
window.SetSize(512, 512)

renderer = vtkRenderer()
window.AddRenderer(renderer)

renderer.AddVolume(volume)
renderer.ResetCamera()
window.Render()

# Camera setting
camera = {
    'position': [-0.508, -872.745, 5.1],
    'focalPoint': [-0.508, -32.108, 5.1],
    'viewUp': [0,0,1]
}

update_camera(renderer, camera)

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
vcdsb = SortedCompositeDataSetBuilder(dataset_destination_path, {'type': 'spherical', 'phi': range(0, 360, 45), 'theta': [0]})

idx = 0
vcdsb.start(window, renderer)
for center in centers:
    idx += 1
    updatePieceWise(scalarOpacity, fieldRange, center, halfSpread)

    # Capture layer
    vcdsb.activateLayer(field, center)

    # Write data
    vcdsb.writeData(mapper)

vcdsb.stop()


