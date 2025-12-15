// LoopControls - Beat-perfect looping controls for DJ decks
import React, { useState, useCallback } from 'react'
import { djEngine } from '../audio/DJEngine'

interface LoopControlsProps {
    deckId: 'A' | 'B'
}

export const LoopControls: React.FC<LoopControlsProps> = ({ deckId }) => {
    const [activeLoop, setActiveLoop] = useState<number | null>(null)

    const state = deckId === 'A' ? djEngine.stateA : djEngine.stateB
    const bpm = state.bpm || 120

    /**
     * Set a loop for N beats
     * duration = (60 / BPM) * beats
     */
    const setLoop = useCallback((beats: number) => {
        const strip = deckId === 'A' ? djEngine.stripA : djEngine.stripB
        const player = strip.input

        if (!player || !('loop' in player)) {
            console.log('[Loop] No player available')
            return
        }

        // Calculate loop duration in seconds
        const beatsPerSecond = bpm / 60
        const loopDuration = beats / beatsPerSecond

        // Get current position
        const currentPos = state.position

        try {
            // @ts-ignore - Tone.Player loop properties
            player.loop = true
            player.loopStart = currentPos
            player.loopEnd = currentPos + loopDuration

            setActiveLoop(beats)
            console.log(`[Loop] Set ${beats} beat loop at ${currentPos}s, duration: ${loopDuration}s`)
        } catch (e) {
            console.error('[Loop] Failed to set loop:', e)
        }
    }, [deckId, bpm, state.position])

    /**
     * Exit the loop
     */
    const exitLoop = useCallback(() => {
        const strip = deckId === 'A' ? djEngine.stripA : djEngine.stripB
        const player = strip.input

        if (!player) return

        try {
            // @ts-ignore
            player.loop = false
            setActiveLoop(null)
            console.log('[Loop] Exited')
        } catch (e) {
            console.error('[Loop] Failed to exit:', e)
        }
    }, [deckId])

    const loopSizes = [
        { beats: 0.25, label: '1/4' },
        { beats: 0.5, label: '1/2' },
        { beats: 1, label: '1' },
        { beats: 2, label: '2' },
        { beats: 4, label: '4' },
        { beats: 8, label: '8' }
    ]

    return (
        <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/40 font-bold mr-1">LOOP</span>

            {loopSizes.map(({ beats, label }) => (
                <button
                    key={beats}
                    onClick={() => activeLoop === beats ? exitLoop() : setLoop(beats)}
                    className={`
                        w-7 h-6 text-[10px] font-bold rounded transition-all
                        ${activeLoop === beats
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
                    `}
                >
                    {label}
                </button>
            ))}

            <button
                onClick={exitLoop}
                disabled={activeLoop === null}
                className={`
                    px-2 h-6 text-[10px] font-bold rounded ml-1 transition-all
                    ${activeLoop !== null
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                `}
            >
                EXIT
            </button>
        </div>
    )
}

export default React.memo(LoopControls)
