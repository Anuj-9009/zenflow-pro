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
  window: {
    onMediaUpdate: (callback: (data: any) => void) => ipcRenderer.on('media-update', (_event, value) => callback(value)),
    controlMedia: (action: string) => ipcRenderer.invoke('media-control', action),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleMiniPlayer: (isMini: boolean) => ipcRenderer.invoke('window:toggleMiniPlayer', isMini),
    onSpotifyCode: (callback: (code: string) => void) => ipcRenderer.on('spotify-code', (_event, code) => callback(code)),
    onSpotifyToken: (callback: (token: string) => void) => ipcRenderer.on('spotify-token', (_event, token) => callback(token)),
    storeCodeVerifier: (verifier: string) => ipcRenderer.invoke('store-code-verifier', verifier),
    resizeWidget: (width: number, height: number) => ipcRenderer.invoke('window:resizeWidget', { width, height }),
    onSyncState: (callback: (state: any) => void) => ipcRenderer.on('sync-state', (_event, state) => callback(state)),
    sendSyncState: (state: any) => ipcRenderer.invoke('window:sendSyncState', state),
    // Performance: Focus state for background throttling
    onFocusChange: (callback: (focused: boolean) => void) => ipcRenderer.on('app-focus-change', (_event, focused) => callback(focused))
  },
  shell: {
    // Must use IPC - shell module not available in preload sandboxed context
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },
  // Audio Mirror Engine - Resolves Spotify tracks to playable YouTube audio
  audio: {
    resolveAudio: (query: string) => ipcRenderer.invoke('resolve-audio', query)
  }
})

console.log('Preload script loaded successfully')

