# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

convert_dir = [ '/Users/seb/Desktop/vtk_volume_v3/0_90', '/Users/seb/Desktop/vtk_volume_v3/0_0']

# -----------------------------------------------------------------------------

from vtk.web.dataset_builder import *

converter = ConvertVolumeStackToSortedStack(500, 500)
for d in convert_dir:
    converter.convert(d)

