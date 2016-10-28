title: Desktop application
---

ArcticViewer can be build and distributed as a desktop application relying on the [Electron](http://electron.atom.io/) infrastructrue.

We currently don't provide links to download pre-build packaged version, but you should be able to build them yourself.

## Create an application bundle yourself

ArcticViewer provide you with the infrastructure to create a redistributed application of ArcticViewer itself.

For that you will just need to follow the instruction below based on your operating system.

### Windows

```sh
$ git clone https://github.com/Kitware/arctic-viewer.git
$ cd arctic-viewer/electron
$ npm run build:win
```

Your bundle should be available in `./bin` directory.

### macOS

```sh
$ git clone https://github.com/Kitware/arctic-viewer.git
$ cd arctic-viewer/electron
$ npm run build:mac
```

Your bundle should be available in `./bin` directory.

### Linux

```sh
$ git clone https://github.com/Kitware/arctic-viewer.git
$ cd arctic-viewer/electron
$ npm run build:lin
```

Your bundle should be available in `./bin` directory.
