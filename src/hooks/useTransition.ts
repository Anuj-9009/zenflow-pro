import { useState, useRef, useEffect } from 'react'
import { djEngine } from '../audio/DJEngine'
import { SpotifyBridge } from '../services/SpotifyBridge'
import { useStore } from '../store/useStore'
import { useQueue } from '../services/QueueManager' // Import Queue Store

export type TransitionState = 'idle' | 'capturing' | 'ghosting' | 'mixed'

export const useTransition = (activeDeck: 'A' | 'B') => {
    const [state, setState] = useState<TransitionState>('idle')
    const stateRef = useRef(state)
    useEffect(() => { stateRef.current = state }, [state])

    const triggerHandoff = async () => {
        if (state !== 'idle') return

        const bpm = activeDeck === 'A' ? djEngine.stateA.bpm : djEngine.stateB.bpm
        if (bpm === 0) {
            console.warn("Cannot Handoff: BPM is 0")
            return
        }

        // Phase 1: Capture Loop (1 bar)
        setState('capturing')
        const barDuration = 60 / bpm * 4
        console.log(`[Handoff] Capturing ${barDuration}s...`)

        // This stops UI updates on waveform?
        await djEngine.captureLoop(activeDeck, barDuration)

        // Phase 2: Switch to Ghost
        setState('ghosting')

        // Phase 3: Trigger Next Track on Spotify
        // We need to know the Next Track URI.
        // Ideally handled by QueueManager or we just hit "Next"
        console.log(`[Handoff] Triggering Spotify Next`)
        // Assuming SpotifyBridge has next()
        // Or play(uri).
        // Let's try skipping to next
        // Fix: Use useQueue for next track
        const nextTrack = useQueue.getState().queue[0]
        if (nextTrack) {
            await SpotifyBridge.play(nextTrack.uri)
        } else {
            // Fallback
        }

        // Phase 4: Wait for Audio (System Input)
        // We poll the input level? 
        // Or we just wait a fixed time (2s)?
        // Real detection is hard without an Analyzer on the Input separate from the Ghost.
        // But we Muted the Input on the deck.
        // We need to unmute it on the OTHER deck?
        // Wait, if deck A is Ghosting, Deck B needs to be listening to System Input.

        const nextDeck = activeDeck === 'A' ? 'B' : 'A'

        // Enable System Input on Next Deck
        await djEngine.enableSystemInput(nextDeck)

        // We stay in Ghosting state until user mixes over?
        // Or we auto-mix?

        // The Prompt says: "Route System Input to Deck B. User is now mixing Ghost Loop (A) vs Live Stream (B)."

        setState('mixed')
    }

    const finishTransition = () => {
        if (state !== 'mixed') return

        // Cleanup
        djEngine.stopGhosting(activeDeck)
        setState('idle')
    }

    return {
        transitionState: state,
        triggerHandoff,
        finishTransition
    }
}
