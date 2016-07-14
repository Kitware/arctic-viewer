# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/vtk_volume_v2'

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

imageWriter = vtkPNGWriter()

def writeDepthMap(imageData, path):
    width = imageData.GetDimensions()[0]
    height = imageData.GetDimensions()[1]
    nbTuples = width * height

    inputArray = imageData.GetPointData().GetArray(0)
    array = bytearray(nbTuples)

    for idx in range(inputArray.GetNumberOfTuples()):
        array[idx] = 255 - int(inputArray.GetValue(idx))

    with open(path, 'wb') as f:
        f.write(array)

def writeColorMap(imageData, path):
    imageWriter.SetInputData(imageData)
    imageWriter.SetFileName(path)
    imageWriter.Write()

# -----------------------------------------------------------------------------
# VTK Pipeline creation
# -----------------------------------------------------------------------------

source = vtkRTAnalyticSource()

mapper = vtkGPUVolumeRayCastMapper()
mapper.SetInputConnection(source.GetOutputPort())
mapper.RenderToImageOn()

colorFunction = vtkColorTransferFunction()
colorFunction.AddRGBPoint(37.35310363769531, 0.231373, 0.298039, 0.752941)
colorFunction.AddRGBPoint(157.0909652709961, 0.865003, 0.865003, 0.865003)
colorFunction.AddRGBPoint(276.8288269042969, 0.705882, 0.0156863, 0.14902)

dataRange = [37.3, 276.8]
nbSteps = 10
halfSpread = (dataRange[1] - dataRange[0]) / float(2*nbSteps)
centers = [ dataRange[0] + halfSpread*float(2*i+1) for i in range(nbSteps)]

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
renderer.SetBackground(0.5, 0.5, 0.6)
window.AddRenderer(renderer)

renderer.AddVolume(volume)
renderer.ResetCamera()
window.Render()

colorMap = vtkImageData()
depthMap = vtkImageData()

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
dsb = ImageDataSetBuilder(dataset_destination_path, 'image/png', {'type': 'spherical', 'phi': range(0, 360, 30), 'theta': range(-60, 61, 30)})

# Add PieceWise navigation
dsb.getDataHandler().registerArgument(priority=1, name='pwf', label='Transfer function', values=centers, ui='slider')

# Add Depth data
dsb.getDataHandler().registerData(name='depth', type='array', fileName='_depth.uint8', metadata={ 'dimensions': window.GetSize() })

# Loop over data and generate images
dsb.start(window, renderer)
for center in dsb.getDataHandler().pwf:
    updatePieceWise(scalarOpacity, dataRange, center, halfSpread)
    for camera in dsb.getCamera():
        dsb.updateCamera(camera)

        mapper.GetColorImage(colorMap)
        writeColorMap(colorMap, dsb.getDataHandler().getDataAbsoluteFilePath('image'))

        mapper.GetDepthImage(depthMap)
        writeDepthMap(depthMap, dsb.getDataHandler().getDataAbsoluteFilePath('depth'))
dsb.stop()
