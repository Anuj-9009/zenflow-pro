import { useEffect } from 'react'
import { useQueue, ZenTrack } from '../services/QueueManager'

export default function UnifiedQueue() {
    const { queue, fetchSpotifyQueue } = useQueue()

    useEffect(() => {
        // Initial fetch
        fetchSpotifyQueue()
    }, [])

    const handleDragStart = (e: React.DragEvent, track: ZenTrack) => {
        // Send JSON data for Decks to consume
        const data = JSON.stringify(track)
        e.dataTransfer.setData('application/json', data)
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            <h3 style={{ padding: '10px 15px', margin: 0, borderBottom: '1px solid #333', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>
                Unified Queue
            </h3>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {queue.length === 0 && (
                    <div style={{ padding: '20px', opacity: 0.5, fontSize: '12px', textAlign: 'center' }}>
                        Queue Empty<br />(Play on Spotify to populate)
                    </div>
                )}

                {queue.map((item, i) => (
                    <div
                        key={item.id + i}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 15px', borderBottom: '1px solid #222',
                            cursor: 'grab', background: 'rgba(255,255,255,0.02)'
                        }}
                    >
                        <img src={item.cover || 'dist/assets/vinyl-icon.png'} style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>{item.artist}</div>
                            {item.bpm && (
                                <div style={{ fontSize: '10px', color: '#0ff' }}>{item.bpm} BPM</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
