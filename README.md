## InSitu Data Viewer ##

### Goal ###

Provide a Data Viewer based on Web technologies and relying on the user browser
to navigate and explore data generated InSitu or in batch mode.

## Installation

```
$ npm install -g in-situ-data-viewer
```

After installing the package you will get 2 executable
[**InSituDataViewer**, **InSituDataDownloader**] with the following set of
options.

```
$ InSituDataViewer

  Usage: InSituDataViewer [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -p, --port [3000]            Start web server with given port
    -d, --data [directory/http]  Data directory to serve. Should contain a info.json file.
    -s, --server-only            Do not open the web browser
```


```
$ InSituDataDownloader

  Usage: InSituDataDownloader [options]

  Options:

    -h, --help                                output usage information
    -V, --version                             output the version number
    -s, --download-sample-data                Download some try-out data [~100MB]
    -d, --download [http://remote-host/data]  Url to the source of your in-situ data.
    -o, --output [directory]                  Data directory where to download remote data locally
```

In order to try it out, you should download some sample datasets
(unless you already have some ;-) and run the data viewer on them.

Here is an example on how to download some sample data

```
$ InSituDataDownloader -s -o ./tonic-data

 | Downloading sample data (~100MB) into directory /Users/seb/tonic-data
 |
 | => Once the data will be downloaded, you will be able to try the InSituDataViewer with the following commands:
 |
 |  $ InSituDataViewer -d /Users/seb/tonic-data/mpas-probe-flat-earth
 |  $ InSituDataViewer -d /Users/seb/tonic-data/hydra-image-fluid-velocity
 |
 | Thank you for trying this out... Seb
```

Then you can load them using the provided feedback or by running the following
command lines:

```
$ InSituDataViewer -d ./tonic-data/mpas-probe-flat-earth
```

This will load a MPAS oceanic simulation data that represent a 3D volume of a
flatten version of the earth with Temperature and Salinity information on the water.

From that data you can look at a slice of the data along any axis and move the
slice back and forth using the scroll of your input device.

If you want to zoom or pan, you will have to scroll+[any modifier key] or drag+[any modifier key].

```
$ InSituDataViewer -d ./tonic-data/hydra-image-fluid-velocity
```

This will load an Hydra CFD simulation data that represent the fluid velocity
using some volume rendering technique.


#### Licensing

**in-situ-data-viewer** is licensed under [BSD Clause 3](LICENSE).

#### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **in-situ-data-viewer** useful to as many people as possible.
