// useDJEngine Hook - Final Version with Full Audio Bindings
import { useEffect, useState, useCallback, useRef } from 'react'
import { djEngine, DeckState } from '../audio/DJEngine'

/**
 * PERFORMANCE RULES:
 * - Never put high-frequency data (currentTime, volume levels) in useState
 * - Use refs for values that change 60+ times per second
 * - Direct engine calls bypass React render cycle for zero latency
 */

export const useDJEngine = () => {
    // Reactive State - Only for UI that needs to re-render
    const [deckA, setDeckA] = useState<DeckState>(djEngine.stateA)
    const [deckB, setDeckB] = useState<DeckState>(djEngine.stateB)
    const [crossfader, setCrossfader] = useState(djEngine.crossfadeValue)
    const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A')

    // Refs for direct audio engine access (no React overhead)
    const engineRef = useRef(djEngine)

    // Sync state from engine at 10Hz (enough for UI, not enough to cause lag)
    useEffect(() => {
        const sync = setInterval(() => {
            // Only update if values actually changed
            if (JSON.stringify(djEngine.stateA) !== JSON.stringify(deckA)) {
                setDeckA({ ...djEngine.stateA })
            }
            if (JSON.stringify(djEngine.stateB) !== JSON.stringify(deckB)) {
                setDeckB({ ...djEngine.stateB })
            }
            if (djEngine.crossfadeValue !== crossfader) {
                setCrossfader(djEngine.crossfadeValue)
            }

            // Determine active deck based on crossfader position
            const newActive = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
            if (newActive !== activeDeck) {
                setActiveDeck(newActive)
            }
        }, 100)

        return () => clearInterval(sync)
    }, [deckA, deckB, crossfader, activeDeck])

    // ============ DIRECT AUDIO BINDINGS (Zero Latency) ============

    /**
     * Master Volume - Affects entire output
     * @param val 0-100
     */
    const setMasterVolume = useCallback((val: number) => {
        djEngine.setMasterVolume(val / 100)
    }, [])

    /**
     * Channel Volume - Per-deck volume fader
     * @param deck 'A' or 'B'
     * @param val 0-100
     */
    const setChannelVolume = useCallback((deck: 'A' | 'B', val: number) => {
        djEngine.setVolume(deck, val / 100)
    }, [])

    /**
     * EQ Control - 3-band equalizer
     * @param deck 'A' or 'B'
     * @param band 'low' | 'mid' | 'high'
     * @param val -10 to +10 (dB-ish)
     */
    const setEQ = useCallback((deck: 'A' | 'B', band: 'low' | 'mid' | 'high', val: number) => {
        djEngine.setEQ(deck, band, val)
    }, [])

    /**
     * Filter Control - LP/HP sweep
     * @param deck 'A' or 'B'
     * @param val -1 to +1 (center = neutral)
     */
    const setFilter = useCallback((deck: 'A' | 'B', val: number) => {
        djEngine.setFilter(deck, val)
    }, [])

    /**
     * Crossfader - Mix between decks
     * @param val 0 to 1 (0=Deck A, 1=Deck B)
     */
    const setCrossfaderValue = useCallback((val: number) => {
        djEngine.setCrossfader(val)
        setCrossfader(val)
    }, [])

    // ============ SMART PLAY LOGIC ============

    /**
     * Smart Load - Automatically picks the best deck
     * Priority: Empty deck > Paused deck > Active deck
     */
    const smartLoad = useCallback(async (track: { uri?: string; name: string;[key: string]: any }) => {
        const stateA = djEngine.stateA
        const stateB = djEngine.stateB

        // Find the best deck
        let targetDeck: 'A' | 'B'

        if (stateA.track === 'Empty') {
            targetDeck = 'A'
        } else if (stateB.track === 'Empty') {
            targetDeck = 'B'
        } else if (!stateA.isPlaying) {
            targetDeck = 'A'
        } else if (!stateB.isPlaying) {
            targetDeck = 'B'
        } else {
            // Both playing - load to the non-active (based on crossfader)
            targetDeck = djEngine.crossfadeValue < 0.5 ? 'B' : 'A'
        }

        console.log(`[SmartLoad] Loading "${track.name}" to Deck ${targetDeck}`)
        await djEngine.loadTrack(targetDeck, track.uri || track.name)
        return targetDeck
    }, [])

    /**
     * Smart Play - Load and immediately play
     */
    const smartPlay = useCallback(async (track: { uri?: string; name: string;[key: string]: any }) => {
        const deck = await smartLoad(track)
        djEngine.play(deck)
        return deck
    }, [smartLoad])

    // ============ BASIC CONTROLS ============

    const loadTrack = useCallback((deck: 'A' | 'B', file: File | string) => {
        return djEngine.loadTrack(deck, file)
    }, [])

    const play = useCallback((deck: 'A' | 'B') => {
        djEngine.play(deck)
    }, [])

    const pause = useCallback((deck: 'A' | 'B') => {
        djEngine.pause(deck)
    }, [])

    const seek = useCallback((deck: 'A' | 'B', progress: number) => {
        djEngine.seek(deck, progress)
    }, [])

    const sync = useCallback((deck: 'A' | 'B') => {
        djEngine.syncTracks(deck)
    }, [])

    // ============ GETTERS (For Animation Loops) ============

    /**
     * Get current positions - Use in requestAnimationFrame, not React state
     */
    const getPositions = useCallback(() => djEngine.getPositions(), [])

    /**
     * Get active deck state - Changes based on crossfader
     */
    const getActiveDeckState = useCallback(() => {
        return djEngine.crossfadeValue < 0.5 ? djEngine.stateA : djEngine.stateB
    }, [])

    return {
        // State (for UI)
        deckA,
        deckB,
        crossfader,
        activeDeck,

        // Audio Controls (Direct Bindings)
        setMasterVolume,
        setChannelVolume,
        setEQ,
        setFilter,
        setCrossfader: setCrossfaderValue,

        // Smart Play
        smartLoad,
        smartPlay,

        // Basic Controls
        loadTrack,
        play,
        pause,
        seek,
        sync,

        // Getters
        getPositions,
        getActiveDeckState,

        // Direct Engine Access (for advanced use)
        engine: engineRef.current
    }
}
