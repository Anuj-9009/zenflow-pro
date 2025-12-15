// PlaylistView - Detailed track list for a selected playlist
import React, { useState, useEffect } from 'react'
import { TrackRow } from './TrackRow'
import { SpotifyBridge } from '../../services/SpotifyBridge'

interface PlaylistViewProps {
    playlist: {
        id: string
        name: string
        artUrl?: string
        trackCount?: number
    }
    onBack: () => void
    onQueueTrack: (track: any) => void
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onBack, onQueueTrack }) => {
    const [tracks, setTracks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTracks()
    }, [playlist.id])

    const loadTracks = async () => {
        setLoading(true)
        try {
            // Fetch tracks from Spotify API
            if (SpotifyBridge.token) {
                const res = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=50`, {
                    headers: { Authorization: `Bearer ${SpotifyBridge.token}` }
                })
                const data = await res.json()
                const items = data.items?.map((item: any) => ({
                    id: item.track?.id,
                    name: item.track?.name,
                    artist: item.track?.artists?.[0]?.name || 'Unknown',
                    album: item.track?.album?.name,
                    duration: item.track?.duration_ms || 0,
                    artUrl: item.track?.album?.images?.[0]?.url,
                    uri: item.track?.uri
                })) || []
                setTracks(items)
            }
        } catch (e) {
            console.error('Failed to load playlist tracks:', e)
        }
        setLoading(false)
    }

    const handlePlayAll = () => {
        if (tracks.length > 0) {
            // Play first track, queue the rest
            const [first, ...rest] = tracks
            // Trigger play on first track
            const TrackRowComponent = document.querySelector('[data-track-index="0"] button')
            if (TrackRowComponent) (TrackRowComponent as HTMLButtonElement).click()

            // Queue the rest
            rest.forEach(track => onQueueTrack(track))
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with blur backdrop */}
            <div className="relative h-64 flex-shrink-0 overflow-hidden">
                {/* Background blur */}
                {playlist.artUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-40"
                        style={{ backgroundImage: `url(${playlist.artUrl})` }}
                    />
                )}

                {/* Content */}
                <div className="relative z-10 h-full flex items-end p-8 bg-gradient-to-t from-black/80 to-transparent">
                    <button
                        onClick={onBack}
                        className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M15 18L9 12L15 6" />
                        </svg>
                    </button>

                    <div className="flex items-end gap-6">
                        {playlist.artUrl && (
                            <img
                                src={playlist.artUrl}
                                alt=""
                                className="w-40 h-40 rounded-lg shadow-2xl"
                            />
                        )}
                        <div>
                            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Playlist</div>
                            <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
                            <div className="text-white/50">{tracks.length} tracks</div>
                        </div>
                    </div>

                    <button
                        onClick={handlePlayAll}
                        className="ml-auto px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <svg width="16" height="18" viewBox="0 0 12 14" fill="currentColor">
                            <path d="M0 0L12 7L0 14V0Z" />
                        </svg>
                        Play All
                    </button>
                </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-white/50">
                        Loading tracks...
                    </div>
                ) : tracks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-white/50">
                        No tracks found
                    </div>
                ) : (
                    <div className="space-y-1">
                        {tracks.map((track, index) => (
                            <div key={track.id || index} data-track-index={index}>
                                <TrackRow
                                    track={track}
                                    index={index}
                                    onQueue={onQueueTrack}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default React.memo(PlaylistView)
