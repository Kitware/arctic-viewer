title: Probe
---

# Introduction

The ParaView ArcticViewer is able to load several type of datasets, but this guide will focus on the probe one and will explain the requirements for it so you can create your own datasets.

# Dataset structure

ParaView ArcticViewer expects the data to be accompanied by a dataset descriptor that formalizes the data convention so it can be understood by the application.  The application expects a file named __index.json__ at the root of the tree structure (if any) with a content similar to the following one:

```js
{
    "type": [ "tonic-query-data-model", "in-situ-data-prober" ],
    "arguments_order": ["time"],
    "arguments": {
        "time": {
            "loop": "reverse",
            "ui": "slider",
            "values": [ "0", "1", "2", "3", "4" ]
        }
    },
    "InSituDataProber": {
        "dimensions": [ 500, 250, 30 ],
        "fields": [ "temperature", "salinity" ],
        "ranges": {
            "salinity": [0, 38],
            "temperature": [-5, 30]
        },
        "slices": [ "slice_0", "slice_1", "slice_2" ],
        "spacing": [ 1.0, 1.0, 4.0 ],
        "sprite_size": 10
    },
    "data": [
        {
            "name": "slice_0",
            "type": "blob",
            "mimeType": "image/png",
            "pattern": "{time}/{field}_0.png"
        },{
            "name": "slice_1",
            "type": "blob",
            "mimeType": "image/png",
            "pattern": "{time}/{field}_1.png"
        },{
            "name": "slice_2",
            "type": "blob",
            "mimeType": "image/png",
            "pattern": "{time}/{field}_2.png"
        }
    ]
}
```

In the above meta description, we find the volume size, the set of fields, the data range, the spacing, and how many layers are available in a sprite.

# Image Sprite

<img src="/arctic-viewer/docs/probe-sprite.png" alt="Image Sprite with raw scalar field encoded"/>
