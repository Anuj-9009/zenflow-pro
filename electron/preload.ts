// Electron Preload - Must use CommonJS for Electron
const { contextBridge, ipcRenderer } = require('electron')

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
        seek: (position) => ipcRenderer.invoke('media:seek', position)
    }
})

console.log('Preload script loaded successfully')
