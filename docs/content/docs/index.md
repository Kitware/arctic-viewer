title: Documentation
---

# Introduction

The ParaView ArcticViewer application let you create a local web server which will then serve a dedicated web application and your data to any browser that can connect to it.

The ParaView ArcticViewer is meant to evolve and support more and more data type to explore but currently, it can handle:

- Image based dataset
- 3D probed dataset with scalar field encoded which allow the usage of user defined LookupTable.
- Image based composite dataset with the JSON structure providing the pixel ordering for each layer.
- Floating point sorted composite dataset to enable dynamic scene recomposition while enabling transparency accross layers as well as editable color mapping.
- Dynamic 3D mesh where animation can be replayed.
- CSV table based dataset which will then use Plotly for rendering various chart type.
- Time based Floating point images which enable to do time analysis and comparison over various regions.
- ...

# Installation

ParaView ArcticViewer is simple to install as long as you have a NodeJS environment working. To install it globally on your system, you just need to run the following command line.

```sh
$ npm install -g arctic-viewer
```

# Command line tool

ParaView ArcticViewer can be used as a Web server to serve the application and your data. Or ParaView ArcticViewer can also be used to download remote dataset. The following sections explain how to use it and what are the different options.

## Serve a local dataset

For that configuration, ParaView ArcticViewer will act as a local web server and will need to know which directory you would like to serve. Then optional configuration can be provided such as which network port should be used and if you want the application to start your default web browser on the application page.

The following set of command lines illustrate various usage:

```sh
## This will start the server on port 3000 and will open your browser automatically
$ ArcticViewer -d ./path/to/your/dataset/directory

## This will start the server on port 3000 and wait for connections on http://localhost:3000
$ ArcticViewer -d ./path/to/your/dataset/directory -s

## This will start the server on port 1234 so you can connect to http://localhost:1234
$ ArcticViewer -d ./path/to/your/dataset/directory -s -p 1234
```

## Serve a remote dataset

Serving a remote dataset is similar than serving a local dataset except that you need to provide the full http URL like follow.

```sh
$ ArcticViewer -d http://tonic.kitware.com/data/head-ct
```

## Download a set of sample datasets

ArcticViewer let you also download some data so you can actually play with it. For that you will need to run the application in the directory you want to download your data into.

Here is an example of command lines:

```sh
$ mkdir ArcticData && cd $_
$ ArcticViewer --download-sample-data 
```

## Download a remote dataset

This allow the application to act as a regular viewer and download each resource locally.

Here is an example on how to run it:

```sh
$ mkdir velocity && cd $_
$ ArcticViewer --download http://tonic.kitware.com/data/head-ct
```
