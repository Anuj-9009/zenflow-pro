import { useState } from 'react'
import { SpotifyBridge } from '../services/SpotifyBridge'
import { useStore } from '../store/useStore'

export default function SpotifySearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const { colors } = useStore()
    const [status, setStatus] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!SpotifyBridge.token) {
            SpotifyBridge.login()
            return
        }
        setStatus('Searching...')
        const tracks = await SpotifyBridge.search(query)
        setResults(tracks)
        setStatus('')
    }

    const onDragStart = (e: React.DragEvent, track: any) => {
        // Send Spotify Data
        const data = JSON.stringify({
            type: 'spotify',
            name: track.name,
            artist: track.artists[0].name,
            uri: track.uri,
            artUrl: track.album.images[0]?.url,
            duration: track.duration_ms
        })
        e.dataTransfer.setData('application/json', data)
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div style={{ padding: '0 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search Spotify..."
                    style={{
                        flex: 1, padding: '12px 20px', borderRadius: '50px', border: 'none',
                        background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px',
                        outline: 'none'
                    }}
                />
                <button type="submit" style={{ padding: '0 24px', borderRadius: '50px', background: colors.primary, color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer' }}>GO</button>
            </form>

            {status && <div style={{ opacity: 0.6 }}>{status}</div>}

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', paddingBottom: '100px' }}>
                {results.map(track => (
                    <div
                        key={track.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, track)}
                        style={{
                            background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px',
                            cursor: 'grab', transition: 'background 0.2s',
                            display: 'flex', flexDirection: 'column', gap: '10px'
                        }}
                        className="spotify-card"
                    >
                        <div style={{ width: '100%', paddingTop: '100%', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={track.album.images[0]?.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                            <div style={{ fontSize: '13px', opacity: 0.6 }}>{track.artists[0].name}</div>
                        </div>
                    </div>
                ))}
            </div>

            {!SpotifyBridge.token && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button onClick={() => SpotifyBridge.login()} style={{ background: '#1DB954', color: 'white', padding: '12px 30px', borderRadius: '30px', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
                        CONNECT SPOTIFY
                    </button>
                </div>
            )}
        </div>
    )
}
