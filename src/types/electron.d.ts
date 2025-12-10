// TypeScript declarations for Electron APIs
export { }

declare global {
    interface Window {
        electron: {
            platform: string
            media: {
                getMetadata: () => Promise<{
                    name: string
                    artist: string
                    album: string
                    artUrl: string | null
                    duration: number
                    position: number
                    isPlaying: boolean
                } | null>
                playPause: () => Promise<void>
                next: () => Promise<void>
                previous: () => Promise<void>
                volumeUp: () => Promise<void>
                volumeDown: () => Promise<void>
            }
        }
    }
}
