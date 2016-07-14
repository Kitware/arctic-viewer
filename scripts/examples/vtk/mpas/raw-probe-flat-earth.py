# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/vtk_data_prober_mpas'

# -----------------------------------------------------------------------------

from vtk import *
from vtk.web.dataset_builder import *

# -----------------------------------------------------------------------------

data_base_path = '/Volumes/Backup3TB/DataExploration/Data/MPAS/data/flat_n_primal/'

flat_file_pattern = 'LON_LAT_NLAYER-primal_%d_0.vtu'
flat_file_times = range(50, 101, 50) # range(50, 5151, 50)  # range(50, 5901, 50)

flat_arrays = ['temperature', 'salinity']
flat_sampling_size   = [ 500, 250, 30 ]
flat_sampling_bounds = [ -3.2, 3.2,
                         -1.3, 1.5,
                         -3.0, 0.0 ]

# -----------------------------------------------------------------------------
# VTK Data
# -----------------------------------------------------------------------------

reader = vtkXMLUnstructuredGridReader()

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

dpdsb = DataProberDataSetBuilder(dataset_destination_path, flat_sampling_size, flat_arrays, flat_sampling_bounds)
dpdsb.setSourceToProbe(reader)

# Add time information
dpdsb.getDataHandler().registerArgument(priority=1, name='time', values=flat_file_times, ui='slider', loop='modulo')

# Extract data
dpdsb.start()
for time in dpdsb.getDataHandler().time:
    fileName = data_base_path + (flat_file_pattern % time)
    reader.SetFileName(fileName)
    print 'processing', fileName
    dpdsb.writeData()
dpdsb.stop()
