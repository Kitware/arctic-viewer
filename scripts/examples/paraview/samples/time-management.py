from paraview.simple import *
from paraview.web.dataset_builder import *

# Can.ex2 file path
fileToLoad = '/Users/seb/Downloads/ParaViewData-3.10.1/Data/can.ex2'
dataset_destination_path = '/tmp/can'

# Initial ParaView scene setup
can = OpenDataFile(fileToLoad)
can.ElementVariables = ['EQPS']
can.PointVariables = ['DISPL', 'VEL', 'ACCL']
can.GlobalVariables = ['KE', 'XMOM', 'YMOM', 'ZMOM', 'NSTEPS', 'TMSTEP']
can.ElementBlocks = ['Unnamed block ID: 1 Type: HEX', 'Unnamed block ID: 2 Type: HEX']

rep = Show()
view = Render()

anim = GetAnimationScene()
anim.UpdateAnimationUsingDataTimeSteps()
anim.GoToLast()

ColorBy(rep, ('POINTS', 'DISPL'))
rep.RescaleTransferFunctionToDataRange(True)

timeValues = anim.TimeKeeper.TimestepValues

view.CameraPosition = [-18.29191376466667, 21.185677224902403, -45.68993692892029]
view.CameraFocalPoint = [-0.5119223594665527, 3.3483874797821045, -11.321756362915039]
view.CameraViewUp = [0.29015080553622485, -0.779749133967588, -0.5548006832399148]

view.ResetCamera()
view.CenterOfRotation = view.CameraFocalPoint
Render()

# Create Tonic Dataset
dsb = ImageDataSetBuilder(dataset_destination_path, 'image/jpg', {'type': 'spherical', 'phi': range(0, 360, 45), 'theta': range(-60, 61, 30)})

# Add time information
dsb.getDataHandler().registerArgument(priority=1, name='time', values=timeValues, ui='slider', loop='modulo')

# Explore dataset
dsb.start(view)
for time in dsb.getDataHandler().time:
    anim.TimeKeeper.Time = time
    dsb.writeImages()
dsb.stop()
