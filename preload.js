const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orphy', {
  getMediaInfo: () => ipcRenderer.invoke('get-media-info'),
  mediaControl: (action) => ipcRenderer.invoke('media-control', action),
  onMediaUpdate: (callback) => {
    ipcRenderer.on('media-update', (_event, data) => callback(data));
  },
});
