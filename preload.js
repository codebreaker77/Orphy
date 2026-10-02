const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orphy', {
  // Media APIs
  getMediaInfo: () => ipcRenderer.invoke('get-media-info'),
  mediaControl: (action) => ipcRenderer.invoke('media-control', action),
  onMediaUpdate: (callback) => {
    ipcRenderer.on('media-update', (_event, data) => callback(data));
  },

  // Island & Bunny window coordination
  recallBunny: () => ipcRenderer.invoke('recall-bunny'),
  onStartRecall: (callback) => {
    ipcRenderer.on('start-recall', (_event, data) => callback(data));
  },
  setBunnyPosition: (x, y) => ipcRenderer.invoke('set-bunny-position', { x, y }),
  getBunnyPosition: () => ipcRenderer.invoke('get-bunny-position'),
  getIslandPosition: () => ipcRenderer.invoke('get-island-position'),
  getScreenBounds: () => ipcRenderer.invoke('get-screen-bounds'),
  bunnyDocked: () => ipcRenderer.invoke('bunny-docked'),
  notifyIslandMoved: (x, y) => ipcRenderer.invoke('island-moved', { x, y }),
  
  // Close / Hide
  quitApp: () => ipcRenderer.invoke('quit-app')
});
