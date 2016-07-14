# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/mpas_flat_earth_prober'
source_filename = '/Volumes/Kitware/Data/DataExploration/Data/MPAS/data/flat_n_primal/LON_LAT_NLAYER-primal_%d_0.vtu'
# dataset_destination_path = '/Volumes/KSW-Data/mpas_flat_earth_prober-raw'
# source_filename          = '/Volumes/KSW-Data/Data/DataExploration/Data/MPAS/data/flat_n_primal/LON_LAT_NLAYER-primal_%d_0.vtu'

all_time_serie = range(50, 5151, 50)
quick_time_serie = range(100, 5151, 200)
single_time_serie = [ 50 ]

time_serie = quick_time_serie

sampling_arrays = ['temperature', 'salinity']
sampling_size   = [ 500, 250, 30 ]
sampling_bounds = [ -3.2, 3.2,
                    -1.3, 1.5,
                    -3.0, 0.0 ]

# -----------------------------------------------------------------------------

from paraview import simple
from paraview.web.dataset_builder import *

# -----------------------------------------------------------------------------
# Pipeline creation
# -----------------------------------------------------------------------------

reader = simple.XMLUnstructuredGridReader(FileName = source_filename % time_serie[0], CellArrayStatus = sampling_arrays)
dataCleanUp  = simple.Threshold(Input = reader, Scalars = ['CELLS', 'temperature'], ThresholdRange = [-1000.0, 50.0])

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

dpdsb = DataProberDataSetBuilder(dataCleanUp, dataset_destination_path, sampling_size, sampling_arrays, sampling_bounds)

# Add time information
dpdsb.getDataHandler().registerArgument(priority=1, name='time', values=time_serie, ui='slider', loop='modulo')

# Explore dataset
dpdsb.start()
for time in dpdsb.getDataHandler().time:
    reader.FileName = source_filename % time
    dpdsb.writeData()
dpdsb.stop()
