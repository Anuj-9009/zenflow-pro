// ZenFlow Pro - Desktop Architecture
// Sidebar, Library, Expandable Player, Lyrics, Frameless Window, Drag-Drop, Global Noise, Live DJ

import { useEffect, useState } from 'react'
import FluidShader from './components/FluidShader'
import GestureSettings from './components/GestureSettings'
import LyricsView from './components/LyricsView'
import Sidebar from './components/Sidebar'
import MasonryGrid from './components/MasonryGrid'
import SlowedView from './components/SlowedView'
import DJView from './components/DJView'
import NoiseOverlay from './components/NoiseOverlay'
import { useStore } from './store/useStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useGestures } from './hooks/useGestures'
import { GestureController } from './components/GestureController'
import { ErrorBoundary } from './components/ErrorBoundary'

type ViewState = 'library' | 'nowplaying' | 'lyrics' | 'search' | 'slowed' | 'settings' | 'dj'



export default function App() {
    const { isInitialized, track, colors, setColors, init, isPlaying, progress, playPause, next, previous, playLocalFile } = useStore()
    const [viewState, setViewState] = useState<ViewState>('library')
    const [gestureSettingsOpen, setGestureSettingsOpen] = useState(false)
    const [isMiniPlayer, setIsMiniPlayer] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    useKeyboardShortcuts()
    useGestures()

    // Initialize
    useEffect(() => {
        // if (!isInitialized) init()
        console.log('Skipping init for debugging')
    }, [isInitialized, init])

    // Toggle Mini Player Window
    const toggleMiniPlayerWindow = async () => {
        if (typeof window !== 'undefined' && (window as any).electron?.window?.toggleMiniPlayer) {
            await (window as any).electron.window.toggleMiniPlayer(!isMiniPlayer)
            setIsMiniPlayer(!isMiniPlayer)
        }
    }

    // Drag & Drop Handler
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(true)
    }
    const handleDragLeave = () => setDragOver(false)
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) {
            await playLocalFile(file)
            setViewState('slowed')
        }
    }

    // Dynamic colors from track
    useEffect(() => {
        if (!track.name) return
        let hash = 0
        for (let i = 0; i < track.name.length; i++) {
            hash = ((hash << 5) - hash) + track.name.charCodeAt(i)
        }
        const palettes = [
            { primary: '#1DB954', secondary: '#1ed760', background: '#0a1a0f' },
            { primary: '#4facfe', secondary: '#00f2fe', background: '#050510' },
            { primary: '#f093fb', secondary: '#f5576c', background: '#0a0510' },
            { primary: '#a78bfa', secondary: '#818cf8', background: '#08051a' },
        ]
        const p = palettes[Math.abs(hash) % palettes.length]
        setColors(p.primary, p.secondary, p.background)
    }, [track.name, setColors])

    const formatTime = (sec: number) => {
        if (!sec || isNaN(sec)) return '0:00'
        return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`
    }

    // Handlers
    const handleExpandPlayer = () => setViewState('nowplaying')
    const handleCollapsePlayer = () => setViewState('library')
    const handleToggleLyrics = () => setViewState(v => v === 'lyrics' ? 'nowplaying' : 'lyrics')

    // ... (imports remain at top of file, I will just fix the body)

    // View Content Switcher
    const renderContent = () => {
        switch (viewState) {
            case 'library': return (
                <>
                    <div className="atlas-header" style={{ padding: '0 40px', fontSize: '32px', fontWeight: 700, marginBottom: '20px' }}>Library</div>
                    <MasonryGrid onPlay={handleExpandPlayer} />
                </>
            )
            case 'dj': return <DJView />
            case 'slowed': return <SlowedView />
            case 'search': return <div style={{ padding: 40 }}><h1>Search</h1><p>Search your library...</p></div>
            case 'settings': return (
                <div style={{ padding: 40, fontFamily: 'Inter' }}>
                    <div className="atlas-header" style={{ fontSize: '40px', marginBottom: '40px' }}>System Settings</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        <GestureSettings />
                    </div>
                </div>
            )
            default: return <MasonryGrid onPlay={handleExpandPlayer} />
        }
    }

    return (
        <ErrorBoundary>
            {/* ... container ... */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative',
                    background: viewState === 'library' || viewState === 'slowed'
                        ? `radial-gradient(circle at 20% 20%, ${colors.background} 0%, #050508 80%)`
                        : 'transparent',
                    fontFamily: 'Inter, sans-serif', color: 'white', transition: 'background 1s ease'
                }}
            >
                {/* ... existing overlays ... */}
                <NoiseOverlay />
                {dragOver && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 9999, background: 'rgba(79, 172, 254, 0.2)', backdropFilter: 'blur(10px)', border: '4px dashed #4facfe', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '40px', fontWeight: 800 }}>Drop to Play</div>
                    </div>
                )}

                {/* Drag Region */}
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '40px', zIndex: 1000, WebkitAppRegion: 'drag' as any, display: 'flex', justifyContent: 'flex-end', paddingRight: '20px', alignItems: 'center' } as any}>
                    <button onClick={toggleMiniPlayerWindow} style={{ WebkitAppRegion: 'no-drag' as any, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '11px' } as any}>
                        {isMiniPlayer ? 'MAXIMIZE' : 'MINI PLAYER'}
                    </button>
                </div>

                {/* Shader Layer (-1) */}
                <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: (viewState === 'library' || viewState === 'slowed') ? 0 : 1, transition: 'opacity 0.8s ease', pointerEvents: 'none' }}>
                    <FluidShader dimmed={viewState === 'lyrics'} blurred={viewState === 'lyrics'} />
                </div>

                {/* Main Content Layer (1) */}
                <div style={{
                    display: 'flex', height: '100%',
                    opacity: (viewState === 'nowplaying' || viewState === 'lyrics') ? 0 : 1,
                    transform: (viewState === 'nowplaying' || viewState === 'lyrics') ? 'scale(0.98) translateY(20px)' : 'scale(1) translateY(0)',
                    transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    pointerEvents: (viewState === 'nowplaying' || viewState === 'lyrics') ? 'none' : 'auto',
                    position: 'relative', zIndex: 1
                }}>
                    <Sidebar activeTab={viewState} onTabChange={(t) => setViewState(t as ViewState)} />
                    <div style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', paddingTop: '60px' }}>
                        {renderContent()}
                    </div>
                </div>

                {/* Player Overlay Layer (10) */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    opacity: (viewState === 'nowplaying' || viewState === 'lyrics') ? 1 : 0,
                    pointerEvents: (viewState === 'nowplaying' || viewState === 'lyrics') ? 'auto' : 'none',
                    transition: 'opacity 0.4s ease'
                }}>
                    {/* Close Button */}
                    <button onClick={handleCollapsePlayer} style={{ position: 'absolute', top: '50px', left: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', backdropFilter: 'blur(10px)', zIndex: 100 }}>✕</button>

                    {/* Album Art */}
                    <div onClick={handleToggleLyrics} style={{
                        position: 'absolute',
                        top: viewState === 'nowplaying' ? '25%' : '60px',
                        right: viewState === 'lyrics' ? '40px' : undefined,
                        left: viewState === 'lyrics' ? undefined : '50%',
                        transform: viewState === 'nowplaying' ? 'translate(-50%, 0)' : 'none',
                        ...(viewState === 'lyrics' ? { right: '40px', top: '60px' } : {}),
                        width: viewState === 'nowplaying' ? '350px' : '80px', height: viewState === 'nowplaying' ? '350px' : '80px',
                        borderRadius: viewState === 'nowplaying' ? '20px' : '12px', overflow: 'hidden', cursor: 'pointer',
                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: viewState === 'nowplaying' ? `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${colors.primary}40` : '0 8px 25px rgba(0,0,0,0.3)',
                        opacity: viewState !== 'library' && viewState !== 'slowed' ? 1 : 0, zIndex: 20
                    }}>
                        {track.artUrl ? <img src={track.artUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#333' }} />}
                    </div>

                    {/* Controls */}
                    <div style={{
                        position: 'absolute', top: '65%', left: '50%', transform: 'translateX(-50%)',
                        textAlign: 'center', opacity: viewState === 'nowplaying' ? 1 : 0,
                        pointerEvents: viewState === 'nowplaying' ? 'auto' : 'none',
                        transition: 'opacity 0.4s ease', width: '100%', maxWidth: '500px'
                    }}>
                        <div className="atlas-header" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>{track.name}</div>
                        <div style={{ fontSize: '18px', opacity: 0.6, marginBottom: '40px', letterSpacing: '1px' }}>{track.artist}</div>
                        {/* Progress Bar */}
                        <div style={{ width: '100%', marginBottom: '40px', padding: '0 20px' }}>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress * 100}%`, background: colors.primary, boxShadow: `0 0 15px ${colors.primary}` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', opacity: 0.4, fontSize: '12px', fontFamily: 'monospace' }}>
                                <span>{formatTime(track.position)}</span>
                                <span>{formatTime(track.duration)}</span>
                            </div>
                        </div>
                        {/* Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
                            <button onClick={previous} style={{ background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer', opacity: 0.8 }}>⏮</button>
                            <button onClick={playPause} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '70px', height: '70px', fontSize: '28px', color: 'black', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>{isPlaying ? '⏸' : '▶'}</button>
                            <button onClick={next} style={{ background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer', opacity: 0.8 }}>⏭</button>
                        </div>
                    </div>

                    {/* Lyrics Layer (Ultra Fluid) */}
                    <div style={{
                        position: 'absolute', top: '120px', bottom: '100px', left: '0', right: '0',
                        opacity: viewState === 'lyrics' ? 1 : 0,
                        pointerEvents: viewState === 'lyrics' ? 'auto' : 'none',
                        transition: 'opacity 0.5s ease', marginBottom: '40px',
                        zIndex: 20
                    }}>
                        <LyricsView />
                    </div>
                </div>

                {/* Floating Mini Bar */}
                <div
                    onClick={handleExpandPlayer}
                    style={{
                        position: 'fixed', bottom: '30px', left: '50%',
                        transform: viewState === 'library' || viewState === 'slowed' ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(150px)',
                        width: '450px', height: '64px', background: 'rgba(20, 20, 20, 0.6)',
                        backdropFilter: 'blur(30px) saturate(150%)', borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center',
                        padding: '0 20px', gap: '16px', cursor: 'pointer',
                        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 200
                    }}
                >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', animation: isPlaying ? 'spin 12s linear infinite' : 'none' }}>
                        {track.artUrl && <img src={track.artUrl} style={{ width: '100%', height: '100%' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.2px' }}>{track.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.5 }}>{track.artist}</div>
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); playPause() }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontSize: '14px' }}>
                        {isPlaying ? '⏸' : '▶'}
                    </div>
                </div>
                <GestureController />
                <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 3px; }
            `}</style>
            </div>
        </ErrorBoundary>
    )
}
