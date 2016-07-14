from paraview.simple import *
from paraview.web.dataset_builder import *

dataset_destination_path = '/tmp/cylinder_v2'

# Initial ParaView scene setup
Cylinder(Resolution = 30, Height = 10.0, Center = (1,2,3))
rep = Show()
view = Render()

view.UseGradientBackground = 1
view.Background = [0.6818646524757763, 0.7232318608377203, 0.9213092240787365]
view.Background2 = [0.16470588235294117, 0.5490196078431373, 0.23529411764705882]

ResetCamera()
view.CenterOfRotation = view.CameraFocalPoint

ColorBy(rep, ('POINTS', 'Normals'))
normalsLUT = GetColorTransferFunction('Normals')
normalsLUT.VectorMode = 'Component'
normalsLUT.VectorComponent = 0

Render()

# Create Tonic Dataset
dsb = ImageDataSetBuilder(dataset_destination_path, 'image/png', {'type': 'cylindrical', 'phi': range(0, 360, 30), 'translation': range(-5, 5, 1)}, {'author': 'Sebastien Jourdain'})
dsb.start(view)
dsb.writeImages()
dsb.stop()
