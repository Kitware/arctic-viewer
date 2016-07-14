# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/diskout_volume_%s'
file_path = '/Users/seb/Downloads/ParaViewData-3.98.1/Data/disk_out_ref.ex2'

field = 'AsH3'
fieldRange = [0.0805, 0.185]
nbSteps = 20

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

reader = vtkExodusIIReader()
reader.SetFileName(file_path)
reader.SetPointResultArrayStatus(field, 1)
reader.SetElementBlockArrayStatus('Unnamed block ID: 1 Type: HEX8', 1)

# disk_out_ref_ex2 = simple.ExodusIIReader( FileName=['/Users/seb/Downloads/ParaViewData-3.98.1/Data/disk_out_ref.ex2'] )

# disk_out_ref_ex2.FileRange = [0, 0]
# disk_out_ref_ex2.XMLFileName = '/Users/seb/Downloads/ParaViewData-3.98.1/Data/artifact.dta'
# disk_out_ref_ex2.FilePrefix = '/Users/seb/Downloads/ParaViewData-3.98.1/Data/disk_out_ref.ex2'
# disk_out_ref_ex2.ModeShape = 0
# disk_out_ref_ex2.FilePattern = '%s'

# disk_out_ref_ex2.ElementBlocks = ['Unnamed block ID: 1 Type: HEX8']
# disk_out_ref_ex2.NodeSetArrayStatus = []
# disk_out_ref_ex2.SideSetArrayStatus = []
# disk_out_ref_ex2.PointVariables = ['Temp', 'V', 'Pres', 'AsH3', 'GaMe3', 'CH4', 'H2']
reader.Update()
print reader.GetOutput()


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
vcdsb = SortedCompositeDataSetBuilder(dataset_destination_path % nbSteps, {'type': 'spherical', 'phi': range(0, 360, 30), 'theta': range(-60, 61, 15)})

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


