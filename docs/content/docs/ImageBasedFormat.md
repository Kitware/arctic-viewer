title: Image Based
---

# Introduction

The ParaView ArcticViewer is able to load several type of datasets, but this guide will focus on the most basic one (image based) and will explain the requirements so you can create your own dataset.

# Dataset structure

The data must be a set of images (JPG, PNG...) defined by a N dimensional parameter set.

For example a movie is considered a 1D dataset as the only variable is time. But imagine you have a set of pictures/images that are dependent on a point of view and the time, then you have a 2D one. By now, you should be able to understand the concept.

So assuming you have a large set of images, they need to have a structure and/or convention on their naming relative to those parameters.

In order to make those images available to ParaView ArcticViewer, you will need to create a dataset descriptor that will formalize that convention so it can be understood by the application. The application expects a file named __info.json__ at the root of the tree structure (if any) with a content similar to the following one:

```js
{
    "type": [ "tonic-query-data-model" ],
    "arguments_order": ["time"],
    "arguments": {
        "time": {
            "values": [ "0", "1", "2", "3", "4", "5" ]
        }
    },
    "data": [
        {
            "name": "image",
            "type": "blob",
            "mimeType": "image/jpg",
            "pattern": "sky_{time}.jpg"
        }
    ]
}
```

The data descriptor has 4 main sections explained below.

## type

This expresses the type of the dataset and what kind of processing could be needed for rendering the data. In our case, we don't need any specific processing, just the fact that we will rely on a "tonic-query-data-model" to handle the data.

## arguments_order

This list of String is used by the graphical user interface to create a set of controls over the specified parameters and specify in which order they should appear.

## arguments

This section defines each dimension that you want to specify with a name and a set of possible values.

This can be extended by the following set of optional properties:

- __label__: Specify a different name than the one used as the key.
- __loop__: Specify if you want that parameter to loop either in __modulo__ or __reverse__ mode.
- __ui__: Specify the type of UI that should be used such as a __slider__ or as a __list__ (the default value).
- __bind__: Specify what type of event you want to bind this parameter to.

__bind__

You can bind a parameter to a mouse action as follows:

```js
"mouse" : {
    "drag" : {           // Type of the mouse event
        "modifier": 0,   // Which modifier NONE | ALT | SHIFT | META | CTR
        "coordinate": 0, // Which coordinate [x,y]. 0 for x and 1 for y.
        "step": 10,      // How much drag on x or y is needed to switch to the next value of the parameter
        "orientation": 1 // Which way to go based on the delta. (1 or -1)
    },
}
```

## data

This section lists the set of data that should be retrieved for a given set of parameters. For the Image Based Format, we just need a single entry with a name __"image"__ and the appropriate pattern representing the path of the image relative to the __info.json__ file and where each {xxx} will be replaced by the currently active dimension value. The pattern can include the __"/"__ character to denote a sub-directory.
