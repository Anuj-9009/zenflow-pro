import { useEffect, useState } from 'react'

interface WidgetState {
    track: { name: string, artist: string, artUrl: string }
    isPlaying: boolean
}

export default function Widget() {
    const [expanded, setExpanded] = useState(false)
    const [state, setState] = useState<WidgetState>({
        track: { name: 'ZenFlow', artist: 'Ready', artUrl: '' },
        isPlaying: false
    })

    // Listen for State from Main Window
    useEffect(() => {
        if ((window as any).electron?.window?.onSyncState) {
            (window as any).electron.window.onSyncState((data: WidgetState) => {
                setState(data)
            })
        }

        // Initial Resize (Orb)
        requestAnimationFrame(() => {
            (window as any).electron?.resizeWidget(60, 60)
        })
    }, [])

    const handleMouseEnter = () => {
        setExpanded(true);
        // Expand to Player
        (window as any).electron?.resizeWidget(300, 100)
    }

    const handleMouseLeave = () => {
        setExpanded(false);
        // Shrink to Orb
        (window as any).electron?.resizeWidget(60, 60)
    }

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Send command back to main? Or just use global media key logic?
        // Ideally we invoke IPC to Main to toggle playback on DJEngine (which is in Main Window...).
        // Wait, DJ Engine is in Main Window Renderer. 
        // We need IPC: Widget Renderer -> Main Process -> Main Window Renderer.
        // Or simpler: We just use System Media Keys? 
        // Or we use 'media:playPause' which triggers AppleScript? 
        // Let's use 'media:playPause' from preload which calls AppleScript/System.
        (window as any).electron?.media?.playPause()
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                width: '100vw', height: '100vh', // Fill the transparent window
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
            }}
        >
            {/* The Shape */}
            <div style={{
                width: expanded ? '280px' : '50px',
                height: expanded ? '80px' : '50px',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
                display: 'flex', alignItems: 'center', padding: expanded ? '0 15px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                gap: '15px',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-ish
                cursor: 'pointer',
                userSelect: 'none'
            }}>
                {/* Art / Orb */}
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    animation: state.isPlaying ? 'spin 5s linear infinite' : 'none',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <img
                        src={state.track.artUrl || 'dist/assets/vinyl-icon.png'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                </div>

                {/* Info (Visible only when expanded) */}
                <div style={{
                    flex: 1, overflow: 'hidden',
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    display: expanded ? 'block' : 'none'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                        {state.track.name}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.7, color: 'white' }}>
                        {state.track.artist}
                    </div>
                </div>

                {/* Controls */}
                <div
                    onClick={handlePlayPause}
                    style={{
                        opacity: expanded ? 1 : 0,
                        pointerEvents: expanded ? 'auto' : 'none',
                        transition: 'opacity 0.2s',
                        color: 'white', fontSize: '20px',
                        display: expanded ? 'block' : 'none'
                    }}>
                    {state.isPlaying ? '⏸' : '▶'}
                </div>
            </div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
