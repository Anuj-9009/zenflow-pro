// MediaBar - Final Version with Crossfader-Aware Display
import React, { useRef, useEffect, useCallback } from 'react'
import { djEngine } from '../audio/DJEngine'
import { useStore } from '../store/useStore'
import { usePlayer } from '../context/PlayerContext'

interface MediaBarProps {
    onLyricsToggle?: () => void
    showLyrics?: boolean
}

export const MediaBar: React.FC<MediaBarProps> = ({ onLyricsToggle, showLyrics }) => {
    // Use selectors to minimize re-renders
    const track = useStore(state => state.track)
    const { togglePlay, isPlaying } = usePlayer()
    const colors = useStore(state => state.colors)
    const playPause = togglePlay // Alias for legacy usage below
    const next = useStore(state => state.next)
    const previous = useStore(state => state.previous)

    // Refs for direct DOM manipulation (60FPS without React overhead)
    const progressRef = useRef<HTMLDivElement>(null)
    const progressBarRef = useRef<HTMLDivElement>(null)
    const currentTimeRef = useRef<HTMLSpanElement>(null)
    const durationRef = useRef<HTMLSpanElement>(null)
    const trackNameRef = useRef<HTMLDivElement>(null)
    const artistNameRef = useRef<HTMLDivElement>(null)
    const artRef = useRef<HTMLImageElement>(null)
    const playButtonRef = useRef<HTMLButtonElement>(null)
    const masterVolumeRef = useRef(75)

    const formatTime = useCallback((sec: number) => {
        if (!sec || isNaN(sec)) return '0:00'
        return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`
    }, [])

    // High-performance update loop - Direct DOM, no setState
    useEffect(() => {
        let animationId: number
        let lastActiveDeck: 'A' | 'B' | null = null

        const updateLoop = () => {
            // Determine active deck based on crossfader position
            // Crossfader < 0.5 = Deck A dominant, > 0.5 = Deck B dominant
            const crossfaderPos = djEngine.crossfadeValue
            const activeDeck: 'A' | 'B' = crossfaderPos < 0.5 ? 'A' : 'B'
            const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB
            const isActive = state.isPlaying

            const currentTime = state.position || 0
            const duration = state.duration || track.duration || 0
            const percent = duration > 0 ? (currentTime / duration) * 100 : 0

            // Direct DOM updates - Zero React Overhead
            if (progressBarRef.current) {
                progressBarRef.current.style.width = `${percent}%`
            }
            if (currentTimeRef.current) {
                currentTimeRef.current.textContent = formatTime(currentTime)
            }
            if (durationRef.current) {
                durationRef.current.textContent = formatTime(duration)
            }

            // Update track info when active deck changes
            if (activeDeck !== lastActiveDeck) {
                lastActiveDeck = activeDeck
                const displayTrack = state.track !== 'Empty' ? state.track : track.name || 'No Track'
                const displayArtist = track.artist || 'Unknown Artist'

                if (trackNameRef.current) {
                    trackNameRef.current.textContent = displayTrack
                }
                if (artistNameRef.current) {
                    artistNameRef.current.textContent = displayArtist
                }
            }

            // Update play button icon
            if (playButtonRef.current) {
                const innerHTML = isActive || isPlaying
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="black"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="black" style="margin-left: 2px;"><path d="M6 4l15 8-15 8V4z" /></svg>`
                if (playButtonRef.current.innerHTML !== innerHTML) {
                    playButtonRef.current.innerHTML = innerHTML
                }
            }

            animationId = requestAnimationFrame(updateLoop)
        }

        animationId = requestAnimationFrame(updateLoop)
        return () => cancelAnimationFrame(animationId)
    }, [formatTime, track.duration, track.name, track.artist, isPlaying])

    // Volume change handler
    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        masterVolumeRef.current = parseInt(e.target.value)
        djEngine.setMasterVolume?.(masterVolumeRef.current / 100)
    }, [])

    const handleSeek = useCallback((e: React.MouseEvent) => {
        if (!progressRef.current) return
        const rect = progressRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percent = x / rect.width

        // Seek the active deck (based on crossfader)
        const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
        djEngine.seek(activeDeck, percent)
    }, [])

    const handlePlayPause = useCallback(async () => {
        await togglePlay()
    }, [togglePlay])

    // Computed initial values
    const displayTrack = track.name || 'No Track'
    const displayArtist = track.artist || 'Unknown Artist'

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 z-50 glass-panel border-t border-white/10">
            {/* Progress bar at top - Direct DOM updates */}
            <div
                ref={progressRef}
                onClick={handleSeek}
                className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer group hover:h-2 transition-all"
            >
                <div
                    ref={progressBarRef}
                    className="h-full transition-none"
                    style={{
                        width: '0%',
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                    }}
                />
            </div>

            <div className="flex items-center h-full px-6 pt-1">
                {/* Left: Track Info - Crossfader aware */}
                <div className="flex items-center gap-4 w-1/4 min-w-0">
                    {track.artUrl ? (
                        <img ref={artRef} src={track.artUrl} alt="" className="w-12 h-12 rounded-lg shadow-lg" loading="lazy" />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                    )}
                    <div className="min-w-0">
                        <div ref={trackNameRef} className="font-medium truncate">{displayTrack}</div>
                        <div ref={artistNameRef} className="text-sm text-white/50 truncate">{displayArtist}</div>
                    </div>
                </div>

                {/* Center: Controls */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-4">
                        {/* Shuffle */}
                        <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                            </svg>
                        </button>

                        {/* Previous */}
                        <button onClick={previous} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                            </svg>
                        </button>

                        {/* Play/Pause - Updated via RAF */}
                        <button
                            ref={playButtonRef}
                            onClick={handlePlayPause}
                            className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="black" style={{ marginLeft: 2 }}>
                                <path d="M6 4l15 8-15 8V4z" />
                            </svg>
                        </button>

                        {/* Next */}
                        <button onClick={next} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>

                        {/* Repeat */}
                        <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                            </svg>
                        </button>
                    </div>

                    {/* Time display - Direct DOM updates */}
                    <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                        <span ref={currentTimeRef}>0:00</span>
                        <span>/</span>
                        <span ref={durationRef}>0:00</span>
                    </div>
                </div>

                {/* Right: Volume & Lyrics */}
                <div className="flex items-center gap-4 w-1/4 justify-end">
                    {/* Lyrics Toggle */}
                    <button
                        onClick={onLyricsToggle}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${showLyrics ? 'text-white bg-white/20' : 'text-white/40 hover:text-white'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 6h16M4 12h16M4 18h10" />
                        </svg>
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue={75}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default React.memo(MediaBar)
