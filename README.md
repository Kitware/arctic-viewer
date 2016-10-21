## [ArcticViewer](http://kitware.github.io/arctic-viewer/)

[![Build Status](https://travis-ci.org/Kitware/arctic-viewer.svg)](https://travis-ci.org/Kitware/arctic-viewer)
[![Dependency Status](https://david-dm.org/kitware/arctic-viewer.svg)](https://david-dm.org/kitware/arctic-viewer)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/arctic-viewer.svg)
![npm-version-requirement](https://img.shields.io/badge/npm->=3.0.0-brightgreen.svg)
![node-version-requirement](https://img.shields.io/badge/node->=5.0.0-brightgreen.svg)

### Goal ###

Provide a Data Viewer (ArcticView) based on Web technologies and relying on the
user browser to navigate and explore data generated InSitu or in batch mode.

## Installation

```
$ npm install -g arctic-viewer
```

After installing the package you will get one executable **ArcticViewer** with
the following set of options.

```
$ ArcticViewer

  Usage: ArcticViewer [options]

  Options:

    -h, --help                            output usage information
    -V, --version                         output the version number
    -p, --port [3000]                     Start web server with given port
    -d, --data [directory/http]           Data directory to serve
    -s, --server-only                     Do not open the web browser

    -o, --output-pattern [path/pattern]   Provide a path/pattern for the exported images

    --download-sample-data                Choose data to download inside current directory
    --download [http://remote-host/data]  Download remote data inside current directory

    -M, --magic-lens                      Enable MagicLens inside client configuration
    -S, --single-view                     Enable SingleView inside client configuration
    -R, --recording                       Enable Recording inside client configuration
    -D, --development                     Enable Development inside client configuration

```

In order to try it out, you should download some sample datasets
(unless you already have some ;-) and run the data viewer on them.

Here is an example on how to download some sample data:

```sh
$ mkdir sample-data && cd $_
$ ArcticViewer --download-sample-data

 | Available datasets for download (path: /tmp)
 |   (1)  40.0 MB  -  diskout-composite
 |   (2)  94.2 MB  -  ensemble
 |   (3)   292 KB  -  garfield
 |   (4)  13.7 MB  -  head_ct_3_features
 |   (5)  13.1 MB  -  head_ct_4_features
 |   (6)  50.8 MB  -  hydra-image-fluid-velocity
 |   (7) 162.3 MB  -  mpas-composite-earth
 |   (8)  37.5 MB  -  mpas-flat-earth-prober
 |   (9) 552.5 MB  -  mpas-hd-500-7t
 |
 | Press Enter to quit or the dataset number to download: 1
 | Press Enter to quit or the dataset number to download: 5
 | Press Enter to quit or the dataset number to download: 8
 | Press Enter to quit or the dataset number to download:
 |
 | => You will be able to try ArcticViewer with these commands:
 |
 |  $ ArcticViewer -d /tmp/head_ct_4_features
 |  $ ArcticViewer -d /tmp/diskout-composite
 |  $ ArcticViewer -d /tmp/mpas-flat-earth-prober
 |
 | Thank you for trying this out...

```

Then you can view them using the provided feedback or by running the following
command lines:

```sh
$ ArcticViewer -d ./sample-data/mpas-probe-flat-earth
```

This will load a MPAS oceanic simulation data that represent a 3D volume of a
flattened version of the Earth with temperature and salinity information on the oceans.

From that data you can look at a slice of the data along any axis and move the
slice back and forth using the scroll of your input device.

If you want to zoom or pan, you will have to scroll+[any modifier key] or drag+[any modifier key].

```sh
$ ArcticViewer -d ./sample-data/hydra-image-fluid-velocity
```

This will load an Hydra CFD simulation data that represent the fluid velocity
using some volume rendering techniques.

## Documentation

See the [documentation](https://kitware.github.io/arctic-viewer) for a
getting started guide, advanced documentation, and API descriptions.

#### Licensing

**arctic-viewer** aka ArcticViewer is licensed under [BSD Clause 3](LICENSE).

#### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **arctic-viewer** useful to as many people as possible.
