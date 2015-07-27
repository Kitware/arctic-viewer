---
layout: docs
title: Composite
permalink: /docs/Composite/
prev_section: ImageBased
next_section: Probe
repo_path: /docs/guides/formats/CompositeFormat.md
---

# Introduction

The ArcticViewer is able to load several type of datasets, but this guide will
focus on the basic composite one and will explain what are the requirements for
it so you could create your own dataset.

# Dataset structure

Arctic Viewer expect a dataset descriptor that will formalize that convention
in a way it can be understood by the application. The application expect a file
named __info.json__ at the root of the tree structure (if any) with a content similar
to the following one.

```js
{
    "type": [ "tonic-query-data-model", "composite-pipeline" ],
    "arguments_order": ["time"],
    "arguments": {
        "time": {
            "values": [ "0", "1", "2", "3", "4", "5" ]
        }
    },
    "data": [
        {
            "name": "sprite",
            "type": "blob",
            "mimeType": "image/jpg",
            "pattern": "{time}/rgb.jpg"
        },{
            "name": "composite",
            "type": "json",
            "pattern": "{time}/composite.json"
        },
    ],
    "CompositePipeline": {
        "layers": ["A", "B", "C"],
        "dimensions": [ 500, 500 ],
        "fields": {
            "A": "salinity",
            "B": "temperature",
            "C": "bottomDepth"
        },
        "layer_fields": {
            "A": [ "C" ],
            "B": [ "B", "A" ],
            "C": [ "B", "A" ]
        },
        "offset": {
            "AC": 1,
            "BA": 3,
            "BB": 2,
            "CA": 5,
            "CB": 4
        },
        "pipeline": [
            {
                "ids": [ "A" ],
                "name": "Earth core",
            },{
                "ids": [ "B", "C" ],
                "name": "Contour by temperature",
                "children": [
                    {
                        "ids": [ "B" ],
                        "name": "t=25.0",
                        "type": "layer"
                    },{
                        "ids": [ "C" ],
                        "name": "t=20.0",
                        "type": "layer"
                    }
                ],
            }
        ]
    }
}
```

In that meta description, we find the pipeline tree described but also we have
the mapping of the image sprite with the layer and its color by. The first
character is the layer and the second one is the actual field used for the
color by.

Then for each query (view position, time, configuration, ...), the dataset is
composed of an __image sprite__ and a __composite.json__ file.

The image sprite represent each layer independently with each of its ColorBy
settings.

The __composite.json__ on the other end, provide the pixel ordering for each of
the possible layers with a content similar to the following one:

```js
{
    "pixel-order": "@2258+A+CBA+CA+CB+..."
}
```

The __pixel-order__ string describe the layer order for each pixel starting from
the top left corner of the image.

The encoding can be described as follow:

- __@456__ : Skip 456 pixels as no layer are contributing to those pixels.
- __CBA__: For the given pixel, the layer _C_ is on top of _B_ which is on top of _A_. Which Mean if _C_ is hidden, then the pixel of the layer _B_ should be used.
- __+__ : Character delimiter between pixel or pixel group.

# Image Sprite

![Image Sprite]({{site.baseurl}}/docs/composite-sprite.jpg "Image Sprite of each layer")
