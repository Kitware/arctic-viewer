# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/vtk_cone'

# -----------------------------------------------------------------------------

from vtk import *
from vtk.web.dataset_builder import *

# -----------------------------------------------------------------------------
# VTK Pipeline creation
# -----------------------------------------------------------------------------

source = vtkConeSource()

mapper = vtkDataSetMapper()
mapper.SetInputConnection(source.GetOutputPort())

actor = vtkActor()
actor.SetMapper(mapper)

window = vtkRenderWindow()
window.SetSize(500, 500)

renderer = vtkRenderer()
window.AddRenderer(renderer)

renderer.AddActor(actor)
renderer.SetBackground(0.5, 0.5, 0.6)

camera = vtkCamera()
renderer.SetActiveCamera(camera)

window.Render()
renderer.ResetCamera()
window.Render()

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
dsb = ImageDataSetBuilder(dataset_destination_path, 'image/jpg', {'type': 'spherical', 'phi': range(0, 360, 30), 'theta': range(-60, 61, 30)})

# Add resolution information
dsb.getDataHandler().registerArgument(priority=1, name='resolution', values=range(10, 61, 10), ui='slider')

# Loop over data and generate images
dsb.start(window, renderer)
for resolution in dsb.getDataHandler().resolution:
    source.SetResolution(resolution)
    dsb.writeImages()
dsb.stop()
