// useDJControls - Direct Wire Hook (Bypasses React State for Audio)
// This hook provides visual state for UI AND direct audio engine calls

import { useState, useCallback, useRef } from 'react'
import { djEngine } from '../audio/DJEngine'

interface VisualState {
    volA: number
    volB: number
    filterA: number
    filterB: number
    eqA: { low: number; mid: number; high: number }
    eqB: { low: number; mid: number; high: number }
    crossfader: number
    masterVol: number
}

/**
 * HARD WIRE PATTERN:
 * 1. Visual State (useState) - For UI rendering only
 * 2. Direct Engine Calls - For actual audio (no React render cycle)
 * 
 * This ensures knob turns are instant (no lag from React re-renders)
 */
export const useDJControls = () => {
    // Visual state for React UI components
    const [visualState, setVisualState] = useState<VisualState>({
        volA: 80,
        volB: 80,
        filterA: 50, // Center = neutral
        filterB: 50,
        eqA: { low: 0, mid: 0, high: 0 },
        eqB: { low: 0, mid: 0, high: 0 },
        crossfader: 0.5,
        masterVol: 75
    })

    // Track if engine is ready
    const engineReady = useRef(djEngine.initialized)

    // ============ VOLUME CONTROLS ============

    /**
     * Channel Volume (0-100 linear slider -> dB logarithmic)
     */
    const setVolume = useCallback((deck: 'A' | 'B', val: number) => {
        // 1. Update visual immediately
        setVisualState(prev => ({
            ...prev,
            [deck === 'A' ? 'volA' : 'volB']: val
        }))

        // 2. DIRECT ENGINE CALL (the "hard wire")
        // Convert 0-100 to 0-1 for the engine
        djEngine.setVolume(deck, val / 100)

        console.log(`[HardWire] Volume ${deck}: ${val}%`)
    }, [])

    /**
     * Master Volume (0-100)
     */
    const setMasterVolume = useCallback((val: number) => {
        setVisualState(prev => ({ ...prev, masterVol: val }))
        djEngine.setMasterVolume(val / 100)
        console.log(`[HardWire] Master: ${val}%`)
    }, [])

    // ============ EQ CONTROLS ============

    /**
     * EQ Band (-10 to +10 range typical for UI)
     */
    const setEQ = useCallback((deck: 'A' | 'B', band: 'low' | 'mid' | 'high', val: number) => {
        // Update visual
        setVisualState(prev => ({
            ...prev,
            [deck === 'A' ? 'eqA' : 'eqB']: {
                ...prev[deck === 'A' ? 'eqA' : 'eqB'],
                [band]: val
            }
        }))

        // DIRECT ENGINE CALL
        djEngine.setEQ(deck, band, val)
        console.log(`[HardWire] EQ ${deck} ${band}: ${val}`)
    }, [])

    // ============ FILTER CONTROLS ============

    /**
     * Filter Sweep (0-100, 50 = center/neutral)
     */
    const setFilter = useCallback((deck: 'A' | 'B', val: number) => {
        setVisualState(prev => ({
            ...prev,
            [deck === 'A' ? 'filterA' : 'filterB']: val
        }))

        // Convert 0-100 to -1 to +1 for engine
        const normalizedVal = (val - 50) / 50
        djEngine.setFilter(deck, normalizedVal)
        console.log(`[HardWire] Filter ${deck}: ${val} -> ${normalizedVal}`)
    }, [])

    // ============ CROSSFADER ============

    /**
     * Crossfader (0 = Deck A, 1 = Deck B)
     */
    const setCrossfader = useCallback((val: number) => {
        setVisualState(prev => ({ ...prev, crossfader: val }))
        djEngine.setCrossfader(val)
        console.log(`[HardWire] Crossfader: ${val}`)
    }, [])

    // ============ PLAYBACK CONTROLS ============

    const play = useCallback((deck: 'A' | 'B') => {
        djEngine.play(deck)
        console.log(`[HardWire] Play ${deck}`)
    }, [])

    const pause = useCallback((deck: 'A' | 'B') => {
        djEngine.pause(deck)
        console.log(`[HardWire] Pause ${deck}`)
    }, [])

    const loadTrack = useCallback(async (deck: 'A' | 'B', source: File | string) => {
        console.log(`[HardWire] Loading track to Deck ${deck}...`)
        await djEngine.loadTrack(deck, source)
        console.log(`[HardWire] Track loaded to Deck ${deck}`)
    }, [])

    // ============ DIRECT ENGINE ACCESS ============

    /**
     * Get current deck states (use for display, not audio control)
     */
    const getDeckStates = useCallback(() => ({
        deckA: djEngine.stateA,
        deckB: djEngine.stateB,
        crossfader: djEngine.crossfadeValue
    }), [])

    return {
        // Visual state for UI
        visualState,

        // Volume controls
        setVolume,
        setMasterVolume,

        // EQ controls
        setEQ,

        // Filter controls
        setFilter,

        // Crossfader
        setCrossfader,

        // Playback
        play,
        pause,
        loadTrack,

        // Direct access
        getDeckStates,
        engine: djEngine
    }
}
