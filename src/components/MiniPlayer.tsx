import { useStore } from '../store/useStore'
import { djEngine } from '../audio/DJEngine'

export default function MiniPlayer() {
    const { track, isPlaying, colors } = useStore()

    return (
        <div style={{
            position: 'fixed', bottom: '20px', right: '20px',
            width: '300px', height: '100px',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '50px', // Pill shape
            border: `1px solid ${colors.primary}40`,
            display: 'flex', alignItems: 'center', padding: '10px 20px',
            gap: '15px',
            boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
            zIndex: 9999,
            userSelect: 'none'
        }}>
            {/* Art / Vinyl */}
            <div style={{
                width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden',
                animation: isPlaying ? 'spin 5s linear infinite' : 'none',
                boxShadow: `0 0 10px ${colors.primary}40`,
                flexShrink: 0
            }}>
                <img
                    src={track.artUrl || 'dist/assets/vinyl-icon.png'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>

            {/* Info */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.name || "ZenFlow"}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {track.artist || "Ready"}
                </div>
                {/* Progress Bar Mock */}
                <div style={{ width: '100%', height: '2px', background: '#333', marginTop: '5px', borderRadius: '2px' }}>
                    <div style={{ width: '50%', height: '100%', background: colors.primary }} />
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => isPlaying ? djEngine.pause('A') : djEngine.play('A')}
                    style={{
                        background: 'none', border: 'none', color: '#fff',
                        fontSize: '24px', cursor: 'pointer',
                        textShadow: `0 0 10px ${colors.primary}`
                    }}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
