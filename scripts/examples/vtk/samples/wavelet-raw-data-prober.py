
# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

dataset_destination_path = '/Users/seb/Desktop/vtk_data_prober'

# -----------------------------------------------------------------------------

from vtk import *
from vtk.web.dataset_builder import *

# -----------------------------------------------------------------------------
# VTK Pipeline creation
# -----------------------------------------------------------------------------

source = vtkRTAnalyticSource()

# -----------------------------------------------------------------------------
# Data Generation
# -----------------------------------------------------------------------------

dpdsb = DataProberDataSetBuilder(dataset_destination_path, [20,20,20], ['RTData'])
dpdsb.setSourceToProbe(source)

dpdsb.start()
dpdsb.writeData()
dpdsb.stop()
