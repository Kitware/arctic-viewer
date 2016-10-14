/* global exec which */
require('shelljs/global');

const electron = require('electron');
const spawn = require('child_process').spawn;
const aboutPage = require('./aboutPage');

const { app, dialog, Menu, shell } = electron;
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let server = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600, icon: `${__dirname}/icon.png` });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function openFile(path) {
  if (mainWindow === null) {
    createWindow();
  }

  if (!path) {
    return;
  }
  // console.log(path);

  if (server) {
    exec(`kill ${server.pid}`, () => {
      console.log('server restarting');
    });
  }

  server = spawn(`${__dirname}/../node_modules/arctic-viewer/bin/arctic-viewer-cli.js`, ['-d', path, '-s']);

  server.on('error', (err) => {
    dialog.showErrorBox('Error starting arctic viewer server', err);
  });

  mainWindow.loadURL('http://localhost:3000');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click() { dialog.showOpenDialog(mainWindow, { title: 'Open Dataset', properties: ['openDirectory'] }, openFile); },
        },
      ],
    },
    // {
    //   label: 'View'
    //   submenu: [
    //     {}
    // magicLens;
    // singleView;
    // recording;
    // development;
    // open in browser
    //   ]
    // },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() { shell.openExternal('https://kitware.github.io/arctic-viewer'); },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();
    menuTemplate.unshift({
      label: name,
      submenu: [
        aboutPage,
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  } else {
    menuTemplate[menuTemplate.length].submenu.push(aboutPage);
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (server) {
    exec(`kill ${server.pid}`, () => {
      console.log('server stopping ✓');
    });
  }

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
