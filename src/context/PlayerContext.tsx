// PlayerContext - The Central Brain for ZenFlow
// Unifies Library, DJ Decks, and Bottom Player state

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { djEngine } from '../audio/DJEngine'

// Types
interface Track {
    id: string
    title: string
    artist: string
    bpm?: number
    image?: string
    url?: string
    uri?: string
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

    // Playback
    isPlaying: boolean
    masterBpm: number
    setMasterBpm: (bpm: number) => void

    // Actions
    togglePlay: () => Promise<void>
    loadTrack: (track: Track, deckId: 'A' | 'B') => Promise<void>

    // Spotify State
    spotifyToken: string
    setSpotifyToken: (token: string) => void
    libraryTracks: Track[]
    setLibraryTracks: (tracks: Track[]) => void
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
    const [isPlaying, setIsPlaying] = useState(false)
    const [masterBpm, setMasterBpm] = useState(128)

    // Spotify
    const [spotifyToken, setSpotifyToken] = useState("")
    const [libraryTracks, setLibraryTracks] = useState<Track[]>([]) // User Fix 1: Always init as empty array

    // --- SYNC WITH TONE.JS ---
    useEffect(() => {
        Tone.Transport.bpm.value = masterBpm
    }, [masterBpm])

    // Poll for playback state
    useEffect(() => {
        const interval = setInterval(() => {
            const playing = Tone.Transport.state === 'started' ||
                djEngine.stateA.isPlaying ||
                djEngine.stateB.isPlaying
            setIsPlaying(playing)

            // Sync deck state from djEngine
            if (djEngine.stateA.track !== 'Empty' && (!deckA || deckA.title !== djEngine.stateA.track)) {
                setDeckA({
                    id: 'A',
                    title: djEngine.stateA.track,
                    artist: 'Unknown',
                    bpm: djEngine.stateA.bpm,
                    duration: djEngine.stateA.duration
                })
            }
            if (djEngine.stateB.track !== 'Empty' && (!deckB || deckB.title !== djEngine.stateB.track)) {
                setDeckB({
                    id: 'B',
                    title: djEngine.stateB.track,
                    artist: 'Unknown',
                    bpm: djEngine.stateB.bpm,
                    duration: djEngine.stateB.duration
                })
            }
        }, 100)
        return () => clearInterval(interval)
    }, [deckA, deckB])

    // --- ACTIONS ---
    const togglePlay = useCallback(async () => {
        // Start audio context if needed
        if (Tone.context.state !== 'running') {
            await Tone.start()
            console.log('[PlayerContext] Audio context started')
        }

        // Toggle active deck based on crossfader
        const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
        const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB

        if (state.isPlaying) {
            djEngine.pause(activeDeck)
        } else if (state.track !== 'Empty') {
            djEngine.play(activeDeck)
        } else {
            // Try Transport if no deck loaded
            if (Tone.Transport.state === 'started') {
                Tone.Transport.pause()
            } else {
                Tone.Transport.start()
            }
        }
    }, [])

    const loadTrack = useCallback(async (track: Track, deckId: 'A' | 'B') => {
        console.log(`[PlayerContext] Loading ${track.title} to Deck ${deckId}`)

        // Update local state immediately (optimistic UI)
        if (deckId === 'A') setDeckA(track)
        if (deckId === 'B') setDeckB(track)

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
    }, [])

    return (
        <PlayerContext.Provider value={{
            activeView, setActiveView,
            deckA, deckB,
            isPlaying,
            masterBpm, setMasterBpm,
            togglePlay, loadTrack,
            spotifyToken, setSpotifyToken,
            libraryTracks, setLibraryTracks
        }}>
            {children}
        </PlayerContext.Provider>
    )
}

export default PlayerProvider
