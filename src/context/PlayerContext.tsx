// PlayerContext - The Central Brain for ZenFlow
// Now with Spotify Web Playback SDK integration

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSpotifyPlayer, playSpotifyTrack, transferPlayback } from '../hooks/useSpotifyPlayer'
import { djEngine } from '../audio/DJEngine'

// Types
interface Track {
    id: string
    title: string
    artist: string
    bpm?: number
    image?: string
    url?: string
    uri?: string // Spotify URI (e.g., "spotify:track:xxx")
    duration?: number
}

type ViewState = 'library' | 'nowplaying' | 'lyrics' | 'search' | 'slowed' | 'settings' | 'dj' | 'spotify' | 'gestures'

interface PlayerContextType {
    // Navigation
    activeView: ViewState
    setActiveView: React.Dispatch<React.SetStateAction<ViewState>>

    // Deck State
    deckA: Track | null
    deckB: Track | null

    // Playback (unified across Spotify + local)
    isPlaying: boolean
    currentTrack: Track | null
    position: number // ms
    duration: number // ms
    masterBpm: number
    setMasterBpm: (bpm: number) => void

    // Actions
    togglePlay: () => Promise<void>
    toggleDeck: (deckId: 'A' | 'B') => Promise<void>
    loadTrack: (track: Track, deckId: 'A' | 'B') => Promise<void>
    playTrack: (track: Track) => Promise<void> // New: Play directly via Spotify
    seek: (positionMs: number) => void

    // Spotify State
    spotifyToken: string
    setSpotifyToken: (token: string) => void
    libraryTracks: Track[]
    setLibraryTracks: (tracks: Track[]) => void
    isSpotifyReady: boolean // New: SDK ready flag
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export const usePlayer = () => {
    const context = useContext(PlayerContext)
    if (!context) throw new Error('usePlayer must be used within PlayerProvider')
    return context
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE ---
    const [activeView, setActiveView] = useState<ViewState>('library')
    const [deckA, setDeckA] = useState<Track | null>(null)
    const [deckB, setDeckB] = useState<Track | null>(null)
    const [masterBpm, setMasterBpm] = useState(128)

    // Spotify State
    const [spotifyToken, setSpotifyTokenState] = useState("")
    const [libraryTracks, setLibraryTracks] = useState<Track[]>([])

    // Spotify Web Playback SDK
    const {
        player: spotifyPlayer,
        deviceId,
        isPaused,
        isActive,
        currentTrack: spotifyCurrentTrack,
        position: spotifyPosition,
        duration: spotifyDuration,
        togglePlay: spotifyToggle,
        seek: spotifySeek,
    } = useSpotifyPlayer(spotifyToken || null)

    // Persist token and transfer playback when token changes
    const setSpotifyToken = useCallback((token: string) => {
        setSpotifyTokenState(token)
        localStorage.setItem('spotify_token', token)
    }, [])

    // Auto-transfer playback when SDK is ready
    useEffect(() => {
        if (deviceId && spotifyToken) {
            console.log('🎵 Transferring playback to ZenFlow device...')
            transferPlayback(spotifyToken)
        }
    }, [deviceId, spotifyToken])

    // --- UNIFIED STATE ---

    // Current track from Spotify SDK
    const currentTrack: Track | null = spotifyCurrentTrack ? {
        id: spotifyCurrentTrack.id,
        title: spotifyCurrentTrack.name,
        artist: spotifyCurrentTrack.artists?.[0]?.name || 'Unknown',
        image: spotifyCurrentTrack.album?.images?.[0]?.url,
        uri: spotifyCurrentTrack.uri,
        duration: spotifyCurrentTrack.duration_ms,
    } : null

    // Combined playing state
    const isPlaying = isActive && !isPaused

    // --- ACTIONS ---

    /**
     * Toggle play/pause - Uses Spotify SDK if active, falls back to DJ Engine
     */
    const togglePlay = useCallback(async () => {
        if (isActive && spotifyPlayer) {
            spotifyToggle()
        } else {
            // Fallback to DJ Engine
            const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
            const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB

            if (state.isPlaying) {
                djEngine.pause(activeDeck)
            } else if (state.track !== 'Empty') {
                djEngine.play(activeDeck)
            }
        }
    }, [isActive, spotifyPlayer, spotifyToggle])

    /**
     * Play a track directly via Spotify (main playback)
     */
    const playTrack = useCallback(async (track: Track) => {
        if (!spotifyToken) {
            console.error('❌ No Spotify token available')
            return
        }

        // If track has Spotify URI, use Spotify SDK
        if (track.uri && track.uri.startsWith('spotify:')) {
            console.log('▶️ Playing via Spotify SDK:', track.title)
            await playSpotifyTrack(track.uri, spotifyToken)
        } else if (track.url) {
            // Fallback to DJ Engine for local/URL tracks
            console.log('▶️ Playing via DJ Engine:', track.title)
            await djEngine.loadTrack('A', track.url)
            djEngine.play('A')
        } else {
            console.warn('⚠️ Track has no playable source:', track)
        }
    }, [spotifyToken])

    /**
     * Load track to a specific DJ deck
     */
    const loadTrack = useCallback(async (track: Track, deckId: 'A' | 'B') => {
        console.log(`[PlayerContext] Loading ${track.title} to Deck ${deckId}`)

        // Update local state immediately (optimistic UI)
        if (deckId === 'A') setDeckA(track)
        if (deckId === 'B') setDeckB(track)

        // Spotify tracks go to SDK (Deck A = main player)
        if (track.uri && track.uri.startsWith('spotify:') && spotifyToken) {
            await playSpotifyTrack(track.uri, spotifyToken)

            // CRITICAL: Update DJ Engine state for visuals even if audio is external
            const state = deckId === 'A' ? djEngine.stateA : djEngine.stateB
            state.track = track.title
            state.bpm = track.bpm || 120
            state.duration = track.duration ? track.duration / 1000 : 0
            state.isPlaying = true // Optimistic
            return
        }

        // Try Mirror Engine for unlocked audio
        if (window.electron?.audio?.resolveAudio) {
            try {
                const query = `${track.title} ${track.artist}`
                const result = await window.electron.audio.resolveAudio(query)

                if (result.success && result.url) {
                    await djEngine.loadTrack(deckId, result.url)
                    const state = deckId === 'A' ? djEngine.stateA : djEngine.stateB
                    state.track = track.title
                    state.duration = result.duration || 0
                    console.log(`[PlayerContext] Mirror loaded: ${track.title}`)
                    return
                }
            } catch (e) {
                console.error('[PlayerContext] Mirror failed:', e)
            }
        }

        // Fallback to direct URL if available
        if (track.url) {
            await djEngine.loadTrack(deckId, track.url)
        }
    }, [spotifyToken])

    /**
     * Toggle Deck Playback (Routes to Spotify or Tone.js)
     */
    const toggleDeck = useCallback(async (deckId: 'A' | 'B') => {
        const track = deckId === 'A' ? deckA : deckB

        // If Spotify Track on Deck A
        if (deckId === 'A' && track?.uri?.startsWith('spotify:')) {
            if (spotifyPlayer) spotifyToggle()

            // Sync visual state
            djEngine.stateA.isPlaying = !djEngine.stateA.isPlaying
        } else {
            // Local / DJ Engine Track
            const state = deckId === 'A' ? djEngine.stateA : djEngine.stateB
            if (state.isPlaying) {
                djEngine.pause(deckId)
            } else {
                djEngine.play(deckId)
            }
        }
    }, [deckA, deckB, spotifyPlayer, spotifyToggle])

    /**
     * Seek to position
     */
    const seek = useCallback((positionMs: number) => {
        if (isActive && spotifyPlayer) {
            spotifySeek(positionMs)
        } else {
            // Convert to progress (0-1) for DJ Engine
            const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
            const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB
            if (state.duration > 0) {
                djEngine.seek(activeDeck, positionMs / (state.duration * 1000))
            }
        }
    }, [isActive, spotifyPlayer, spotifySeek])

    return (
        <PlayerContext.Provider value={{
            activeView, setActiveView,
            deckA, deckB,
            isPlaying,
            currentTrack,
            position: spotifyPosition,
            duration: spotifyDuration,
            masterBpm, setMasterBpm,
            togglePlay,
            toggleDeck, // Exposed
            loadTrack,
            playTrack,
            seek,
            spotifyToken, setSpotifyToken,
            libraryTracks, setLibraryTracks,
            isSpotifyReady: !!deviceId && isActive,
        }}>
            {children}
        </PlayerContext.Provider>
    )
}

export default PlayerProvider
