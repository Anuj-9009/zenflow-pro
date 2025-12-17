import React, { useEffect, useState, useCallback } from 'react'
import FluidShader from './FluidShader'
import GestureSettings from './GestureSettings'
import Sidebar from './Sidebar'
import MasonryGrid from './MasonryGrid'
import SlowedView from './SlowedView'
import DJView from './DJView'
import NoiseOverlay from './NoiseOverlay'
import SpotifySearch from './SpotifySearch'
import MiniPlayer from './MiniPlayer'
import LyricsVisualizer from './LyricsVisualizer'
import { useStore } from '../store/useStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useHandGestures } from '../hooks/useHandGestures'
import { GestureGuide } from './GestureGuide'
import { SpotifyBridge } from '../services/SpotifyBridge'
import { djEngine } from '../audio/DJEngine'
import { LibraryTab } from './Library/LibraryTab'
import { MediaBar } from './MediaBar'
import { GestureDashboard } from './Gesture/GestureDashboard'
import { GlobalSearch } from './GlobalSearch'
import { usePlayer } from '../context/PlayerContext'

type ViewState = 'library' | 'nowplaying' | 'lyrics' | 'search' | 'slowed' | 'settings' | 'dj' | 'spotify' | 'gestures'

// Internal Layout Component (The "Old" App)
export const ZenFlowLayout = () => {
    const { activeView, setActiveView, togglePlay, deckA, deckB, isPlaying: contextIsPlaying } = usePlayer()
    const { track, colors, setColors, isPlaying: storeIsPlaying, progress, playPause, next, previous, playLocalFile } = useStore()

    // Legacy support
    const viewState = activeView
    const setViewState = setActiveView

    const [isMiniPlayer, setIsMiniPlayer] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    // Module D: Gestures (MediaPipe)
    const { setEnabled: setGesturesEnabled, videoRef, canvasRef, gestureState, enabled: gesturesEnabled } = useHandGestures()

    useKeyboardShortcuts()

    // Audio Engine Init
    const [audioReady, setAudioReady] = useState(false)

    const initAudio = useCallback(async () => {
        if (!audioReady) {
            await djEngine.init()
            setAudioReady(true)
            console.log('[App] DJ Engine initialized on user interaction')
        }
    }, [audioReady])

    // Auth & Init
    useEffect(() => {
        useStore.getState().init()

        const handleInteraction = async () => {
            await initAudio()
            const { MediaSessionManager } = await import('../services/MediaSessionManager')
            MediaSessionManager.init()
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
        }
        document.addEventListener('click', handleInteraction)
        document.addEventListener('keydown', handleInteraction)

        return () => {
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
        }
    }, [initAudio, setViewState])

    // Global Spotify Sync
    useEffect(() => {
        const poll = setInterval(async () => {
            if (SpotifyBridge.token) {
                const now = await SpotifyBridge.getNowPlaying()
                if (now && now.item) {
                    useStore.setState({
                        isPlaying: now.is_playing,
                        track: {
                            name: now.item.name,
                            artist: now.item.artists[0].name,
                            artUrl: now.item.album.images[0]?.url,
                            duration: now.item.duration_ms,
                            album: now.item.album.name,
                            position: now.progress_ms
                        },
                        progress: now.progress_ms / 1000
                    })
                }
            }
        }, 1000)
        return () => clearInterval(poll)
    }, [])

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
    const handleDragLeave = () => setDragOver(false)
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) { await playLocalFile(file); setViewState('slowed') }
    }

    // Dynamic colors
    useEffect(() => {
        if (!track.name) return
        const palettes = [
            { primary: '#1DB954', secondary: '#1ed760', background: '#0a1a0f' },
            { primary: '#4facfe', secondary: '#00f2fe', background: '#050510' },
            { primary: '#f093fb', secondary: '#f5576c', background: '#0a0510' },
            { primary: '#a78bfa', secondary: '#818cf8', background: '#08051a' },
        ]
        setColors(palettes[0].primary, palettes[0].secondary, palettes[0].background)
    }, [track.name, setColors])

    const renderContent = () => {
        switch (viewState) {
            case 'library': return <LibraryTab />
            case 'dj': return <DJView />
            case 'slowed': return <SlowedView />
            case 'search': return <GlobalSearch />
            case 'spotify': return <div style={{ height: '100%', padding: '0 20px' }}><h1 className="atlas-header">Spotify Search</h1><SpotifySearch /></div>
            case 'gestures': return <GestureDashboard gesturesEnabled={gesturesEnabled} onToggle={setGesturesEnabled} videoRef={videoRef} canvasRef={canvasRef} />
            case 'settings': return <div style={{ padding: 40 }}><GestureSettings /><br /><br /><div className="atlas-header">System</div></div>
            default: return <MasonryGrid onPlay={() => setViewState('nowplaying')} />
        }
    }

    const handleToggleLyrics = () => setViewState(v => v === 'lyrics' ? 'nowplaying' : 'lyrics')
    const activeIsPlaying = viewState === 'dj' ? contextIsPlaying : storeIsPlaying

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="w-screen h-screen overflow-hidden relative"
        >
            {/* z-0: Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <FluidShader dimmed={viewState === 'lyrics'} blurred={viewState === 'lyrics'} />
            </div>
            <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-20">
                <NoiseOverlay />
            </div>

            {/* z-10: Hidden Logic (Gestures) */}
            <div className="absolute top-0 left-0 opacity-0 pointer-events-none z-10">
                <video ref={videoRef} playsInline muted className="w-80 h-60" />
                <canvas ref={canvasRef} className="w-80 h-60" />
            </div>

            {/* z-20: Main Content Layer */}
            {!isMiniPlayer && (
                <div
                    className={`flex h-full transition-all duration-500 z-20 relative
                        ${(viewState === 'nowplaying' || viewState === 'lyrics') ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}
                    `}
                >
                    <div className="h-full z-30 relative shadow-2xl glass-panel-elevated m-4 rounded-2xl overflow-hidden">
                        <Sidebar activeTab={viewState} onTabChange={(t) => setViewState(t as ViewState)} />
                    </div>

                    <div className="flex-1 overflow-y-auto z-20 relative">
                        {renderContent()}
                    </div>
                </div>
            )}

            {/* z-40: Full Overlay Mode */}
            <div
                className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl transition-opacity duration-500
                    ${(viewState === 'nowplaying' || viewState === 'lyrics') ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
            >
                <button
                    onClick={() => setViewState('library')}
                    className="absolute top-10 left-10 w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center justify-center z-50"
                >✕</button>

                {viewState === 'lyrics' ? (
                    <div className="w-[80%] h-[80%] z-40"><LyricsVisualizer /></div>
                ) : (
                    <div className="text-center z-40 flex flex-col items-center">
                        <img
                            src={track.artUrl || ''}
                            className="w-[300px] h-[300px] rounded-3xl mb-10 shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-500"
                            style={{ boxShadow: `0 0 80px ${colors.primary}40` }}
                            onClick={handleToggleLyrics}
                        />
                        <h1 className="text-5xl font-header font-bold mb-2 tracking-tight">{track.name}</h1>
                        <h3 className="text-xl font-mono text-white/50 mb-10 tracking-widest uppercase">{track.artist}</h3>
                        <div className="flex gap-10 text-4xl items-center">
                            <button onClick={previous} className="hover:text-white/80 active:scale-95 transition-transform">⏮</button>
                            <button onClick={playPause} className="bg-white text-black w-20 h-20 rounded-full flex items-center justify-center text-3xl hover:scale-105 transition-transform">
                                {activeIsPlaying ? '⏸' : '▶'}
                            </button>
                            <button onClick={next} className="hover:text-white/80 active:scale-95 transition-transform">⏭</button>
                        </div>
                    </div>
                )}
            </div>

            {/* z-50: Widget Controls */}
            <div className="fixed bottom-5 right-5 z-50 flex gap-2">
                <button
                    onClick={() => setIsMiniPlayer(!isMiniPlayer)}
                    className="glass-panel px-4 py-2 rounded-lg text-sm font-bold tracking-wider hover:bg-white/10 transition-all"
                >
                    {isMiniPlayer ? 'MAXIMIZE' : 'WIDGET'}
                </button>
                <button
                    onClick={() => setGesturesEnabled(!gesturesEnabled)}
                    className={`glass-panel px-4 py-2 rounded-lg text-sm font-bold tracking-wider transition-all border
                        ${gesturesEnabled ? `border-${colors.primary} text-${colors.primary}` : 'border-transparent hover:bg-white/10'}
                    `}
                    style={{ borderColor: gesturesEnabled ? colors.primary : 'transparent', color: gesturesEnabled ? colors.primary : 'white' }}
                >
                    HANDS: {gesturesEnabled ? 'ON' : 'OFF'} {gesturesEnabled && gestureState !== 'None' ? `(${gestureState})` : ''}
                </button>
            </div>

            {/* z-100: Mini Player & Overlays */}
            {isMiniPlayer && <div className="absolute top-5 right-5 z-[100]"><MiniPlayer /></div>}

            {/* Drag Overlay */}
            {dragOver && (
                <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-md animate-pulse">
                    <div className="text-6xl font-header font-black tracking-tighter">DROP TO PLAY</div>
                </div>
            )}

            {/* z-50: Floating Gesture Guide */}
            <GestureGuide />

            {/* z-50: Persistent Media Bar Footer */}
            {!isMiniPlayer && (
                <MediaBar
                    onLyricsToggle={handleToggleLyrics}
                    showLyrics={viewState === 'lyrics'}
                />
            )}
        </div>
    )
}

export default ZenFlowLayout
