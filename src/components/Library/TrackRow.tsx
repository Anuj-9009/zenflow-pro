import React from 'react'
import { usePlayer } from '../../context/PlayerContext'

// Simplified Track Interface
interface Track {
    id?: string
    title: string
    artist: string
    image?: string
    duration?: number
    url?: string
}

interface TrackRowProps {
    track: Track
    index: number
    onQueue?: (track: Track) => void // Optional
    showToast?: (message: string) => void // Optional
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, index, showToast }) => {
    const { loadTrack } = usePlayer()

    const handleLoad = (deckId: 'A' | 'B') => {
        // Ensure ID string
        const safeTrack = {
            ...track,
            id: track.id || track.title
        }
        loadTrack(safeTrack, deckId)
        showToast?.(`Loaded to Deck ${deckId}`)
    }

    return (
        <div className="flex items-center gap-4 p-2 hover:bg-white/10 rounded transition-colors group">
            <div className="w-8 text-white/30 font-mono text-sm">{index + 1}</div>

            {/* Art */}
            <div className="w-10 h-10 bg-white/5 rounded overflow-hidden">
                {track.image && <img src={track.image} alt="" className="w-full h-full object-cover" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-white">{track.title}</div>
                <div className="text-sm text-white/50 truncate">{track.artist}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => handleLoad('A')}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded text-xs font-bold hover:bg-blue-500 hover:text-white"
                >
                    A
                </button>
                <button
                    onClick={() => handleLoad('B')}
                    className="px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded text-xs font-bold hover:bg-orange-500 hover:text-white"
                >
                    B
                </button>
            </div>
        </div>
    )
}

export default React.memo(TrackRow)
