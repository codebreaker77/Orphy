const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const MediaProvider = require('./media/provider');

// Avoid cache locking issues
app.setPath('userData', path.join(app.getPath('temp'), 'orphy-cache'));

// Avoid GPU sandbox crash on Windows
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow = null;
let tray = null;
let mediaProvider = null;
let pollInterval = null;
let isPolling = false;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;
  
  const winWidth = 660;
  const winHeight = 280;
  // Position horizontally centered, top-aligned
  const posX = Math.max(10, Math.round((screenW - winWidth) / 2));
  const posY = 40;

  mainWindow = new BrowserWindow({
    title: 'Orphy',
    width: winWidth,
    height: winHeight,
    x: posX,
    y: posY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    console.log(`[Orphy] Widget window active at (${posX}, ${posY})`);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer]: ${message}`);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  try {
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVDhPY/wPBAwUACYoTTAwMDAwYFHHgEkx4lOHzSZ0jbgMQTeAEhdiGDRqAMVpYBhgB4xGwaAFAF98BAlj7yYfAAAAAElFTkSuQmCC');
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Orphy', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { label: 'Hide Orphy', click: () => { if (mainWindow) mainWindow.hide(); } },
      { type: 'separator' },
      { label: 'Quit Orphy', click: () => app.quit() }
    ]);
    tray.setToolTip('Orphy - Pixel Music Widget');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
      else if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    });
  } catch (err) {
    console.warn('[Orphy] Tray creation skipped:', err.message);
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const info = await mediaProvider.getMediaInfo();
      if (mainWindow && !mainWindow.isDestroyed() && info) {
        mainWindow.webContents.send('media-update', info);
      }
    } catch (e) {
      // Ignore polling errors
    } finally {
      isPolling = false;
    }
  };

  poll();
  pollInterval = setInterval(poll, 2000);
}

// IPC Handlers
ipcMain.handle('get-media-info', async () => {
  try {
    return await mediaProvider.getMediaInfo();
  } catch (e) {
    return null;
  }
});

ipcMain.handle('media-control', async (event, action) => {
  try {
    await mediaProvider.control(action);
    const info = await mediaProvider.getMediaInfo();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('media-update', info);
    }
    return true;
  } catch (e) {
    return false;
  }
});

app.whenReady().then(() => {
  mediaProvider = MediaProvider.create();
  createWindow();
  createTray();
  startPolling();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (pollInterval) clearInterval(pollInterval);
});
