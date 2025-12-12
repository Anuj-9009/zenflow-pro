import { useEffect, useState } from 'react'
import { djEngine, DeckState } from '../audio/DJEngine'

export const useDJEngine = () => {
    // Reactive State Capsules
    const [deckA, setDeckA] = useState<DeckState>(djEngine.stateA)
    const [deckB, setDeckB] = useState<DeckState>(djEngine.stateB)
    const [crossfader, setCrossfader] = useState(djEngine.crossfadeValue)

    // Polling Loop for Visuals (Positions)
    // We don't want to re-render React on every frame for positions, 
    // but specific UI components might need it. 
    // Better to have a getPositions() method for the Canvas loop, 
    // and only Sync State (Play/Pause/Track) here.

    useEffect(() => {
        // Simple polling for state changes that aren't driven by UI
        // In a real event-driven architecture, DJEngine would extend EventEmitter.
        // For now, we manually sync on actions, but this effect handles external updates.

        const sync = setInterval(() => {
            if (djEngine.stateA !== deckA) setDeckA({ ...djEngine.stateA })
            if (djEngine.stateB !== deckB) setDeckB({ ...djEngine.stateB })
            // Crossfader is usually UI driven, but automation might change it
            if (djEngine.crossfadeValue !== crossfader) setCrossfader(djEngine.crossfadeValue)
        }, 100) // 10Hz sync

        return () => clearInterval(sync)
    }, [deckA, deckB, crossfader])

    return {
        deckA,
        deckB,
        crossfader,

        // Actions
        loadTrack: (deck: 'A' | 'B', file: File) => djEngine.loadTrack(deck, file),
        play: (deck: 'A' | 'B') => djEngine.play(deck),
        pause: (deck: 'A' | 'B') => djEngine.pause(deck),
        sync: (deck: 'A' | 'B') => djEngine.syncTracks(deck),
        setCrossfader: (val: number) => {
            djEngine.setCrossfader(val)
            setCrossfader(val)
        },
        // Direct Engine Access for Canvas/Loop
        engine: djEngine
    }
}
