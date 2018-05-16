title: Desktop application
---

ArcticViewer can be built and distributed as a desktop application by relying on the [Electron](http://electron.atom.io/) infrastructrue.

We currently don't provide links to download pre-built packaged versions, but you should be able to build them yourself.

## Create an application bundle yourself

ArcticViewer provides you with the infrastructure to create a redistributable application of ArcticViewer itself.

For that you will just need to follow the appropriate instructions below based on your operating system.

### Windows

```sh
$ git clone https://github.com/Kitware/arctic-viewer.git
$ cd arctic-viewer/electron
$ npm run build:win
```

Your bundle should be available in `./bin` directory.

### MacOS

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
