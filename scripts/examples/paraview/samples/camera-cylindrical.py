from paraview.simple import *

from vtk.web.query_data_model import *
from paraview.web import camera as pv

dataset_destination_path = '/tmp/cylinder'

# Initial ParaView scene setup
Cylinder(Resolution = 30, Height = 10.0, Center = (1,2,3))
rep = Show()
view = Render()

ResetCamera()
view.CenterOfRotation = view.CameraFocalPoint

ColorBy(rep, ('POINTS', 'Normals'))
normalsLUT = GetColorTransferFunction('Normals')
normalsLUT.VectorMode = 'Component'
normalsLUT.VectorComponent = 0

Render()

# Choose data location
dh = DataHandler(dataset_destination_path)
camera = pv.create_cylindrical_camera(view, dh, range(0, 360, 30), range(-5, 5, 1))

# Create data
dh.registerData(name='image', type='blob', mimeType='image/png', fileName='.png')

# Loop over data
for pos in camera:
    pv.update_camera(view, pos)
    WriteImage(dh.getDataAbsoluteFilePath('image'))

# Write metadata
dh.writeDataDescriptor()
