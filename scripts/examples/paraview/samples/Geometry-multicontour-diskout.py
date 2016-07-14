# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

outputDir = '/Users/seb/Desktop/Geometry-diskout-multi-contour/'
inputFile = '/Users/seb/Downloads/ParaViewData-3.10.1/Data/disk_out_ref.ex2'

# -----------------------------------------------------------------------------

from paraview import simple
from paraview.web.dataset_builder import *

# -----------------------------------------------------------------------------
# Pipeline creation
# -----------------------------------------------------------------------------

reader = simple.OpenDataFile(inputFile)
reader.PointVariables = ['Temp', 'V', 'Pres', 'AsH3', 'GaMe3', 'CH4', 'H2']

clip = simple.Clip(Input=reader)
clip.ClipType.Normal = [0.0, 1.0, 0.0]

streamLines = simple.StreamTracer(
    Input = reader,
    SeedType="High Resolution Line Source",
    Vectors = ['POINTS', 'V'],
    MaximumStreamlineLength = 20.16)
streamLines.SeedType.Point2 = [5.75, 5.75, 10.15999984741211]
streamLines.SeedType.Point1 = [-5.75, -5.75, -10.0]
streamTubes = simple.Tube(Input=streamLines, Radius = 0.2)

contourFilter = simple.Contour( Input = reader,
                          PointMergeMethod = "Uniform Binning",
                          ContourBy = 'AsH3',
                          Isosurfaces = [0.1],
                          ComputeScalars = 1)

contourValues = [ 0.09 + float(x)*0.01 for x in range(9) ]

sections = {
    "LookupTables": {
        "AsH3": {
          "range": [
            0.0804768,
            0.184839
          ],
          "preset": "wildflower"
        },
        "Pres": {
          "range": [
            0.00678552,
            0.0288185
          ],
          "preset": "cool"
        },
        "Temp": {
          "range": [
            293.15,
            913.15
          ],
          "preset": "spectralflip"
        }
    }
}

sceneDescription = {
    'scene': [
        {
            'name': 'Stream lines',
            'source': streamTubes,
            'colors': {
                'Pres': {'location': 'POINT_DATA' },
                'Temp': {'location': 'POINT_DATA' }
            }
        },{
            'name': 'Clip',
            'source': clip,
            'colors': {
                'Pres': {'location': 'POINT_DATA' },
                'Temp': {'location': 'POINT_DATA' }
            }
        },{
            'name': 'Contour AsH3',
            'source': contourFilter,
            'colors': {
                'AsH3': {'location': 'POINT_DATA' },
                'Pres': {'location': 'POINT_DATA' },
                'Temp': {'location': 'POINT_DATA' }
            }
        }
    ]
}

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
dsb = GeometryDataSetBuilder(outputDir, sceneDescription, sections=sections)


dsb.getDataHandler().registerArgument(priority=1, name='contour', values=contourValues, ui='slider', loop='modulo')
dsb.getDataHandler().registerArgument(priority=2, name='clip', values=range(5), ui='slider', loop='modulo')

dsb.start()
for v in dsb.getDataHandler().clip:
    for c in dsb.getDataHandler().contour:
        clip.ClipType.Origin = [0.0, float(2*v) - 5.0, 0.0]
        contourFilter.Isosurfaces = [ c ]
        dsb.writeData()
dsb.stop()

