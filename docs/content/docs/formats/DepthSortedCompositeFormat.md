title: Depth-Sorted Composite
---

# Introduction

This guide will focus on the depth-sorted composite datatype and will explain
the structure and requirements for this datatype so you can create your own
datasets.

The name depth-sorted composite comes from the fact that these datasets have
been processed so that the images can be drawn directly and immediately in
back-to-front order.

Additionally, we need an opacity or alpha for each pixel in each layer.  If we also
have an intensity for each pixel in each layer, we can make use of that to do
additionaly interesting things with the images produced by arctic viewer.

# Dataset structure

Arctic Viewer expects any data to be accompanied by a dataset descriptor that
formalizes the data convention so it can be understood by the application. The
application expects to find a file named __index.json__ at the root of the tree
structure (if any), and for the depth-sorted composite type of dataset, the
file should be similar to the following example.

```js
{
  "SortedComposite": {
    "layers": 5,
    "scalars": [
      511.875,
      1535.625,
      2559.375,
      3583.125,
      4596.875
    ],
    "dimensions": [
      3,
      3
    ]
  },
  "type": [
    "tonic-query-data-model",
    "sorted-composite",
    "alpha"
  ],
  "arguments": {
    "theta": {
      "default": 2,
      "bind": {
        "mouse": {
          "drag": {
            "coordinate": 1,
            "step": 30,
            "modifier": 0,
            "orientation": 1
          }
        }
      },
      "ui": "slider",
      "name": "theta",
      "values": [
        "30",
        "60",
        "90",
        "120",
        "150"
      ]
    },
    "phi": {
      "bind": {
        "mouse": {
          "drag": {
            "coordinate": 0,
            "step": 30,
            "modifier": 0,
            "orientation": 1
          }
        }
      },
      "ui": "slider",
      "values": [
        "0",
        "30",
        "60",
        "90",
        "120",
        "150",
        "180",
        "210",
        "240",
        "270",
        "300",
        "330"
      ],
      "name": "phi",
      "loop": "modulo"
    }
  },
  "data": [
    {
      "pattern": "{theta}_{phi}/intensity.uint8",
      "type": "array",
      "name": "intensity",
      "categories": [
        "intensity"
      ],
      "metadata": {}
    },
    {
      "pattern": "{theta}_{phi}/alpha.uint8",
      "type": "array",
      "name": "alpha",
      "metadata": {}
    },
    {
      "pattern": "{theta}_{phi}/order.uint8",
      "type": "array",
      "name": "order",
      "metadata": {}
    }
  ],
  "arguments_order": [
    "phi",
    "theta"
  ],
  "metadata": {
    "backgroundColor": "rgb(0, 0, 0)"
  }
}
```

Let us begin by noting some important details from this descriptor file.  First,
the image dimensions are described by the `SortedComposite` -> `dimensions` attribute.
In this case, the images we will compose are 3px by 3px.  Next, note the the number
of "layers" we will be compositing is `5` in this case.  Looking in the `data` section
we can see there are three components to the data for building up a final composite
image: `order.uint8`, `alpha.uint8` and `intensity.uint8`.  These data components are
described in a bit more detail below.

<img src="/arctic-viewer/docs/formats/tonic-volume-data-format.png" alt="Example data layout for 3x3 images with 5 layers"/>

The image above shows an example of the data layout for two of the three components
(intensity is exactly the same, and thus not shown above) in the case where the layer
images are 3x3 pixels, and there are 5 layers (features) total.  Each data component
is simply a 1D array of 8-bit pixels, where the length of the array is found by
multiplying image width by image height by number of layers.  Refer to this depiction
when reading about the different data components below.

## `order`

The data in the order file consists of 8 bits per pixel, where the value in a pixel
is just the original layer index of that pixel.  The letters `a` through `e`  in the
above illustration correspond to depth-sorted layers where the pixels in `e` are
furthest from the camera, `d` are the next-furthest, and so on, until `a` are the
closest to the camera.  The actual value in each pixel within the sprite is a single
byte indicating which feature layer contains the `alpha` and `intensity` for the pixel.

By starting with the pixels marked with an `e` and proceeding backwards through the
alphabet to pixels marked with an `a`, we can quickly do back-to-front rendering
(using the traditional over-operator) which will produce a correctly alpha-blended
image.

## `alpha`

The data in the `alpha` file consists of 8 bits per pixel, each pixel giving an opacity
value of a pixel in an original layer or feature.

## `intensity`

The data in the `intensity` file is completely analogous to the data found in the `alpha`
file.  The difference is that the intensities give a measure of the "brightness" of the
pixel, rather than the transparency.
