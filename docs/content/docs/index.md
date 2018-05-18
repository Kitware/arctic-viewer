title: Documentation
---

# Introduction

The ParaView ArcticViewer application lets you create a local web server which will then serve a dedicated web application and your data to any browser that can connect to it.

The ParaView ArcticViewer is an example application based on [Cinema](https://datascience.lanl.gov/Cinema.html) and intended to highlight some of the capabilities of [ParaViewWeb](https://kitware.github.io/paraviewweb) and [vtk.js](https://kitware.github.io/vtk-js).  While it was developed to support a growing set of data types, it will remain simply an example application .  Some of the types of datasets it can handle currently include:

- Image based dataset.
- 3D probed dataset with encoded scalar field which allows the use of user defined LookupTable.
- Image based composite dataset with a JSON structure providing the pixel ordering for each layer.
- Floating point sorted composite dataset to enable dynamic scene recomposition while enabling transparency across layers, as well as editable color mapping.
- Dynamic 3D mesh where animation can be replayed.
- CSV table based dataset which will uses Plotly for rendering various types of charts.
- Time based floating point images which enable time analysis and comparison over various regions.
- ...

# Installation

ParaView ArcticViewer is simple to install as long as you have a NodeJS environment working. To install it globally on your system, you just need to run the following command line:

```sh
$ npm install -g arctic-viewer
```

# Command line tool

ParaView ArcticViewer can be used as a Web server to serve both the application and your data. Alternatively, it can be used to download remote datasets. The following sections explain how to use it and describe the available options.

## Serve a local dataset

For this configuration, ParaView ArcticViewer will act as a local web server and will need to know which directory you would like to serve. Then optional configuration can be provided such as which network port should be used and whether you want the application to start your default web browser on the application page.

The following command lines illustrate various usage scenarios:

```sh
## This will start the server on port 3000 and will open your browser automatically
$ ArcticViewer -d ./path/to/your/dataset/directory

## This will start the server on port 3000 and wait for connections on http://localhost:3000
$ ArcticViewer -d ./path/to/your/dataset/directory -s

## This will start the server on port 1234 so you can connect to http://localhost:1234
$ ArcticViewer -d ./path/to/your/dataset/directory -s -p 1234
```

## Serve a remote dataset

Serving a remote dataset is similar to serving a local dataset except that you need to provide the full http URL to location where the data is hosted.  For example:

```sh
$ ArcticViewer -d http://tonic.kitware.com/data/head-ct
```

## Download a set of sample datasets

ArcticViewer also lets you download some data so you can interact with it on your own machine.  For that you will need to run the application in the directory into which you want to download your data.

Here is an example of how to do that:

```sh
$ mkdir ArcticData && cd $_
$ ArcticViewer --download-sample-data 

 | Available datasets for download (path: /home/projects/ArcticData)
 |   (1)  40.0 MB  -  diskout-composite
 |   (2)  94.2 MB  -  ensemble
 |   (3)  13.7 MB  -  head_ct_3_features
 |   (4)  13.1 MB  -  head_ct_4_features
 |   (5)  50.8 MB  -  hydra-image-fluid-velocity
 |   (6) 162.3 MB  -  mpas-composite-earth
 |   (7)  37.5 MB  -  mpas-flat-earth-prober
 |   (8) 552.5 MB  -  mpas-hd-500-7t
 | 
 | Press Enter to quit or the dataset number to download: 1
 | Press Enter to quit or the dataset number to download: 3
 | Press Enter to quit or the dataset number to download: 
 |
 | => You will be able to try ArcticViewer with these commands:
 |
 |  $ ArcticViewer -d /home/projects/ArcticData/head_ct_3_features
 |  $ ArcticViewer -d /home/projects/ArcticData/diskout-composite
 |
 | Thank you for trying this out...

```

As you can see, once you choose a couple of datasets by typing in the associated number and hitting `Enter`, the data is downloaded to the current directory, and you are given the command lines to run in order to interact with them.

## Download a remote dataset

This allows the application to act as a regular viewer and download each resource locally.

Here is an example on how to run it:

```sh
$ mkdir head-ct && cd $_
$ ArcticViewer --download http://tonic.kitware.com/data/head-ct
```
