# ArcticViewer Desktop

An [Electron](https://github.com/electron/electron) wrapper for ArcticViewer. 

## Getting Started

In this directory run 

```sh
$ npm install # installs electron and other dependencies
$ npm start # starts electron app
```

You'll be presented a blank window prompting you to open a dataset. Use the hotkey _Ctrl / ⌘ + O_ to open a dataset folder, _File > Open..._ will present the same window to open a dataset.

## Bundling 

Depending on your platform, you can bundle ArcticViewer as a native application with one of the following:

```sh
$ npm run build:mac # bundle for macOS
$ npm run build:lin # bundle for Linux
$ npm run build:win # bundle for Windows
```

The output from the build process will be placed in the folder `./bin/`
