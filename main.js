const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const MediaProvider = require('./media/provider');

// Avoid cache locking & GPU sandbox issues on Windows
app.setPath('userData', path.join(app.getPath('temp'), 'orphy-cache'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');

let islandWindow = null;
let bunnyWindow = null;
let tray = null;
let mediaProvider = null;
let pollInterval = null;
let isPolling = false;
let isDocked = true;

const ISLAND_WIDTH = 432;
const ISLAND_HEIGHT = 135;
const BUNNY_WIDTH = 140;
const BUNNY_HEIGHT = 160;

function createWindows() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  // Calculate starting positions (Island centered near top, Bunny docked to its right)
  const totalW = ISLAND_WIDTH + BUNNY_WIDTH + 8;
  const startX = Math.max(20, Math.round((screenW - totalW) / 2));
  const startY = 50;

  // 1. Create Island Window (Music Card)
  islandWindow = new BrowserWindow({
    title: 'Orphy',
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
    x: startX,
    y: startY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  islandWindow.loadFile(path.join(__dirname, 'src', 'island.html'));

  // 2. Create Bunny Window (Companion)
  bunnyWindow = new BrowserWindow({
    title: 'Orphy Bunny',
    width: BUNNY_WIDTH,
    height: BUNNY_HEIGHT,
    x: startX + ISLAND_WIDTH + 4,
    y: startY - 10,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  bunnyWindow.loadFile(path.join(__dirname, 'src', 'bunny.html'));

  // Keep both windows on top
  islandWindow.setAlwaysOnTop(true);
  bunnyWindow.setAlwaysOnTop(true);

  // When user moves the Island, docked bunny follows smoothly!
  islandWindow.on('move', () => {
    if (isDocked && islandWindow && bunnyWindow && !bunnyWindow.isDestroyed()) {
      const [ix, iy] = islandWindow.getPosition();
      bunnyWindow.setPosition(ix + ISLAND_WIDTH + 4, iy - 10);
    }
  });

  islandWindow.on('closed', () => {
    islandWindow = null;
    if (bunnyWindow && !bunnyWindow.isDestroyed()) bunnyWindow.close();
  });

  bunnyWindow.on('closed', () => {
    bunnyWindow = null;
  });

  console.log(`[Orphy] Windows initialized: Island at (${startX}, ${startY}), Bunny docked`);
}

function createTray() {
  try {
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVDhPY/wPBAwUACYoTTAwMDAwYFHHgEkx4lOHzSZ0jbgMQTeAEhdiGDRqAMVpYBhgB4xGwaAFAF98BAlj7yYfAAAAAElFTkSuQmCC');
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Recall Bunny', click: triggerRecall },
      { type: 'separator' },
      { label: 'Show All', click: () => {
        if (islandWindow) islandWindow.show();
        if (bunnyWindow) bunnyWindow.show();
      }},
      { label: 'Hide All', click: () => {
        if (islandWindow) islandWindow.hide();
        if (bunnyWindow) bunnyWindow.hide();
      }},
      { type: 'separator' },
      { label: 'Quit Orphy', click: () => app.quit() }
    ]);

    tray.setToolTip('Orphy - Pixel Music Widget');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (islandWindow && islandWindow.isVisible()) {
        islandWindow.hide();
        if (bunnyWindow) bunnyWindow.hide();
      } else {
        if (islandWindow) islandWindow.show();
        if (bunnyWindow) bunnyWindow.show();
      }
    });
  } catch (err) {
    console.warn('[Orphy] Tray creation skipped:', err.message);
  }
}

function triggerRecall() {
  if (!islandWindow || !bunnyWindow || bunnyWindow.isDestroyed()) return;
  const [ix, iy] = islandWindow.getPosition();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  const recallData = {
    targetX: ix + ISLAND_WIDTH + 4,
    targetY: iy - 10,
    screenBounds: primaryDisplay.workArea
  };

  bunnyWindow.webContents.send('start-recall', recallData);
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const info = await mediaProvider.getMediaInfo();
      // Broadcast to both Island and Bunny
      if (islandWindow && !islandWindow.isDestroyed()) {
        islandWindow.webContents.send('media-update', info);
      }
      if (bunnyWindow && !bunnyWindow.isDestroyed()) {
        bunnyWindow.webContents.send('media-update', info);
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

// ==========================================
// IPC HANDLERS
// ==========================================
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
    if (islandWindow && !islandWindow.isDestroyed()) {
      islandWindow.webContents.send('media-update', info);
    }
    if (bunnyWindow && !bunnyWindow.isDestroyed()) {
      bunnyWindow.webContents.send('media-update', info);
    }
    return true;
  } catch (e) {
    return false;
  }
});

// Recall triggered from Island button
ipcMain.handle('recall-bunny', () => {
  triggerRecall();
  return true;
});

// Move Bunny Window on screen
ipcMain.handle('set-bunny-position', (_event, { x, y }) => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    isDocked = false; // Detached when moved manually
    bunnyWindow.setPosition(Math.round(x), Math.round(y));
  }
  return true;
});

ipcMain.handle('get-bunny-position', () => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    const [x, y] = bunnyWindow.getPosition();
    return { x, y };
  }
  return { x: 0, y: 0 };
});

ipcMain.handle('get-island-position', () => {
  if (islandWindow && !islandWindow.isDestroyed()) {
    const [x, y] = islandWindow.getPosition();
    return { x, y };
  }
  return { x: 0, y: 0 };
});

ipcMain.handle('get-screen-bounds', () => {
  return screen.getPrimaryDisplay().workArea;
});

ipcMain.handle('bunny-docked', () => {
  isDocked = true;
  return true;
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

// App Lifecycle
app.whenReady().then(() => {
  mediaProvider = MediaProvider.create();
  createWindows();
  createTray();
  startPolling();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (pollInterval) clearInterval(pollInterval);
});
