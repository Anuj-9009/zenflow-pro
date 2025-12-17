import React from 'react'
import { VerticalWaveform } from './DJ/VerticalWaveform'
import { Waveform } from './Waveform'
import { LoopControls } from './LoopControls'
import { djEngine } from '../audio/DJEngine'
import { useStore } from '../store/useStore'
import { usePlayer } from '../context/PlayerContext'

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
    const { toggleDeck } = usePlayer()
    const isActive = activeDeck === id
    const isTransiting = transitionState !== 'idle'
    const isGhosting = isActive && isTransiting

    // Alignment variants
    const alignClass = id === 'A' ? 'items-start text-left' : 'items-end text-right'
    const waveAlignClass = id === 'A' ? 'justify-start' : 'justify-end'
    const mirrorWave = id === 'B'

    return (
        <div
            className={`deck ${!deckState.track ? 'opacity-70' : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, id)}
        >
            {/* 0. ALBUM ART BLUR BACKGROUND */}
            {deckState.image && (
                <div
                    className="deck-bg"
                    style={{ backgroundImage: `url(${deckState.image})` }}
                />
            )}

            <div className="deck-content w-full h-full justify-between py-6">

                {/* 1. DECK HEADER */}
                <div className="w-full flex justify-between items-start px-4">
                    <h2 className="font-header text-6xl font-bold text-[var(--text-disabled)] opacity-30 select-none">{id}</h2>
                    {isGhosting && (
                        <div className="px-3 py-1 rounded-full bg-[var(--glass-bg)] border border-[var(--accent-glow)] backdrop-blur-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-[10px] font-bold text-[var(--accent)] tracking-wider">SYNC LOCK</span>
                        </div>
                    )}
                </div>

                {/* 2. WAVEFORM / EMPTY STATE */}
                <div className="flex-1 w-full flex items-center justify-center relative">
                    {deckState.track ? (
                        <div className="w-full h-full flex items-center justify-center opacity-80">
                            {/* Placeholder for VerticalWaveform - ensuring it fits container */}
                            <div className="h-[80%] w-[120px]">
                                <VerticalWaveform
                                    data={waveData}
                                    width={120}
                                    height={600}
                                    color={isGhosting ? '#aee' : (id === 'A' ? colors.primary : colors.secondary)}
                                    mirrored={mirrorWave}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center opacity-30">
                            <DiscIcon size={120} className="text-[var(--text-disabled)] animate-spin-slow" />
                            <div className="mt-6 text-xs font-bold tracking-[0.3em] text-[var(--text-disabled)] uppercase">Drag Song Here</div>
                        </div>
                    )}
                </div>

                {/* 3. TRACK INFO */}
                <div className={`w-full px-4 mb-6 ${alignClass}`}>
                    {deckState.track && (
                        <>
                            <div className="text-[10px] font-bold tracking-[0.2em] mb-1 text-[var(--accent)]">
                                NOW PLAYING
                            </div>
                            <h3 className="text-3xl font-bold mb-1 leading-tight truncate w-full text-[var(--text-primary)]">
                                {deckState.track}
                            </h3>
                            <div className="text-[var(--text-secondary)] font-mono text-sm tracking-widest">
                                {deckState.bpm > 0 ? `${deckState.bpm} BPM` : 'ANALYZING...'}
                            </div>
                        </>
                    )}
                </div>

                {/* 4. CONTROLS */}
                <div className={`w-full px-4 flex gap-4 ${!deckState.track ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button
                        onClick={async () => {
                            // CRITICAL: Start Audio Context first
                            const Tone = await import('tone')
                            if (Tone.context.state !== 'running') await Tone.start()

                            // Route via PlayerContext (handles Spotify vs Local)
                            await toggleDeck(id)
                        }}
                        className={`flex-1 py-4 rounded-full font-bold text-sm tracking-widest transition-all
                            ${deckState.isPlaying
                                ? 'bg-[var(--accent)] text-black shadow-[var(--shadow-glow)] hover:scale-105'
                                : 'glass-panel text-white hover:bg-[var(--bg-hover)]'}
                        `}
                    >
                        {deckState.isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>

                    <button
                        onClick={() => djEngine.syncTracks(id)}
                        className="px-6 py-4 rounded-full font-bold text-sm tracking-widest glass-panel text-[var(--accent)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                    >
                        SYNC
                    </button>
                </div>
            </div>
        </div>
    )
}

// Export with React.memo for performance
export const MemoizedDeck = React.memo(Deck)
