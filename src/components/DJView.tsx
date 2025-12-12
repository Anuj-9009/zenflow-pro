import { useEffect, useRef, useState } from 'react'
import { djEngine } from '../audio/DJEngine'
import GlassKnob from './GlassKnob'
import LyricsView from './LyricsView'
import { useSystemAudio } from '../hooks/useSystemAudio'
import { useStore } from '../store/useStore'

export default function DJView() {
    const { colors } = useStore()
    const { startSystemCapture } = useSystemAudio()
    const [deckA, setDeckA] = useState({ track: 'No Track', vol: 0, low: 0, mid: 0, high: 0, filter: 0 })
    const [deckB, setDeckB] = useState({ track: 'No Track', vol: 0, low: 0, mid: 0, high: 0, filter: 0 })
    const [crossfader, setCrossfader] = useState(0.5)

    useEffect(() => {
        djEngine.init()
    }, [])

    // Waveform Canvas Renderer
    const renderWaveform = (canvas: HTMLCanvasElement, color: string, speed: number) => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        let offset = 0
        const loop = () => {
            offset += speed
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = color

            // Draw "Liquid River" (Simulated Waveform)
            // We draw mirrored bars vertically
            const bars = 50
            const h = canvas.height
            const w = canvas.width
            const step = h / bars

            for (let i = 0; i < bars + 2; i++) {
                // Perlin-ish noise
                const y = (i * step) - (offset % step)
                const noise = Math.sin((i + offset * 0.1) * 0.5) * 0.5 + 0.5
                const width = noise * w * 0.8
                const x = (w - width) / 2

                ctx.globalAlpha = 0.6
                ctx.fillRect(x, y, width, step * 0.8)
            }
            requestAnimationFrame(loop)
        }
        loop()
    }

    // XY Pad Logic
    const xyRef = useRef<HTMLDivElement>(null)
    const [xy, setXY] = useState({ x: 0, y: 0 })

    const handleXYMove = (e: React.MouseEvent) => {
        if (e.buttons !== 1) return
        const rect = xyRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
        setXY({ x, y })
        djEngine.setXYPad(x, y)
    }

    // --- UI UPDATER LOOP ---
    useEffect(() => {
        const loop = () => {
            // In a real app we'd poll engine positions here if needed
            // For now we rely on user interaction
            requestAnimationFrame(loop)
        }
        loop()
    }, [])

    return (
        <div style={{ height: '100%', display: 'flex', gap: '20px', padding: '20px' }}>

            {/* DECK A */}
            <div className="deck-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: colors.primary }}>DECK A</div>
                    <button
                        onClick={() => djEngine.syncTracks('A')}
                        style={{ fontSize: '12px', background: colors.primary, border: 'none', color: 'black' }}
                    >SYNC</button>
                </div>
                <div style={{ fontSize: '14px', opacity: 0.6 }}>{deckA.track}</div>

                {/* Waveform Window */}
                <div
                    onMouseDown={(e) => {
                        // Simple Scrub
                        const rect = e.currentTarget.getBoundingClientRect()
                        const p = (e.clientX - rect.left) / rect.width
                        djEngine.seek('A', p)
                    }}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'ew-resize' }}
                >
                    <WaveformCanvas color={colors.primary} speed={deckA.vol > 0 ? 2 : 0} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.5)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={() => {
                        const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*'
                        input.onchange = (e: any) => {
                            if (e.target.files[0]) {
                                djEngine.loadTrack('A', e.target.files[0])
                                setDeckA({ ...deckA, track: e.target.files[0].name })
                            }
                        }
                        input.click()
                    }}>LOAD</button>
                    <button onClick={() => { djEngine.play('A'); setDeckA({ ...deckA, vol: 1 }) }}>PLAY</button>
                    <button onClick={() => djEngine.pause('A')}>PAUSE</button>
                </div>
            </div>

            {/* MIXER CENTER */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>

                {/* XY FX Pad */}
                <div
                    ref={xyRef}
                    onMouseMove={handleXYMove}
                    style={{
                        width: '200px', height: '150px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative', overflow: 'hidden', cursor: 'crosshair',
                        boxShadow: `0 0 30px ${colors.primary}20`
                    }}
                >
                    <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '10px', opacity: 0.5 }}>FX PAD</div>
                    {/* Cursor */}
                    <div style={{
                        position: 'absolute',
                        left: `${xy.x * 100}%`, top: `${xy.y * 100}%`,
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: 'white', transform: 'translate(-50%, -50%)',
                        boxShadow: `0 0 10px white, 0 0 20px ${colors.primary}`
                    }} />
                </div>

                {/* EQ SECTION */}
                <div style={{ display: 'flex', gap: '40px' }}>
                    {/* Deck A EQs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        {/* We only have global filter in engine for now? No, we added EQs! Engine exposes them but we need to wire knobs */}
                        {/* Actually DJEngine class has eqA/eqB but we need setters */}
                        {/* For MVP, let's keep Filter only as it is most audible */}
                        <GlassKnob label="FILT" value={deckA.filter} min={-1} max={1} onChange={v => { setDeckA({ ...deckA, filter: v }); djEngine.setFilter('A', v) }} color={colors.primary} />
                    </div>

                    {/* Deck B EQs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <GlassKnob label="FILT" value={deckB.filter} min={-1} max={1} onChange={v => { setDeckB({ ...deckB, filter: v }); djEngine.setFilter('B', v) }} color={colors.secondary} />
                    </div>
                </div>

                {/* Crossfader */}
                <div style={{ width: '100%', marginTop: 'auto', marginBottom: '40px' }}>
                    <input
                        type="range" min="0" max="1" step="0.01"
                        value={crossfader}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            setCrossfader(v)
                            djEngine.setCrossfader(v)
                        }}
                        style={{
                            width: '100%',
                            accentColor: crossfader < 0.5 ? colors.primary : colors.secondary,
                            cursor: 'grab'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px', opacity: 0.5 }}>
                        <span>A</span>
                        <span>CROSSFADE</span>
                        <span>B</span>
                    </div>
                </div>

            </div>

            {/* DECK B */}
            <div className="deck-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        onClick={() => djEngine.syncTracks('B')}
                        style={{ fontSize: '12px', background: colors.secondary, border: 'none', color: 'black' }}
                    >SYNC</button>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: colors.secondary, textAlign: 'right' }}>DECK B</div>
                </div>
                <div style={{ fontSize: '14px', opacity: 0.6, textAlign: 'right' }}>{deckB.track}</div>

                {/* Waveform Window */}
                <div
                    onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const p = (e.clientX - rect.left) / rect.width
                        djEngine.seek('B', p)
                    }}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'ew-resize' }}
                >
                    <WaveformCanvas color={colors.secondary} speed={deckB.vol > 0 ? 2 : 0} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.5)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={() => {
                        const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*'
                        input.onchange = (e: any) => {
                            if (e.target.files[0]) {
                                djEngine.loadTrack('B', e.target.files[0])
                                setDeckB({ ...deckB, track: e.target.files[0].name })
                            }
                        }
                        input.click()
                    }}>LOAD</button>
                    <button onClick={() => { djEngine.play('B'); setDeckB({ ...deckB, vol: 1 }) }}>PLAY</button>
                    <button onClick={() => djEngine.pause('B')}>PAUSE</button>
                </div>
            </div>

            {/* Lyrics Layer - Ultra Fluid (Atlas Fix 1) */}
            <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '500px', bottom: 0, pointerEvents: 'none', zIndex: 20
            }}>
                <LyricsView />
            </div>

            <style>{`
                button {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    letter-spacing: 1px;
                }
                button:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    )
}

function WaveformCanvas({ color, speed }: { color: string, speed: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const offsetRef = useRef(0)
    const reqRef = useRef<number>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Resize
        canvas.width = canvas.parentElement?.clientWidth || 200
        canvas.height = canvas.parentElement?.clientHeight || 400

        const loop = () => {
            // If speed is 0, we can still drift slowly
            const s = speed === 0 ? 0.2 : speed
            offsetRef.current += s

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = color

            const bars = 40
            const h = canvas.height
            const w = canvas.width
            const step = h / bars

            for (let i = 0; i < bars + 4; i++) {
                // Loop y
                const y = ((i * step) + (offsetRef.current % step)) - step * 2

                // Noise
                const t = (i + offsetRef.current * 0.05)
                const noise = Math.sin(t * 0.5) * 0.5 + 0.5

                const width = noise * w * 0.6
                const x = (w - width) / 2

                ctx.globalAlpha = speed === 0 ? 0.2 : 0.8

                // Rounded rect
                ctx.beginPath()
                ctx.roundRect(x, y, width, step * 0.6, 4)
                ctx.fill()
            }
            reqRef.current = requestAnimationFrame(loop)
        }
        loop()
        return () => cancelAnimationFrame(reqRef.current!)
    }, [color, speed])

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}
