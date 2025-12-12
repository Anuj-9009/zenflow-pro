export interface MediaControls {
    getMetadata: () => Promise<any>
    playPause: () => Promise<void>
    next: () => Promise<void>
    previous: () => Promise<void>
    volumeUp: () => Promise<void>
    volumeDown: () => Promise<void>
    seek: (position: number) => Promise<void>
    setVolume: (level: number) => Promise<void>
    getVolume: () => Promise<number>
    getPlaylists: () => Promise<{ name: string, id: string }[]>
}

export interface WindowControls {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    toggleMiniPlayer: (isMini: boolean) => Promise<void>
    onMediaUpdate: (callback: (data: any) => void) => void
    controlMedia: (action: string) => Promise<any>
}

export interface ElectronAPI {
    platform: string
    media: MediaControls
    window: WindowControls
}

declare global {
    interface Window {
        electron: ElectronAPI
    }
}
