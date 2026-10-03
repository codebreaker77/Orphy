const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const MediaProvider = require('./media/provider');

// Avoid cache locking & GPU sandbox issues on Windows
const userDataDir = path.join(app.getPath('temp'), 'orphy-cache');
app.setPath('userData', userDataDir);
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const CONFIG_PATH = path.join(userDataDir, 'config.json');

let islandWindow = null;
let bunnyWindow = null;
let tray = null;
let mediaProvider = null;
let heartbeatInterval = null;

const ISLAND_WIDTH = 452;
const ISLAND_HEIGHT = 150;
const BUNNY_WIDTH = 140;
const BUNNY_HEIGHT = 160;

// App configuration & state
let config = {
  islandX: null,
  islandY: null,
  bunnyX: null,
  bunnyY: null,
  isDocked: true,
  isLocked: false,
  alwaysOnTop: true
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...data };
      // If docked, ignore saved absolute bunny positions to prevent old/offscreen coordinates
      if (config.isDocked) {
        config.bunnyX = null;
        config.bunnyY = null;
      }
    }
  } catch (err) {
    console.warn('[Orphy] Could not load config, using defaults:', err.message);
  }
}

let saveTimer = null;
function saveConfig() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      if (islandWindow && !islandWindow.isDestroyed()) {
        const [ix, iy] = islandWindow.getPosition();
        config.islandX = ix;
        config.islandY = iy;
      }
      if (bunnyWindow && !bunnyWindow.isDestroyed()) {
        const [bx, by] = bunnyWindow.getPosition();
        config.bunnyX = bx;
        config.bunnyY = by;
      }
      await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
      console.warn('[Orphy] Could not save config:', err.message);
    }
  }, 800);
}

function clampToBounds(x, y, w, h) {
  const display = screen.getDisplayNearestPoint({ x, y }) || screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const clampedX = Math.max(workArea.x, Math.min(workArea.x + workArea.width - w, x));
  const clampedY = Math.max(workArea.y, Math.min(workArea.y + workArea.height - h, y));
  return { x: Math.round(clampedX), y: Math.round(clampedY), workArea };
}

function createWindows() {
  loadConfig();

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  const defaultTotalW = ISLAND_WIDTH + BUNNY_WIDTH + 14;
  const defaultStartX = Math.max(20, Math.round((screenW - defaultTotalW) / 2));
  const defaultStartY = 50;

  // Determine starting Island coordinates
  let startX = config.islandX != null ? config.islandX : defaultStartX;
  let startY = config.islandY != null ? config.islandY : defaultStartY;
  const clampedIsland = clampToBounds(startX, startY, ISLAND_WIDTH, ISLAND_HEIGHT);
  startX = clampedIsland.x;
  startY = clampedIsland.y;

  // Determine starting Bunny coordinates (mascot docks beside the island on the right)
  let bX = config.bunnyX != null ? config.bunnyX : startX + ISLAND_WIDTH + 6;
  let bY = config.bunnyY != null ? config.bunnyY : startY + 4;
  if (config.isDocked) {
    bX = startX + ISLAND_WIDTH + 6;
    bY = startY + 4;
  }
  const clampedBunny = clampToBounds(bX, bY, BUNNY_WIDTH, BUNNY_HEIGHT);
  bX = clampedBunny.x;
  bY = clampedBunny.y;

  // 1. Create Island Window (Music Card)
  // focusable: false prevents stealing focus from active apps/games/browsers!
  islandWindow = new BrowserWindow({
    title: 'Orphy',
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
    x: startX,
    y: startY,
    transparent: true,
    frame: false,
    alwaysOnTop: config.alwaysOnTop,
    focusable: false,
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
  // focusable: false ensures dragging/clicking never interrupts active windows
  bunnyWindow = new BrowserWindow({
    title: 'Orphy Bunny',
    width: BUNNY_WIDTH,
    height: BUNNY_HEIGHT,
    x: bX,
    y: bY,
    transparent: true,
    frame: false,
    alwaysOnTop: config.alwaysOnTop,
    focusable: false,
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
  bunnyWindow.show();
  bunnyWindow.setAlwaysOnTop(config.alwaysOnTop, 'screen-saver', 1);
  bunnyWindow.moveTop();

  // Enable initial mouse forwarding so transparent bounds don't block underlying windows
  bunnyWindow.setIgnoreMouseEvents(false);

  // Velocity tracking for docked drag-lag physics (throttled)
  let lastMoveTime = performance.now();
  let lastX = startX;
  let lastY = startY;
  let moveThrottleTimer = null;
  let stopDragTimer = null;

  islandWindow.on('move', () => {
    if (moveThrottleTimer) return;
    moveThrottleTimer = setTimeout(() => {
      moveThrottleTimer = null;
      if (!islandWindow || islandWindow.isDestroyed()) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime);
      const [ix, iy] = islandWindow.getPosition();

      const vx = ((ix - lastX) / dt) * 16;
      const vy = ((iy - lastY) / dt) * 16;
      lastMoveTime = now;
      lastX = ix;
      lastY = iy;

      if (config.isDocked && bunnyWindow && !bunnyWindow.isDestroyed()) {
        const dockPos = getDockedBunnyPosition();
        bunnyWindow.setPosition(dockPos.x, dockPos.y);
        bunnyWindow.webContents.send('island-drag-lag', { vx, vy });

        if (stopDragTimer) clearTimeout(stopDragTimer);
        stopDragTimer = setTimeout(() => {
          if (bunnyWindow && !bunnyWindow.isDestroyed()) {
            bunnyWindow.webContents.send('island-drag-lag', { vx: 0, vy: 0 });
          }
        }, 120);
      }

      saveConfig();
    }, 16);
  });

  islandWindow.on('closed', () => {
    islandWindow = null;
    if (bunnyWindow && !bunnyWindow.isDestroyed()) bunnyWindow.close();
  });

  bunnyWindow.on('closed', () => {
    bunnyWindow = null;
  });

  console.log(`[Orphy] Windows initialized: Island at (${startX}, ${startY}), Bunny at (${bX}, ${bY})`);
}

function createTray() {
  try {
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVDhPY/wPBAwUACYoTTAwMDAwYFHHgEkx4lOHzSZ0jbgMQTeAEhdiGDRqAMVpYBhgB4xGwaAFAF98BAlj7yYfAAAAAElFTkSuQmCC');
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Feed Carrot 🥕', click: feedCarrotToBunny },
      { label: 'Recall Bunny (Jetpack)', click: triggerRecall },
      { label: 'Summon to Cursor (Ctrl+Shift+B)', click: summonBunnyToCursor },
      { type: 'separator' },
      {
        label: 'Lock Position',
        type: 'checkbox',
        checked: config.isLocked,
        click: (menuItem) => toggleLock(menuItem.checked)
      },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: config.alwaysOnTop,
        click: (menuItem) => toggleAlwaysOnTop(menuItem.checked)
      },
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

function broadcastMedia(info) {
  if (islandWindow && !islandWindow.isDestroyed()) {
    islandWindow.webContents.send('media-update', info);
  }
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.webContents.send('media-update', info);
  }
}

function getDockedBunnyPosition(mode = 'expanded') {
  if (!islandWindow || islandWindow.isDestroyed()) return { x: 0, y: 0 };
  const [ix, iy] = islandWindow.getPosition();
  const currentIslandW = (mode === 'collapsed') ? 240 : ISLAND_WIDTH;
  return {
    x: ix + currentIslandW + 6,
    y: iy + 4
  };
}

function triggerRecall() {
  if (!islandWindow || !bunnyWindow || bunnyWindow.isDestroyed()) return;
  const dockPos = getDockedBunnyPosition();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  const recallData = {
    targetX: dockPos.x,
    targetY: dockPos.y,
    screenBounds: primaryDisplay.workArea,
    dockOnArrival: true
  };

  config.isDocked = true;
  saveConfig();
  bunnyWindow.webContents.send('start-recall', recallData);
}

function summonBunnyToCursor() {
  if (!bunnyWindow || bunnyWindow.isDestroyed()) return;
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  
  let targetX = cursor.x - Math.round(BUNNY_WIDTH / 2);
  let targetY = cursor.y - Math.round(BUNNY_HEIGHT / 2);

  const clamped = clampToBounds(targetX, targetY, BUNNY_WIDTH, BUNNY_HEIGHT);
  targetX = clamped.x;
  targetY = clamped.y;

  config.isDocked = false;
  saveConfig();

  const flightData = {
    targetX,
    targetY,
    screenBounds: display.workArea,
    dockOnArrival: false
  };

  bunnyWindow.webContents.send('start-recall', flightData);
}

function feedCarrotToBunny() {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.webContents.send('feed-carrot');
  }
}

function toggleLock(locked) {
  config.isLocked = locked;
  saveConfig();
  if (islandWindow && !islandWindow.isDestroyed()) {
    islandWindow.webContents.send('lock-changed', locked);
  }
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.webContents.send('lock-changed', locked);
  }
}

function toggleAlwaysOnTop(val) {
  config.alwaysOnTop = val;
  saveConfig();
  if (islandWindow && !islandWindow.isDestroyed()) {
    islandWindow.setAlwaysOnTop(val);
  }
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.setAlwaysOnTop(val, 'screen-saver', 1);
    bunnyWindow.moveTop();
  }
}

function setupMediaMonitoring() {
  mediaProvider = MediaProvider.create();

  // Instant event-driven updates from persistent daemon
  if (mediaProvider.onUpdate) {
    mediaProvider.onUpdate((info) => {
      broadcastMedia(info);
    });
  }

  // Low frequency heartbeat (every 5 seconds) to ensure sync
  heartbeatInterval = setInterval(async () => {
    try {
      const info = await mediaProvider.getMediaInfo();
      broadcastMedia(info);
    } catch (e) {}
  }, 5000);
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

ipcMain.handle('media-control', async (_event, action, arg) => {
  try {
    await mediaProvider.control(action, arg);
    if (action === 'seek' && typeof arg === 'number' && mediaProvider.latestMedia) {
      mediaProvider.latestMedia.position = arg;
      broadcastMedia(mediaProvider.latestMedia);
    }
    const info = await mediaProvider.getMediaInfo();
    broadcastMedia(info);
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('recall-bunny', () => {
  triggerRecall();
  return true;
});

// Move Bunny Window on screen (with screen clamping)
ipcMain.handle('set-bunny-position', (_event, { x, y }) => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    config.isDocked = false; // Detached when moved manually
    const clamped = clampToBounds(x, y, BUNNY_WIDTH, BUNNY_HEIGHT);
    bunnyWindow.setPosition(clamped.x, clamped.y);
    saveConfig();
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
  config.isDocked = true;
  saveConfig();
  return true;
});

ipcMain.handle('feed-carrot', () => {
  feedCarrotToBunny();
  return true;
});

ipcMain.handle('get-lock-state', () => {
  return config.isLocked;
});

// Selective click-through for transparent companion bounds
ipcMain.handle('set-bunny-ignore-mouse', (_event, ignore) => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
  return true;
});

// Dynamic Island & Mascot Physical Coordination
ipcMain.on('eq-energy', (_event, data) => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.webContents.send('eq-energy', data);
  }
});

ipcMain.on('island-hover', (_event, data) => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.webContents.send('island-hover', data);
  }
});

ipcMain.on('island-mode', (_event, mode) => {
  if (bunnyWindow && !bunnyWindow.isDestroyed()) {
    bunnyWindow.webContents.send('island-mode', mode);
    if (config.isDocked && islandWindow && !islandWindow.isDestroyed()) {
      const dockPos = getDockedBunnyPosition(mode);
      bunnyWindow.setPosition(dockPos.x, dockPos.y);
    }
  }
});

// Context Menus
ipcMain.handle('open-island-context-menu', () => {
  if (!islandWindow || islandWindow.isDestroyed()) return;
  const menu = Menu.buildFromTemplate([
    {
      label: 'Lock Position',
      type: 'checkbox',
      checked: config.isLocked,
      click: (item) => toggleLock(item.checked)
    },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: config.alwaysOnTop,
      click: (item) => toggleAlwaysOnTop(item.checked)
    },
    { type: 'separator' },
    { label: 'Feed Carrot 🥕', click: feedCarrotToBunny },
    { label: 'Call Bunny (Return)', click: triggerRecall },
    { label: 'Summon to Cursor (Ctrl+Shift+B)', click: summonBunnyToCursor },
    { type: 'separator' },
    {
      label: 'Hide Orphy',
      click: () => {
        if (islandWindow) islandWindow.hide();
        if (bunnyWindow) bunnyWindow.hide();
      }
    },
    { label: 'Quit Orphy', click: () => app.quit() }
  ]);
  menu.popup({ window: islandWindow });
});

ipcMain.handle('open-bunny-context-menu', () => {
  if (!bunnyWindow || bunnyWindow.isDestroyed()) return;
  const menu = Menu.buildFromTemplate([
    { label: 'Feed Carrot 🥕', click: feedCarrotToBunny },
    { label: 'Return to Island (Jetpack)', click: triggerRecall },
    { label: 'Summon to Cursor (Ctrl+Shift+B)', click: summonBunnyToCursor },
    { type: 'separator' },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: config.alwaysOnTop,
      click: (item) => toggleAlwaysOnTop(item.checked)
    },
    { type: 'separator' },
    { label: 'Quit Orphy', click: () => app.quit() }
  ]);
  menu.popup({ window: bunnyWindow });
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

// App Lifecycle
app.whenReady().then(() => {
  setupMediaMonitoring();
  createWindows();
  createTray();

  // Register Global Shortcut: Ctrl+Shift+B summons bunny to cursor
  try {
    globalShortcut.register('CommandOrControl+Shift+B', () => {
      summonBunnyToCursor();
    });
  } catch (err) {
    console.warn('[Orphy] Failed to register global shortcut:', err.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (mediaProvider && mediaProvider.destroy) {
    mediaProvider.destroy();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
