// Slowed + Reverb Tools UI
import { useStore } from '../store/useStore'

export default function SlowedView() {
    const {
        playbackSpeed, setPlaybackSpeed,
        reverbAmount, setReverbAmount,
        isLocalMode, track, colors
    } = useStore()

    return (
        <div style={{ padding: '40px', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '10px' }}>Slowed + Reverb</h1>
            <p style={{ fontSize: '18px', opacity: 0.6, marginBottom: '60px' }}>
                Drag & Drop any audio file here to transform it.
            </p>

            {/* Visual Indicator */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '24px',
                padding: '40px',
                marginBottom: '40px',
                border: isLocalMode ? `1px solid ${colors.primary}` : '1px dashed rgba(255,255,255,0.1)',
                textAlign: 'center'
            }}>
                {isLocalMode ? (
                    <>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>💿</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{track.name}</div>
                        <div style={{ opacity: 0.6 }}>Now Playing Locally</div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.3 }}>📂</div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>Drop a Song File Here</div>
                    </>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'grid', gap: '40px' }}>

                {/* Speed Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <label style={{ fontSize: '18px', fontWeight: 600 }}>Speed / Pitch</label>
                        <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>{(playbackSpeed * 100).toFixed(0)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.5" max="1.5" step="0.01"
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: colors.primary }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
                        <span>Slow (0.5x)</span>
                        <span>Normal (1.0x)</span>
                        <span>Nightcore (1.5x)</span>
                    </div>
                </div>

                {/* Reverb Control */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <label style={{ fontSize: '18px', fontWeight: 600 }}>Ethereal Reverb</label>
                        <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>{(reverbAmount * 100).toFixed(0)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={reverbAmount}
                        onChange={(e) => setReverbAmount(parseFloat(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: colors.secondary }}
                    />
                </div>
            </div>
        </div>
    )
}
