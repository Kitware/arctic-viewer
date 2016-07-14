from paraview import simple

from paraview.web.dataset_builder import *

dataset_destination_path = '/Users/seb/Desktop/mpi-sphere'

sphere = simple.Sphere()

rep = simple.Show()
simple.ColorBy(rep, ('POINTS', 'vtkProcessId'))

view = simple.Render()
view.ResetCamera()

rep.RescaleTransferFunctionToDataRange(True)

phi = range(0,360,10)
theta = range(-60, 61, 10)
dh = ImageDataSetBuilder(dataset_destination_path, 'image/jpg', {'type': 'spherical', 'phi': phi, 'theta': theta})

dh.start(view)
dh.writeImages()
dh.stop()
