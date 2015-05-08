## InSitu Data Viewer ##

### Goal ###

Provide a Data Viewer based on Web technologies and relying on the user browser
to navigate and explore data generated InSitu or in batch mode.

## Installation

```
$ npm install -g in-situ-data-viewer
```

Run the viewer on your data directory

```
$ InSituDataViewer -d /path/to/my/data
```

Otherwise for full usage:

```
$ InSituDataViewer

  Usage: InSituDataViewer [options]

  Options:

    -h, --help              output usage information
    -V, --version           output the version number
    -p, --port [3000]       Start web server with given port
    -d, --data [directory]  Data directory to serve. Should contain a info.json file.
    -s, --server-only       Do not open the web browser
```

The data directory can be a remote http:// url.

#### Licensing

**InSituDataViewer** is licensed under [BSD Clause 3](LICENSE).

#### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **InSituDataViewer** useful to as many people as possible.
