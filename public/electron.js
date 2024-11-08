const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

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