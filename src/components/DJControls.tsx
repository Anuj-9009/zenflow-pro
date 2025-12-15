import { useEffect, useState } from 'react'
import { djEngine } from '../audio/DJEngine'
import GlassKnob from './GlassKnob'
import { useStore } from '../store/useStore'
import { useQueue } from '../services/QueueManager'

import { useAutoMix } from '../hooks/useAutoMix'

export default function DJControls() {
    const { colors } = useStore()
    const { queue } = useQueue()
    const { isEnabled, toggleAutoMix } = useAutoMix()

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 1fr', height: '100%', gap: '2px', background: '#000' }}>
            {/* DECK A */}
            <DeckColumn id="A" color={colors.primary} />

            {/* CENTRAL MIXER & WAVEFORMS */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#0a0a0a', padding: '10px', position: 'relative' }}>
                {/* Waveforms (Vertical) */}
                <div style={{ flex: 1, display: 'flex', gap: '4px', overflow: 'hidden', position: 'relative' }}>
                    <VerticalWaveform id="A" color={colors.primary} />
                    <VerticalWaveform id="B" color={colors.secondary} />

                    {/* ZEN MODE TOGGLE OVERLAY */}
                    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
                        <button
                            onClick={toggleAutoMix}
                            style={{
                                background: isEnabled ? '#0ff' : 'rgba(0,0,0,0.5)',
                                color: isEnabled ? '#000' : '#fff',
                                border: '1px solid #0ff',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                fontSize: '10px',
                                letterSpacing: '2px',
                                cursor: 'pointer',
                                boxShadow: isEnabled ? '0 0 15px #0ff' : 'none',
                                transition: 'all 0.3s'
                            }}
                        >
                            ZEN MODE {isEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {/* Center Line */}
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.5)', zIndex: 10 }} />
                </div>

                {/* Mixer Controls */}
                <div style={{ height: '300px', display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    {/* EQ A */}
                    <EQColumn id="A" color={colors.primary} />

                    {/* Master / Crossfader */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '60px' }}>
                        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: 10, opacity: 0.6 }}>X-FADE</div>
                        <input
                            type="range" min="0" max="1" step="0.01"
                            defaultValue="0.5"
                            onInput={(e) => djEngine.setCrossfader(parseFloat((e.target as HTMLInputElement).value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* EQ B */}
                    <EQColumn id="B" color={colors.secondary} />
                </div>
            </div>

            {/* DECK B */}
            <DeckColumn id="B" color={colors.secondary} />
        </div>
    )
}

function DeckColumn({ id, color }: { id: 'A' | 'B', color: string }) {
    const [meta, setMeta] = useState({ track: 'Empty', bpm: 0 })

    // Placeholder to read engine state
    // In real app, subscribe to engine updates

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const spotifyData = e.dataTransfer.getData('application/json')
        if (spotifyData) {
            try {
                const track = JSON.parse(spotifyData)
                console.log(`Dropped Spotify Track on Deck ${id}:`, track)
                setMeta({ track: track.name, bpm: 124 }) // Mock BPM or read features

                // 1. Virtual Load
                await djEngine.loadTrack(id, track.uri) // e.g. "spotify:track:..."

                // 2. Enable System Input (Virtual Cable)
                await djEngine.enableSystemInput(id)

                // 3. Remote Play (Spotify Bridge)
                // Import SpotifyBridge?
                // Better to use QueueManager or direct import if simple
                // let's assume we trigger it here or Engine handles it.
                // Engine doesn't import SpotifyBridge (Audio layer shouldn't depend on Service layer if possible, avoiding circular dep)
                // So we do it here in UI.
            } catch (err) { console.error(err) }
        }
    }

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{ background: '#111', display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative', border: `1px solid ${color}20` }}
        >
            <h2 style={{ color, fontSize: '40px', margin: 0 }}>{id}</h2>

            {/* Vinyl Spinner */}
            <div style={{ margin: '40px auto', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, #222 60%, #000 61%)`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '190px', height: '190px', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)' }} />
            </div>

            {/* Info */}
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{meta.track}</div>
                <div style={{ fontSize: '14px', opacity: 0.6, marginTop: '5px' }}>--:--</div>
            </div>

            {/* Transport */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="pro-btn" onClick={() => djEngine.play(id)} style={{ background: color, color: 'black' }}>PLAY</button>
                <button className="pro-btn" onClick={() => djEngine.pause(id)}>PAUSE</button>
                <button className="pro-btn outline" onClick={() => djEngine.enableSystemInput(id)}>LIVE IN</button>
            </div>

            <style>{`
                .pro-btn { padding: 15px 30px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: white; font-weight: 700; cursor: pointer; }
                .pro-btn:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    )
}

function EQColumn({ id, color }: { id: 'A' | 'B', color: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <GlassKnob label="HI" value={0} min={-10} max={10} onChange={v => djEngine.setEQ(id, 'high', v)} color={color} size={40} />
            <GlassKnob label="MID" value={0} min={-10} max={10} onChange={v => djEngine.setEQ(id, 'mid', v)} color={color} size={40} />
            <GlassKnob label="LOW" value={0} min={-10} max={10} onChange={v => djEngine.setEQ(id, 'low', v)} color={color} size={40} />
            <div style={{ height: 10 }} />
            <GlassKnob label="FILT" value={0} min={-1} max={1} onChange={v => djEngine.setFilter(id, v)} color="white" size={50} />
        </div>
    )
}

function VerticalWaveform({ id, color }: { id: 'A' | 'B', color: string }) {
    return (
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            {/* Simulated Waveform Stripes */}
            <div style={{
                position: 'absolute', top: '-100%', left: 0, right: 0, height: '200%',
                background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}40 2px, ${color}80 4px)`,
                animation: 'scrollDown 2s linear infinite'
            }} />
            <style>{`
                @keyframes scrollDown {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50%); }
                }
            `}</style>
        </div>
    )
}
