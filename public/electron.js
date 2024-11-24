const { app, BrowserWindow, ipcMain, dialog } = require('electron');
require('@electron/remote/main').initialize();
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const { spawn } = require('child_process');

let printerProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  require('@electron/remote/main').enable(win.webContents);

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

  // Tilføj auto backup check
  const sqlite3 = require('sqlite3');
  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  db.get('SELECT auto_backup FROM settings WHERE id = 1', (err, row) => {
    if (!err && row?.auto_backup) {
      performAutoBackup();
    }
  });
  
  db.close();
}

// Tilføj disse IPC handlers
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result.filePath;
});

ipcMain.handle('backup-database', async (event, savePath) => {
  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  fs.copyFileSync(dbPath, savePath);
});

// Tilføj denne funktion til at håndtere auto backup
async function performAutoBackup() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
    const backupDir = path.join(app.getPath('userData'), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Tilføj tidsstempel til filnavnet (YYYY-MM-DD_HH-mm-ss)
    const timestamp = new Date().toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-');
    
    const backupPath = path.join(
      backupDir, 
      `auto_backup_${timestamp}.db`
    );
    
    fs.copyFileSync(dbPath, backupPath);
    
    // Behold kun de seneste 5 backups
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('auto_backup_'))
      .sort()
      .reverse();
    
    files.slice(5).forEach(file => {
      fs.unlinkSync(path.join(backupDir, file));
    });
  } catch (err) {
    console.error('Auto backup failed:', err);
  }
}

// Tilføj restore handler
ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Database Files', extensions: ['db'] }]
  });
  return result.filePaths[0];
});

ipcMain.handle('restore-database', async (event, backupPath) => {
  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  
  // Lav en sikkerhedskopi før restore
  const tempBackup = path.join(app.getPath('temp'), 'pre_restore_backup.db');
  fs.copyFileSync(dbPath, tempBackup);

  try {
    fs.copyFileSync(backupPath, dbPath);
    return { success: true };
  } catch (err) {
    // Hvis restore fejler, gendan fra sikkerhedskopien
    fs.copyFileSync(tempBackup, dbPath);
    return { success: false, error: err.message };
  } finally {
    // Ryd op
    if (fs.existsSync(tempBackup)) {
      fs.unlinkSync(tempBackup);
    }
  }
});

// Tilføj denne funktion
async function setupPythonMonitor(printerConfig) {
  if (printerProcess) {
    printerProcess.kill();
    printerProcess = null;
  }

  const pythonPath = 'python';
  const scriptPath = isDev 
    ? path.join(app.getAppPath(), 'py_tools', 'Printer_info.py')
    : path.join(process.resourcesPath, 'py_tools', 'Printer_info.py');

  const workingDir = isDev 
    ? app.getAppPath()
    : path.join(process.resourcesPath, '..');
  
  printerProcess = spawn(pythonPath, [
    scriptPath,
    '--ip', printerConfig.ip_address,
    '--code', printerConfig.access_code,
    '--serial', printerConfig.serial
  ], {
    stdio: 'pipe',
    cwd: workingDir
  });

  // Kun log kritiske fejl
  printerProcess.stderr.on('data', (data) => {
    if (data.toString().includes('Error:')) {
      console.error(`Python error: ${data}`);
    }
  });

  printerProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Python process exited with code ${code}`);
    }
    printerProcess = null;
  });

  return printerProcess;
}

// Tilføj IPC handlers
ipcMain.handle('start-printer-monitor', async (event, config) => {
  try {
    const process = await setupPythonMonitor(config);
    return { success: true };
  } catch (error) {
    console.error('Failed to start printer monitor:', error);
    return { success: false, error: error.message };
  }
});

// Tilføj stop handler
ipcMain.handle('stop-printer-monitor', async () => {
  if (printerProcess) {
    printerProcess.kill();
    printerProcess = null;
    return { success: true };
  }
  return { success: false, error: 'No printer monitor running' };
});

// Tilføj cleanup ved app quit
app.on('before-quit', () => {
  if (printerProcess) {
    printerProcess.kill();
  }
});

// Opdater read-status-file handler
ipcMain.handle('read-status-file', async (event, filePath) => {
  try {
    const fullPath = path.join(app.getAppPath(), filePath);
    const rawData = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(rawData);
    
    return JSON.stringify({
      connected: true,
      last_update: Date.now() / 1000,
      ...data
    });
  } catch (error) {
    return JSON.stringify({
      connected: false,
      error: 'Waiting for printer connection...',
      last_update: Date.now() / 1000
    });
  }
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