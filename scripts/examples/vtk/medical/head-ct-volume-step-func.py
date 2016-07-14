# -----------------------------------------------------------------------------
# Download data:
#  - Browser:
#      http://midas3.kitware.com/midas/folder/10409 => VisibleMale/vm_head_frozenct.mha
#  - Terminal
#      curl "http://midas3.kitware.com/midas/download?folders=&items=235235" -o vm_head_frozenct.mha
# -----------------------------------------------------------------------------

from vtk import *

from vtk.web.query_data_model import *
from vtk.web.dataset_builder import *

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/head_ct_4_features'
file_path = '/Users/seb/Downloads/vm_head_frozenct.mha'

field = 'MetaImage'
fieldRange = [0.0, 4095.0]
features = [
    (100, 800),   # Fluid  450   => 0.10
    (900, 1250),  # Skin  1075   => 0.26
    (1400, 2525), # Skull 1962.5 => 0.47
    (2525, 4000)  # Teeth 3262.5 => 0.79
]

sections = {
    'LookupTables': {
        "VolumeScalar": {
            "controlpoints": [
                {"x": 0.00, "r":  0.5, "g":  0.5, "b":  0.5}, # Fluid
                {"x": 0.11, "r":  0.5, "g":  0.5, "b":  0.5}, # Fluid
                {"x": 0.12, "r":  1.0, "g":  0.8, "b":  0.4}, # Skin
                {"x": 0.27, "r":  1.0, "g":  0.8, "b":  0.4}, # Skin
                {"x": 0.28, "r":  1.0, "g":  1.0, "b":  1.0}, # Skull
                {"x": 0.48, "r":  1.0, "g":  1.0, "b":  1.0}, # Skull
                {"x": 0.49, "r":  1.0, "g":  0.8, "b":  0.6}, # Teeth
                {"x": 1.00, "r":  1.0, "g":  0.8, "b":  0.6}  # Teeth
            ],
            "discrete" : True
        }
    }
}

# -----------------------------------------------------------------------------
# VTK Helper methods
# -----------------------------------------------------------------------------

def updatePieceWiseAsStep(pwf, dataRange, start, end):
    scalarOpacity.RemoveAllPoints()

    scalarOpacity.AddPoint(dataRange[0], 0.0)
    scalarOpacity.AddPoint(start-1, 0.0)
    scalarOpacity.AddPoint(start, 1.0)
    scalarOpacity.AddPoint(end, 1.0)
    scalarOpacity.AddPoint(end+1, 0.0)
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
    'position': [-0.264, -890.168, -135.0],
    'focalPoint': [-0.264, -30.264, -135.0],
    'viewUp': [0,0,1]
}
update_camera(renderer, camera)

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
phi = range(0, 360, 30)
theta = range(-60, 61, 30)
vcdsb = SortedCompositeDataSetBuilder(dataset_destination_path, {'type': 'spherical', 'phi': phi, 'theta': theta}, sections=sections)

idx = 0
vcdsb.start(window, renderer)
for feature in features:
    idx += 1
    updatePieceWiseAsStep(scalarOpacity, fieldRange, feature[0], feature[1])

    # Capture layer
    vcdsb.activateLayer(field, (feature[0] + feature[1])/2)

    # Write data
    vcdsb.writeData(mapper)

vcdsb.stop()


