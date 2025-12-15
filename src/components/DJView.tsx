import { useEffect, useState } from 'react'
import { djEngine } from '../audio/DJEngine'
import { useSystemAudio } from '../hooks/useSystemAudio'
import { useStore } from '../store/useStore'
import { useAutoMix } from '../hooks/useAutoMix'
import { useDJEngine } from '../hooks/useDJEngine'
import { useTransition } from '../hooks/useTransition'
import { DJMixer } from './DJMixer'
import { Deck } from './Deck'

export default function DJView() {
    const { colors } = useStore()
    const { startSystemCapture } = useSystemAudio()
    const { isEnabled: isAutoMix, toggleAutoMix } = useAutoMix()

    // Engine State
    const { deckA, deckB, crossfader, setCrossfader } = useDJEngine()

    // Transition Logic
    const activeDeck = crossfader < 0.5 ? 'A' : 'B'
    const { transitionState, triggerHandoff } = useTransition(activeDeck)

    // Local state for EQ/Filter visual feedback variables
    // (Ideally this should also be in useDJEngine or useStore if persistent)
    const [eqA, setEqA] = useState({ low: 0, mid: 0, high: 0, filter: 0 })
    const [eqB, setEqB] = useState({ low: 0, mid: 0, high: 0, filter: 0 })

    // Dummy Waveform Data
    const [waveA, setWaveA] = useState<Uint8Array>(new Uint8Array(50).fill(0))
    const [waveB, setWaveB] = useState<Uint8Array>(new Uint8Array(50).fill(0))

    useEffect(() => {
        const loop = () => {
            if (deckA.isPlaying) {
                setWaveA(prev => {
                    const next = new Uint8Array(prev.length)
                    next.set(prev.subarray(0, prev.length - 1), 1)
                    next[0] = Math.random() * 255
                    return next
                })
            }
            if (deckB.isPlaying) {
                setWaveB(prev => {
                    const next = new Uint8Array(prev.length)
                    next.set(prev.subarray(0, prev.length - 1), 1)
                    next[0] = Math.random() * 255
                    return next
                })
            }
        }
        const interval = setInterval(loop, 50)
        return () => clearInterval(interval)
    }, [deckA.isPlaying, deckB.isPlaying])


    // Drag Handlers
    const onDrop = async (e: React.DragEvent, deck: 'A' | 'B') => {
        e.preventDefault()
        e.stopPropagation()

        const jsonData = e.dataTransfer.getData('application/json')
        if (jsonData) {
            try {
                const data = JSON.parse(jsonData)
                if (data.type === 'spotify') {
                    await import('../services/SpotifyBridge').then(m => m.SpotifyBridge.play(data.uri))
                    startSystemCapture(deck)
                    djEngine.loadTrack(deck, `${data.name} - ${data.artist}`)
                    // Also trigger BPM analysis simulation?
                    return
                }
            } catch (err) { }
        }

        const file = e.dataTransfer.files[0]
        if (file) {
            await djEngine.loadTrack(deck, file)
        }
    }

    return (
        <div className="h-full w-full flex bg-bg text-white font-sans overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#050510] to-[#0a0a1a] -z-10" />

            {/* DECK A */}
            <Deck
                id="A"
                deckState={deckA}
                activeDeck={activeDeck}
                transitionState={transitionState}
                waveData={waveA}
                onDrop={onDrop}
            />

            {/* CENTER MIXER */}
            <DJMixer
                eqA={eqA} eqB={eqB}
                setEqA={setEqA} setEqB={setEqB}
                crossfader={crossfader} setCrossfader={setCrossfader}
                transitionState={transitionState} triggerHandoff={triggerHandoff}
            />

            {/* DECK B */}
            <Deck
                id="B"
                deckState={deckB}
                activeDeck={activeDeck}
                transitionState={transitionState}
                waveData={waveB}
                onDrop={onDrop}
            />
        </div>
    )
}
