import { useEffect, useState } from 'react'
import { SpotifyImporter, PlaylistSummary } from '../services/SpotifyImporter'

interface ImportModalProps {
    onClose: () => void
}

export default function ImportModal({ onClose }: ImportModalProps) {
    const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        SpotifyImporter.getUserPlaylists().then(data => {
            setPlaylists(data)
            setLoading(false)
        })
    }, [])

    const handleImport = async (id: string) => {
        setLoading(true) // Re-use loading state for "Importing..."
        await SpotifyImporter.importPlaylist(id)
        onClose()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                width: '600px', maxHeight: '80vh',
                background: '#121212',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '24px',
                overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '20px'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Import from Spotify</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                        {playlists.map(p => (
                            <div key={p.id}
                                onClick={() => handleImport(p.id)}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.05)',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <img src={p.artwork || 'dist/assets/vinyl-icon.png'} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                                <div style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{p.count} Tracks</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
