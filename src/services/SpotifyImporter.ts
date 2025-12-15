import { SpotifyBridge } from './SpotifyBridge'
import { ZenTrack, useQueue } from './QueueManager'

export interface PlaylistSummary {
    id: string
    name: string
    artwork: string
    count: number
}

class SpotifyImporterService {

    async getUserPlaylists(): Promise<PlaylistSummary[]> {
        if (!SpotifyBridge.token) return []
        try {
            const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
                headers: { Authorization: `Bearer ${SpotifyBridge.token}` }
            })
            const data = await res.json()
            return data.items.map((p: any) => ({
                id: p.id,
                name: p.name,
                artwork: p.images[0]?.url,
                count: p.tracks.total
            }))
        } catch (e) {
            console.error("Failed to fetch playlists", e)
            return []
        }
    }

    async importPlaylist(playlistId: string) {
        if (!SpotifyBridge.token) return
        console.log(`Starting Import for ${playlistId}...`)

        const addBatch = useQueue.getState().addItem // We'll add one by one or batch update? State has addItem (single).
        // Better to use a batch add method if we had one, but we updated queue directly in QueueManager.
        // Let's use the QueueManager's import logic which we sort of duplicated, OR rewrite it here properly with BPM.

        // Let's do it here properly as "SpotifyImporter"
        try {
            // 1. Fetch Tracks
            const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
                headers: { Authorization: `Bearer ${SpotifyBridge.token}` }
            })
            const data = await res.json()

            if (!data.items) return

            // 2. Map to ZenTrack (Initial)
            const tracks: ZenTrack[] = data.items.map((item: any) => {
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

            // 3. BATCH Fetch Audio Features (BPM/Key)
            // Spotify allows comma separated IDs
            const ids = tracks.map(t => t.id).join(',')
            const featuresRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
                headers: { Authorization: `Bearer ${SpotifyBridge.token}` }
            })
            const featuresData = await featuresRes.json()
            const featuresMap = new Map()
            featuresData.audio_features.forEach((f: any) => {
                if (f) featuresMap.set(f.id, f)
            })

            // 4. Merge BPM into ZenTracks
            const finalTracks = tracks.map(t => {
                const f = featuresMap.get(t.id)
                return {
                    ...t,
                    bpm: f ? Math.round(f.tempo) : 0,
                    key: f ? f.key : undefined
                }
            })

            // 5. Update Global Queue
            // usage of direct setState if useQueue exported setters, but it uses create.
            // We can use useQueue.setState({ queue: ... }) directly from outside components if exported?
            // Or we add a batchAdd action.
            // For now, let's use setState directly on the store hook which is also the store instance in Zustand (vanilla)
            useQueue.setState((prev) => ({
                queue: [...prev.queue, ...finalTracks]
            }))

            console.log(`[SpotifyImporter] Imported ${finalTracks.length} tracks with BPM data.`)

        } catch (e) {
            console.error("Import Failed", e)
        }
    }
}

export const SpotifyImporter = new SpotifyImporterService()
