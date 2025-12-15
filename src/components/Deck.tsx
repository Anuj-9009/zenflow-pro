import React from 'react'
import { VerticalWaveform } from './DJ/VerticalWaveform'
import { Waveform } from './Waveform'
import { LoopControls } from './LoopControls'
import { djEngine } from '../audio/DJEngine'
import { useStore } from '../store/useStore'

// Fallback Disc Icon if lucide not available or simple SVG preferred
const DiscIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24} height={size || 24}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

interface DeckProps {
    id: 'A' | 'B'
    deckState: any
    activeDeck: 'A' | 'B'
    transitionState: string
    waveData: Uint8Array
    onDrop: (e: React.DragEvent, id: 'A' | 'B') => void
}

export const Deck: React.FC<DeckProps> = ({ id, deckState, activeDeck, transitionState, waveData, onDrop }) => {
    const { colors } = useStore()
    const isActive = activeDeck === id
    const isTransiting = transitionState !== 'idle'
    const isGhosting = isActive && isTransiting

    // Alignment variants
    const alignClass = id === 'A' ? 'items-start text-left' : 'items-end text-right'
    const waveAlignClass = id === 'A' ? 'justify-start' : 'justify-end'
    const mirrorWave = id === 'B'

    return (
        <div
            className={`flex-1 relative flex flex-col ${alignClass} border-r border-white/5 last:border-r-0 last:border-l
                ${!deckState.track ? 'border-2 border-white/5 border-dashed m-4 rounded-xl' : ''}
            `}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, id)}
        >
            {/* 1. WAVEFORM / VISUAL BACKGROUND */}
            {deckState.track ? (
                <div className={`absolute inset-0 opacity-20 pointer-events-none flex ${waveAlignClass} transition-colors duration-500
                    ${isGhosting ? 'text-cyan-200 saturate-0 brightness-150' : ''}
                `}>
                    {/* Slight offset to not be flush against edge? No, flush is fine based on prompt "Visuals" tab removed. */}
                    <div className="h-full w-[160px] relative">
                        <VerticalWaveform
                            data={waveData}
                            width={160}
                            height={800}
                            color={isGhosting ? '#aee' : (id === 'A' ? colors.primary : colors.secondary)}
                            mirrored={mirrorWave}
                        />
                    </div>
                </div>
            ) : (
                /* 2. GHOST VINYL EMPTY STATE */
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                    <DiscIcon size={180} className="text-white/20 animate-spin-slow" />
                    <div className="mt-8 text-sm font-bold tracking-[0.3em] text-white/40 uppercase">Drag Song Here</div>
                </div>
            )}

            {/* 3. GHOST DECK STATUS (Subtle) */}
            {isGhosting && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                    <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-400 tracking-wider">BUFFER LOCK</span>
                    </div>
                </div>
            )}

            {/* 4. DECK HEADER (A / B) */}
            <div className={`absolute top-6 ${id === 'A' ? 'left-6' : 'right-6'} z-10`}>
                <h2 className="font-header text-8xl font-bold text-white/5 tracking-tighter select-none">{id}</h2>
            </div>

            {/* 5. TRACK INFO (Padded Inwards) */}
            <div className={`mt-32 px-12 z-10 w-full ${alignClass}`}>
                {deckState.track && (
                    <>
                        <div className={`text-xs font-bold tracking-[0.2em] mb-2 ${id === 'A' ? 'text-emerald-500' : 'text-cyan-500'}`}>
                            NOW PLAYING
                        </div>
                        <h3
                            className="font-header text-5xl mb-2 leading-none w-full truncate"
                            title={typeof deckState.track === 'string' ? deckState.track : ''}
                        >
                            {deckState.track}
                        </h3>
                        <div className="text-white/40 font-mono text-base tracking-widest">
                            {deckState.bpm > 0 ? `${deckState.bpm} BPM` : 'ANALYZING...'}
                        </div>
                    </>
                )}
            </div>

            {/* 6. TRANSPORT CONTROLS (Bottom Padded) */}
            <div className={`mt-auto mb-12 px-12 flex gap-4 ${!deckState.track ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <button
                    onClick={async () => {
                        // CRITICAL: Start Audio Context on first click (Chrome requirement)
                        const Tone = await import('tone')
                        if (Tone.context.state !== 'running') {
                            await Tone.start()
                            console.log('[Deck] Audio context started')
                        }

                        // Toggle play/pause
                        if (deckState.isPlaying) {
                            djEngine.pause(id)
                        } else {
                            djEngine.play(id)
                        }
                    }}
                    className={`
                        px-10 py-6 rounded-full font-bold text-xl tracking-widest transition-all
                        ${deckState.isPlaying
                            ? 'bg-zinc-100 text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105'
                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700'}
                    `}
                >
                    {deckState.isPlaying ? 'PAUSE' : 'PLAY'}
                </button>

                <button
                    onClick={() => djEngine.syncTracks(id)}
                    className={`px-8 py-6 rounded-full font-bold tracking-widest transition-all border border-zinc-700
                        ${id === 'A'
                            ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white'
                            : 'text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white'}
                    `}
                >
                    SYNC
                </button>
            </div>
        </div>
    )
}

// Export with React.memo for performance
export const MemoizedDeck = React.memo(Deck)
