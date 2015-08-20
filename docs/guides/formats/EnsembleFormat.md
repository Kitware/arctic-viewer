---
layout: docs
title: Ensemble
permalink: /docs/Ensemble/
prev_section: Probe
repo_path: /docs/guides/formats/EnsembleFormat.md
---

# Introduction

The ArcticViewer is able to load several type of datasets, but this guide will
focus on the ensemble one and will explain what are the requirements for
it so you could create your own dataset.

# Dataset structure

Arctic Viewer expect a dataset descriptor that will formalize that convention
in a way it can be understood by the application. The application expect a file
named __info.json__ at the root of the tree structure (if any) with a content similar
to the following one.

```js
{
    "type": [
        "ensemble-dataset"
    ],
    "Ensemble": {
        "datasets": [
            {
                "name": "Velocity",
                "data": "hydra-image-fluid-velocity/info.json"
            },{
                "name": "Velocity2",
                "data": "hydra-image-fluid-velocity/info.json"
            },{
                "name": "VelocityFree",
                "data": "hydra-image-fluid-velocity/info.json"
            },{
                "name": "Earth",
                "data": "mpas-probe-flat-earth/info.json"
            },{
                "name": "Earth2",
                "data": "mpas-probe-flat-earth/info.json"
            },{
                "name": "EarthFree",
                "data": "mpas-probe-flat-earth/info.json"
            }
        ],
        "binding": [
            {
                "datasets": [ "Velocity", "Velocity2" ],
                "arguments": [ "phi", "theta", "time" ]
            },{
                "datasets": [ "Earth", "Earth2" ],
                "arguments": [ "time" ],
                "other": [
                    {
                        "listener": "onProbeChange",
                        "setter": "setProbe"
                    },{
                        "listener": "onRenderMethodChange",
                        "setter": "setRenderMethod"
                    },{
                        "listener": "onCrosshairVisibilityChange",
                        "setter": "setCrossHairEnable"
                    }
                ]
            }
        ],
        "operators": [
            { "name": "Velocity diff", "datasets": [ "Velocity", "Velocity2", "VelocityFree" ], "operation": "Velocity - VelocityFree" },
            { "name": "Earth diff", "datasets": [ "Earth", "Earth2", "EarthFree" ], "operation": "Earth - EarthFree" }
        ]
    },
    "metadata": {
        "title": "Ensemble demo"
    }
}
```

In that meta description, we find the list of dataset that compose that ensemble
with the relationship that should exist between them. Like synchronizing
the __Time__ across several dataset or any particular argument or parameter.
But also what kind of binding need to happen directly on the ImageBuilder instance.

The path provided for those datasets is relative to the initial info.json file.

Then we can add some Operator views of those dataset. Those operators will allow
you to apply pixel operations between the set of datasets you've listed in them.

