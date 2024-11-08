const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading file from:', indexPath);

  win.loadFile(indexPath);
  
  // Kun åbn DevTools i development mode
  if (isDev) {
    win.webContents.openDevTools();
  }
  
  win.maximize();

  // Log eventuelle load fejl
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log når siden er loaded
  win.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });
}

// Tilføj denne IPC handler
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 