import { SpotifyBridge } from './SpotifyBridge'
import { create } from 'zustand'

// ZenFlow Master Interface
export interface ZenTrack {
    id: string
    title: string
    artist: string
    cover: string
    source: 'local' | 'spotify'
    uri: string
    bpm: number
    duration: number // Kept for utility, though prompt didn't explicitly list it, it's implied for playback.
}

interface QueueState {
    queue: ZenTrack[]
    history: ZenTrack[]
    current: ZenTrack | null
    fetchSpotifyQueue: () => Promise<void>
    addItem: (item: ZenTrack) => void
    playNext: () => ZenTrack | null
    importPlaylist: (playlistId: string) => Promise<void>
}

export const useQueue = create<QueueState>((set, get) => ({
    queue: [],
    history: [],
    current: null,

    fetchSpotifyQueue: async () => {
        if (!SpotifyBridge.token) return
        try {
            const res = await fetch('https://api.spotify.com/v1/me/player/queue', {
                headers: { Authorization: `Bearer ${SpotifyBridge.token}` }
            })
            const data = await res.json()
            if (data.queue) {
                const mapped: ZenTrack[] = data.queue.map((t: any) => ({
                    id: t.id,
                    uri: t.uri,
                    title: t.name,
                    artist: t.artists[0].name,
                    cover: t.album.images[0]?.url,
                    duration: t.duration_ms,
                    source: 'spotify',
                    bpm: 0
                }))
                // Deduplicate or Merge
                set({ queue: mapped })
            }
        } catch (e) {
            console.error('Queue Fetch Error', e)
        }
    },

    addItem: (item) => set((state) => ({ queue: [...state.queue, item] })),

    playNext: () => {
        const state = get()
        if (state.queue.length === 0) return null

        const next = state.queue[0]
        const remaining = state.queue.slice(1)

        set({
            current: next,
            queue: remaining,
            history: [...state.history, state.current].filter(Boolean) as ZenTrack[]
        })

        return next
    },

    // Phase 2: Import Playlist
    importPlaylist: async (playlistId: string) => {
        if (!SpotifyBridge.token) return
        try {
            const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
                headers: { Authorization: `Bearer ${SpotifyBridge.token}` }
            })
            const data = await res.json()
            if (data.items) {
                const mapped: ZenTrack[] = data.items.map((item: any) => {
                    const t = item.track
                    return {
                        id: t.id,
                        uri: t.uri,
                        title: t.name,
                        artist: t.artists[0].name,
                        cover: t.album.images[0]?.url,
                        duration: t.duration_ms,
                        source: 'spotify',
                        bpm: 0
                    }
                })
                set((state) => ({ queue: [...state.queue, ...mapped] }))
                console.log(`Imported ${mapped.length} tracks from playlist`)
            }
        } catch (e) {
            console.error("Playlist Import Failed", e)
        }
    }
}))
