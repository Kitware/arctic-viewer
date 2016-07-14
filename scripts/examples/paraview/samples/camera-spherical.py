from paraview.simple import *

from vtk.web.query_data_model import *
from paraview.web import camera as pv

dataset_destination_path = '/tmp/spherical'

# Initial ParaView scene setup
Cone()
Show()
view = Render()

# Choose data location
dh = DataHandler(dataset_destination_path)
camera = pv.create_spherical_camera(view, dh, range(0, 360, 30), range(-60, 61, 30))

# Create data
dh.registerData(name='image', type='blob', mimeType='image/png', fileName='.png')

# Loop over data
for pos in camera:
    pv.update_camera(view, pos)
    WriteImage(dh.getDataAbsoluteFilePath('image'))

# Write metadata
dh.writeDataDescriptor()
