// Electron Preload
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  // Media control APIs
  media: {
    getMetadata: () => ipcRenderer.invoke('media:getMetadata'),
    playPause: () => ipcRenderer.invoke('media:playPause'),
    next: () => ipcRenderer.invoke('media:next'),
    previous: () => ipcRenderer.invoke('media:previous'),
    volumeUp: () => ipcRenderer.invoke('media:volumeUp'),
    volumeDown: () => ipcRenderer.invoke('media:volumeDown'),
    seek: (pos: number) => ipcRenderer.invoke('media:seek', pos),
    setVolume: (level: number) => ipcRenderer.invoke('media:setVolume', level),
    getVolume: () => ipcRenderer.invoke('media:getVolume'),
    getPlaylists: () => ipcRenderer.invoke('media:getPlaylists'),
  },
  window: { // New Window Controls
    onMediaUpdate: (callback: (data: any) => void) => ipcRenderer.on('media-update', (_event, value) => callback(value)),
    controlMedia: (action: string) => ipcRenderer.invoke('media-control', action),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleMiniPlayer: (isMini: boolean) => ipcRenderer.invoke('window:toggleMiniPlayer', isMini)
  }
})

console.log('Preload script loaded successfully')

