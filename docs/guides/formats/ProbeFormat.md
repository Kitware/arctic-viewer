---
layout: docs
title: Probe
permalink: /docs/Probe/
prev_section: DepthSortedComposite
next_section: Ensemble
repo_path: /docs/guides/formats/ProbeFormat.md
---

# Introduction

The ArcticViewer is able to load several type of datasets, but this guide will
focus on the probe one and will explain what are the requirements for
it so you could create your own dataset.

# Dataset structure

Arctic Viewer expect a dataset descriptor that will formalize that convention
in a way it can be understood by the application. The application expect a file
named __info.json__ at the root of the tree structure (if any) with a content similar
to the following one.

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

In that meta description, we find the volume size, the set of fields,
the data range, the spacing and how much layers are available in a sprite.

# Image Sprite

![Image Sprite]({{site.baseurl}}/docs/probe-sprite.png "Image Sprite with raw scalar field encoded")
