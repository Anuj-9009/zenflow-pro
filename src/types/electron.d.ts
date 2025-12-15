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

// Mirror Engine - YouTube audio resolver for full DJ processing
export interface AudioMirror {
    resolveAudio: (query: string) => Promise<{
        success: boolean
        url?: string
        duration?: number
        title?: string
        thumbnail?: string
        error?: string
    }>
}

export interface ElectronAPI {
    platform: string
    media: MediaControls
    window: WindowControls
    shell?: { openExternal: (url: string) => Promise<void> }
    audio?: AudioMirror
}

declare global {
    interface Window {
        electron: ElectronAPI
    }
}
