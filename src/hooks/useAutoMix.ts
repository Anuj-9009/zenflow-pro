import { useEffect, useRef, useState } from 'react'
import { djEngine } from '../audio/DJEngine'

export const useAutoMix = () => {
    const [isEnabled, setIsEnabled] = useState(false)
    const [status, setStatus] = useState<'idle' | 'mixing'>('idle')
    const loopRef = useRef<number>()

    useEffect(() => {
        if (!isEnabled) {
            cancelAnimationFrame(loopRef.current!)
            setStatus('idle')
            return
        }

        const checkAutoMix = () => {
            // Get States
            const pos = djEngine.getPositions()
            const stateA = djEngine.stateA
            const stateB = djEngine.stateB

            // Active Queue Logic (Mocked: If Deck A is playing, check time)
            // Trigger 10s before end
            if (stateA.isPlaying && stateA.duration > 0) {
                const remaining = stateA.duration - pos.posA

                if (remaining < 10 && remaining > 1 && status === 'idle') {
                    console.log("AutoMix: Triggering Transition A -> B")
                    performTransition('A')
                }
            } else if (stateB.isPlaying && stateB.duration > 0) {
                const remaining = stateB.duration - pos.posB
                if (remaining < 10 && remaining > 1 && status === 'idle') {
                    console.log("AutoMix: Triggering Transition B -> A")
                    performTransition('B')
                }
            }

            loopRef.current = requestAnimationFrame(checkAutoMix)
        }

        loopRef.current = requestAnimationFrame(checkAutoMix)

        return () => cancelAnimationFrame(loopRef.current!)
    }, [isEnabled, status])

    const performTransition = async (currentDeck: 'A' | 'B') => {
        setStatus('mixing')
        const targetDeck = currentDeck === 'A' ? 'B' : 'A'

        // 1. Start Target
        djEngine.play(targetDeck)

        // 2. Sync BPM
        djEngine.syncTracks(targetDeck)

        // 3. Automated Crossfade (8 seconds)
        const start = Date.now()
        const duration = 8000
        const startVal = currentDeck === 'A' ? 0 : 1
        const endVal = currentDeck === 'A' ? 1 : 0

        const fadeLoop = () => {
            const now = Date.now()
            const progress = (now - start) / duration

            if (progress >= 1) {
                // Done
                djEngine.setCrossfader(endVal)
                djEngine.pause(currentDeck)
                // Reset crossfader? No, keep it there or reset center?
                // Standard AutoMix usually keeps it on the new deck or resets if it loads next track to A.
                // Let's leave it at endVal for smooth transition.
                setStatus('idle') // Ready for next one
            } else {
                // Linear or Equal Power?
                // Visual slider update handled by polling?
                // We set Engine value directly
                const val = startVal + (endVal - startVal) * progress
                djEngine.setCrossfader(val)
                requestAnimationFrame(fadeLoop)
            }
        }
        fadeLoop()
    }

    return { isEnabled, toggleAutoMix: () => setIsEnabled(!isEnabled) }
}
