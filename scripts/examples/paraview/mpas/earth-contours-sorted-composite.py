# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

outputDir = '/Users/seb/Desktop/mpas-contours-sorted-composite'
inputFile = '/Volumes/Kitware/Data/DataExploration/Data/MPAS/data/xyz_n_primal/X_Y_Z_NLAYER-primal_%d_0.vtu'
earthCore = '/Volumes/Kitware/Data/vtk/mpas/earth/earth-ok.vtk'

# outputDir = '/Volumes/KSW-Data/tonic/mpas-contours-sorted-composite/'
# inputFile = '/Volumes/KSW-Data/Data/DataExploration/Data/MPAS/data/xyz_n_primal/X_Y_Z_NLAYER-primal_%d_0.vtu'
# earthCore = '/Volumes/KSW-Data/Data/vtk/mpas/earth/earth-ok.vtk'

phi   = range(0, 360, 30)
theta = range(-60, 61, 30)
time  = range(50, 5151, 50)

dataRanges = {
    'bottomDepth': [-9753, 5984],
    'salinity': [24.8574, 37.4595],
    'temperature': [-1.64296, 28.6918]
}

sections = {
    'LookupTables': {
        "bottomDepth": { "preset": "earth"},
        "temperature": { "preset": "ocean", "range": [5, 30]},
        "salinity"   : { "preset": "yellow2brown", "range": [34, 38]}
    }
}

# -----------------------------------------------------------------------------

from paraview import simple
from paraview.web.dataset_builder import *

# -----------------------------------------------------------------------------
# Pipeline creation
# -----------------------------------------------------------------------------

core = simple.OpenDataFile(earthCore)
coreSurface = simple.ExtractSurface(Input=core)
coreWithNormals = simple.GenerateSurfaceNormals(Input=coreSurface)

reader = simple.OpenDataFile(inputFile % time[0])
reader.CellArrayStatus = ['temperature', 'salinity']

dataCleanUp  = simple.Threshold(Input = reader, Scalars = ['CELLS', 'temperature'], ThresholdRange = [-1000.0, 50.0])
dataToPoints = simple.CellDatatoPointData(Input = dataCleanUp)

sceneDescription = {
    'size': [500, 500],
    'light': [ 'intensity', 'normal' ],
    'camera': {
        'CameraViewUp': [0.0, 0.0, 1.0],
        'CameraPosition': [107823.5, -28000000, -44044.25],
        'CameraFocalPoint': [107823.5, -7766.0, -44044.25]
    },
    'scene': [
        {
            'name': 'Earth',
            'source': coreWithNormals,
            'colors': {
                'bottomDepth': {'location': 'POINT_DATA', 'range': dataRanges['bottomDepth'] }
            }
        },{
            'parent': 'Temperatures',
            'name': '5C',
            'source': simple.Contour(
                            Input = dataToPoints,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'temperature',
                            Isosurfaces = [5.0]),
            'colors': {
                'temperature': {'constant': 5.0 },
                'salinity': {'location': 'POINT_DATA', 'range': dataRanges['salinity'] }
            }
        },{
            'parent': 'Temperatures',
            'name': '10C',
            'source': simple.Contour(
                            Input = dataToPoints,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'temperature',
                            Isosurfaces = [10.0]),
            'colors': {
                'temperature': {'constant': 10.0 },
                'salinity': {'location': 'POINT_DATA', 'range': dataRanges['salinity'] }
            }
        },{
            'parent': 'Temperatures',
            'name': '15C',
            'source': simple.Contour(
                            Input = dataToPoints,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'temperature',
                            Isosurfaces = [15.0]),
            'colors': {
                'temperature': {'constant': 15.0 },
                'salinity': {'location': 'POINT_DATA', 'range': dataRanges['salinity'] }
            }
        },{
            'parent': 'Temperatures',
            'name': '20C',
            'source': simple.Contour(
                            Input = dataToPoints,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'temperature',
                            Isosurfaces = [20.0]),
            'colors': {
                'temperature': {'constant': 20.0 },
                'salinity': {'location': 'POINT_DATA', 'range': dataRanges['salinity'] }
            }
        },{
            'parent': 'Temperatures',
            'name': '25C',
            'source': simple.Contour(
                            Input = dataToPoints,
                            PointMergeMethod = "Uniform Binning",
                            ContourBy = 'temperature',
                            Isosurfaces = [25.0]),
            'colors': {
                'temperature': {'constant': 25.0 },
                'salinity': {'location': 'POINT_DATA', 'range': dataRanges['salinity'] }
            }
        }
    ]
}

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

# Create Image Builder
dsb = CompositeDataSetBuilder(outputDir, sceneDescription, {'type': 'spherical', 'phi': phi, 'theta': theta}, sections=sections)

# Add time information
dsb.getDataHandler().registerArgument(priority=1, name='time', values=time, ui='slider', loop='modulo')

dsb.start()
for t in dsb.getDataHandler().time:
    reader.FileName = inputFile % t
    dsb.writeData()
dsb.stop()

