# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

outputDir = '/Users/seb/Desktop/diskout-composite-with-normal/'
inputFile = '/Users/seb/Downloads/ParaViewData-3.10.1/Data/disk_out_ref.ex2'

phi   = range(0, 360, 30)
theta = range(-60, 61, 30)

AsH3_range = [0.0804768, 0.184839]
Temp_range = [293.15, 913.15]
Pres_range = [0.00678552, 0.0288185]
V_range    = [0.0, 1.0]
Vorticity_range  = [0.0, 1.0]

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
clipSurface = simple.ExtractSurface(Input=clip)
clipWithNormals = simple.GenerateSurfaceNormals(Input=clipSurface)

streamLines = simple.StreamTracer(
    Input = reader,
    SeedType="High Resolution Line Source",
    Vectors = ['POINTS', 'V'],
    MaximumStreamlineLength = 20.16)
streamLines.SeedType.Point2 = [5.75, 5.75, 10.15999984741211]
streamLines.SeedType.Point1 = [-5.75, -5.75, -10.0]
streamTubes = simple.Tube(Input=streamLines, Radius = 0.2)
streamSurface = simple.ExtractSurface(Input=streamTubes)
streamWithNormals = simple.GenerateSurfaceNormals(Input=streamSurface)

sceneDescription = {
    'size': [500, 500],
    'light': [ 'intensity', 'normal' ], # 'normal'
    'camera': {
        'CameraViewUp': [0.0, 0.0, 1.0],
        'CameraPosition': [0.0, -58.47, 0.07],
        'CameraFocalPoint': [0.0, 0.0, 0.07]
    },
    'scene': [
        {
            'name': 'Stream lines',
            'source': streamWithNormals,
            'colors': {
                'Pres': {'location': 'POINT_DATA', 'range': Pres_range },
                'Temp': {'location': 'POINT_DATA', 'range': Temp_range }
            }
        },{
            'name': 'Clip',
            'source': clipWithNormals,
            'colors': {
                'Pres': {'location': 'POINT_DATA', 'range': Pres_range },
                'Temp': {'location': 'POINT_DATA', 'range': Temp_range }
            }
        },{
            'parent': 'Contours',
            'name': 'AsH3 0.1',
            'source': simple.Contour(
                            Input = reader,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'AsH3',
                            Isosurfaces = [0.1],
                            ComputeScalars = 1),
            'colors': {
                'AsH3': {'constant': 0.1 },
                'Pres': {'location': 'POINT_DATA', 'range': Pres_range },
                'Temp': {'location': 'POINT_DATA', 'range': Temp_range }
            }
        },{
            'parent': 'Contours',
            'name': 'AsH3 0.14',
            'source': simple.Contour(
                            Input = reader,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'AsH3',
                            Isosurfaces = [0.14],
                            ComputeScalars = 1),
            'colors': {
                'AsH3': {'constant': 0.14 },
                'Pres': {'location': 'POINT_DATA', 'range': Pres_range },
                'Temp': {'location': 'POINT_DATA', 'range': Temp_range }
            }
        },{
            'parent': 'Contours',
            'name': 'AsH3 0.18',
            'source': simple.Contour(
                            Input = reader,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'AsH3',
                            Isosurfaces = [0.18],
                            ComputeScalars = 1),
            'colors': {
                'AsH3': {'constant': 0.18 },
                'Pres': {'location': 'POINT_DATA', 'range': Pres_range },
                'Temp': {'location': 'POINT_DATA', 'range': Temp_range }
            }
        }
    ]
}

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
dsb = CompositeDataSetBuilder(outputDir, sceneDescription, {'type': 'spherical', 'phi': phi, 'theta': theta})

dsb.start()
dsb.writeData()
dsb.stop()

