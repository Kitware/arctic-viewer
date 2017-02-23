# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

outputDir = '/Users/seb/Desktop/Geometry-can/'
inputFile = '/Users/seb/Downloads/data/can.ex2'

# -----------------------------------------------------------------------------

from paraview import simple
from paraview.web.dataset_builder import *

# -----------------------------------------------------------------------------
# Pipeline creation
# -----------------------------------------------------------------------------

can = simple.OpenDataFile(inputFile)
can.ElementVariables = ['EQPS']
can.PointVariables = ['DISPL', 'VEL', 'ACCL']
can.GlobalVariables = ['KE', 'XMOM', 'YMOM', 'ZMOM', 'NSTEPS', 'TMSTEP']
can.ElementBlocks = ['Unnamed block ID: 1 Type: HEX', 'Unnamed block ID: 2 Type: HEX']

anim = simple.GetAnimationScene()
anim.UpdateAnimationUsingDataTimeSteps()

timeValues = anim.TimeKeeper.TimestepValues

sceneDescription = {
    'scene': [
        {
            'name': 'Can',
            'source': can,
            'colors': {
                'DISPL': {'location': 'POINT_DATA' },
                'VEL': {'location': 'POINT_DATA' },
                'ACCL': {'location': 'POINT_DATA' },
                'time': {'location': 'POINT_DATA', 'constant': 5 }
            }
        }
    ]
}

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
dsb = VTKGeometryDataSetBuilder(outputDir, sceneDescription)

# Add time information
dsb.getDataHandler().registerArgument(priority=1, name='time', values=timeValues, ui='slider', loop='modulo')

dsb.start()
for time in dsb.getDataHandler().time:
    anim.TimeKeeper.Time = time
    sceneDescription['scene'][0]['colors']['time']['constant'] = time;
    dsb.writeData(time)
dsb.stop()
