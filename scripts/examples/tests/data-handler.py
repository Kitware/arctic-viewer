#! /usr/bin/env python

import vtk.web.query_data_model import *
from vtk.web import camera

dataset_destination_path = '/tmp/data_handler'

# Choose data location
dh = DataHandler(dataset_destination_path)
camera = camera.SphericalCamera(dh, (0,0,0), (1,0,0), (0,0,1), range(0, 360, 30), range(-60, 61, 30))

# Provide metadata
dh.addTypes('WebGL-Compositor', 'rgbd')
dh.addMetaData('title', 'Test dataset');
dh.addMetaData('authors', ['Sebastien Jourdain', 'Patrick O\'Leary']);
dh.addSection('Composite', { 'name': 'Seb', 'pipeline': { 'a': 1, 'b': 2}})

# Create arguments
dh.registerArgument(priority=1, name='contour', values=range(5),   ui='slider')
dh.registerArgument(priority=2, name='time',  values=range(0, 10), ui='slider')

# Create data
dh.registerData(name='image', type='blob', mimeType='image/png', fileName='.png')

# Loop over data
for time in dh.time:
    for contour in dh.contour:
        for pos in camera:
            print 'Time: %d | Contour: %d => %s' % (time, contour, dh.getDataAbsoluteFilePath('image'))
            print 'Phi %d - Theta %d - Position %s - ViewUp %s' % (pos['phi'], pos['theta'], str(pos['position']), str(pos['viewUp']))

# Write metadata
dh.writeDataDescriptor()
