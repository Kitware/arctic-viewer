r"""
brew install libtiff libjpeg webp little-cms2
sudo easy_install pip
sudo pip install Pillow
"""

import sys, os, json, math, gzip, shutil

import numpy as np
from PIL import ImImagePlugin
from PIL import Image

from vtk import *
from paraview.web import data_converter

def extractFloatArrays(directory, ranges):
    for root, dirs, files in os.walk(directory):
        for name in files:
            if '.png' in name:
                fieldName = name[name.index('_')+1:-4]
                srcFile = os.path.join(root, name)
                destFile = os.path.join(root, name[:-4] + '.float32')
                imageSize = data_converter.convertImageToFloat(srcFile, destFile, ranges[fieldName])

                # Remove image
                os.remove(srcFile)

                # Compress data
                with open(destFile, 'rb') as f_in, gzip.open(destFile + '.gz', 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
                    os.remove(destFile)

    return imageSize

def createIntensityArray(directory, nbLayers):
    outputArray = vtkUnsignedCharArray()
    imageSize = 0
    reader = vtkPNGReader()

    for layerIdx in range(nbLayers):
        luminanceImage = os.path.join(directory, str(layerIdx) + '.luminance')
        reader.SetFileName(luminanceImage)
        reader.Update()
        rgbArray = reader.GetOutput().GetPointData().GetArray(0)

        # Extract image size and allocate memory
        if imageSize == 0:
            imageSize = rgbArray.GetNumberOfTuples()
            outputArray.SetNumberOfTuples(imageSize * nbLayers)

        # Extract each byte
        for idx in range(imageSize):
            outputArray.SetValue(layerIdx * imageSize + idx, (rgbArray.GetValue(idx * 3)))

        # Remove luminance file
        os.remove(luminanceImage)

    return outputArray

def createOrderFile(directory, nbLayers, intensityArray, width, height):
    # Load *.im, sort pixels, save
    # Load data
    layerImages = []
    totalSize = intensityArray.GetNumberOfTuples()
    imageSize = totalSize / nbLayers

    for layerIdx in range(nbLayers):
        imagePath = os.path.join(directory, str(layerIdx) + '.im')
        im = Image.open(str(imagePath))
        # im.show()
        # try:
        #     input("Press enter to continue ")
        # except NameError:
        #     pass
        layerImages.append(np.array(im, np.float32).reshape(im.size[1] * im.size[0]))

    # Create destination structure
    orderArray = vtkUnsignedCharArray()
    orderArray.SetName('order');
    orderArray.SetNumberOfTuples(totalSize)

    sortedIntensity = vtkUnsignedCharArray()
    sortedIntensity.SetName('intensity');
    sortedIntensity.SetNumberOfTuples(totalSize)

    for pixelIdx in range(imageSize):
        x = int(pixelIdx % width)
        y = int(pixelIdx / width)
        flipYIdx = width * (height - y - 1) + x
        # flipYIdx = imageSize - pixelIdx - 1
        # flipYIdx = pixelIdx

        depthStack = []
        for imageArray in layerImages:
            depthStack.append((imageArray[flipYIdx], len(depthStack)))
        depthStack.sort(key=lambda tup: tup[0])

        for destLayerIdx in range(len(depthStack)):
            # if depthStack[destLayerIdx][0] > 255:
            #     orderArray.SetValue((imageSize * destLayerIdx) + pixelIdx, 255)
            #     sortedIntensity.SetValue((imageSize * destLayerIdx) + pixelIdx, 0)
            # else:
            sourceLayerIdx = depthStack[destLayerIdx][1]

            # Copy Idx
            orderArray.SetValue((imageSize * destLayerIdx) + pixelIdx, sourceLayerIdx)
            sortedIntensity.SetValue((imageSize * destLayerIdx) + pixelIdx, intensityArray.GetValue((imageSize * sourceLayerIdx) + pixelIdx))


    # Write order file
    orderFileName = os.path.join(directory,'order.uint8')
    with open(orderFileName, 'wb') as f:
        f.write(buffer(orderArray))

    # Compress data
    with open(orderFileName, 'rb') as f_in, gzip.open(orderFileName + '.gz', 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
        os.remove(orderFileName)

    # Write intensity file
    intensityFileName = os.path.join(directory,'intensity.uint8')
    with open(intensityFileName, 'wb') as f:
        f.write(buffer(sortedIntensity))

    # Compress data
    with open(intensityFileName, 'rb') as f_in, gzip.open(intensityFileName + '.gz', 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
        os.remove(intensityFileName)

    # Remove IM files
    for layerIdx in range(nbLayers):
        imagePath = os.path.join(directory, str(layerIdx) + '.im')
        os.remove(imagePath)

# =============================================================================
# Start processing dataset
# =============================================================================
convertFileName = os.path.join(sys.argv[-1], 'convert.json')
tonicFileName = os.path.join(sys.argv[-1], 'index.json')
with open(convertFileName, "r") as f:
    convertInfo = json.load(f)

    for directory in convertInfo['directories']:
        # Convert images to float
        imageSize = extractFloatArrays(directory, convertInfo['scalars'])

        # Convert luminence to intensity
        intensityStack = createIntensityArray(directory, convertInfo['layers'])

        # Generate order layer
        createOrderFile(directory, convertInfo['layers'], intensityStack, imageSize[0], imageSize[1])

    # Update image size inside index.json
    with open(tonicFileName, "r") as f:
        tonicMeta = json.load(f)
        tonicMeta['SortedComposite']['dimensions'] = [ imageSize[0], imageSize[1] ]
        print "resolution", imageSize[0], 'x', imageSize[1], '=', (imageSize[0]*imageSize[1])
        with open(tonicFileName + '_', 'w') as fw:
            fw.write(json.dumps(tonicMeta, indent=4))

    os.remove(tonicFileName)
    os.rename(tonicFileName + '_', tonicFileName)

os.remove(convertFileName)
