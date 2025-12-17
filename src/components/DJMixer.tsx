import { useState, useEffect } from 'react'
import { RotaryKnob } from './DJ/RotaryKnob'
import { VerticalFader } from './DJ/VerticalFader'
import { useStore } from '../store/useStore'
import { djEngine } from '../audio/DJEngine'

interface DJMixerProps {
    eqA: any
    eqB: any
    setEqA: (val: any) => void
    setEqB: (val: any) => void
    crossfader: number
    setCrossfader: (val: number) => void
    transitionState: string
    triggerHandoff: () => void
}

export const DJMixer: React.FC<DJMixerProps> = ({
    eqA, eqB, setEqA, setEqB,
    crossfader, setCrossfader,
    transitionState, triggerHandoff
}) => {
    const { colors } = useStore()

    // Volume States
    const [volumeA, setVolumeA] = useState(80)
    const [volumeB, setVolumeB] = useState(80)
    const [masterVolume, setMasterVolume] = useState(75)

    // Pitch States (1.0 = normal speed)
    const [pitchA, setPitchA] = useState(1.0)
    const [pitchB, setPitchB] = useState(1.0)

    // Loop States
    const [loopA, setLoopA] = useState(false)
    const [loopB, setLoopB] = useState(false)

    // Fake VU Meter Levels (In production, connect to DJEngine analyzer)
    const [meterA, setMeterA] = useState(0)
    const [meterB, setMeterB] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate VU meter bounce (replace with real analyzer data)
            setMeterA(prev => Math.max(20, Math.min(95, prev + (Math.random() - 0.5) * 30)))
            setMeterB(prev => Math.max(20, Math.min(95, prev + (Math.random() - 0.5) * 30)))
        }, 100)
        return () => clearInterval(interval)
    }, [])

    // Update engine volumes
    useEffect(() => {
        djEngine.setVolume?.('A', volumeA / 100)
        djEngine.setVolume?.('B', volumeB / 100)
    }, [volumeA, volumeB])

    useEffect(() => {
        djEngine.setMasterVolume?.(masterVolume / 100)
    }, [masterVolume])

    // Update engine pitch
    useEffect(() => {
        djEngine.setPitch?.('A', pitchA)
    }, [pitchA])

    useEffect(() => {
        djEngine.setPitch?.('B', pitchB)
    }, [pitchB])

    // Update engine loop
    useEffect(() => {
        djEngine.setLoop?.('A', loopA)
    }, [loopA])

    useEffect(() => {
        djEngine.setLoop?.('B', loopB)
    }, [loopB])

    // Update engine volumes
    useEffect(() => {
        djEngine.setVolume?.('A', volumeA / 100)
        djEngine.setVolume?.('B', volumeB / 100)
    }, [volumeA, volumeB])

    useEffect(() => {
        djEngine.setMasterVolume?.(masterVolume / 100)
    }, [masterVolume])

    return (
        <div className="mixer w-full h-full justify-between">

            {/* === MASTER VOLUME (Top) === */}
            <div className="flex justify-center items-center gap-4 pb-4 border-b border-white/5">
                <RotaryKnob
                    label="MASTER"
                    value={masterVolume}
                    min={0} max={100}
                    onChange={setMasterVolume}
                    color="#fff"
                    size={50}
                />
                <div className="flex flex-col">
                    <div className="text-[10px] font-bold tracking-widest text-white/30">OUTPUT</div>
                    <div className="text-lg font-mono text-white/60">{masterVolume}%</div>
                </div>
            </div>

            {/* === FILTER SECTION === */}
            <div className="flex justify-between items-center px-6">
                <RotaryKnob
                    label="FILT A"
                    value={eqA.filter * 50 + 50}
                    onChange={v => {
                        const val = (v - 50) / 50
                        setEqA({ ...eqA, filter: val })
                        djEngine.setFilter('A', val)
                    }}
                    color={colors.primary}
                    size={50}
                />

                <div className="flex flex-col items-center">
                    <div className="font-header font-bold text-xl tracking-widest text-white/20">ZEN</div>
                </div>

                <RotaryKnob
                    label="FILT B"
                    value={eqB.filter * 50 + 50}
                    onChange={v => {
                        const val = (v - 50) / 50
                        setEqB({ ...eqB, filter: val })
                        djEngine.setFilter('B', val)
                    }}
                    color={colors.secondary}
                    size={50}
                />
            </div>

            {/* === EQ + FADERS SECTION === */}
            <div className="flex justify-between flex-1 px-4">

                {/* Channel A: EQ + Fader */}
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col justify-center gap-4">
                        <RotaryKnob label="HI" value={eqA.high} min={-10} max={10} onChange={v => { setEqA({ ...eqA, high: v }); djEngine.setEQ('A', 'high', v) }} size={40} />
                        <RotaryKnob label="MID" value={eqA.mid} min={-10} max={10} onChange={v => { setEqA({ ...eqA, mid: v }); djEngine.setEQ('A', 'mid', v) }} size={40} />
                        <RotaryKnob label="LOW" value={eqA.low} min={-10} max={10} onChange={v => { setEqA({ ...eqA, low: v }); djEngine.setEQ('A', 'low', v) }} size={40} />
                    </div>
                    <VerticalFader
                        value={volumeA}
                        onChange={setVolumeA}
                        color={colors.primary}
                        label="VOL A"
                        meterLevel={meterA}
                    />
                </div>

                {/* Channel B: Fader + EQ */}
                <div className="flex gap-4 items-center">
                    <VerticalFader
                        value={volumeB}
                        onChange={setVolumeB}
                        color={colors.secondary}
                        label="VOL B"
                        meterLevel={meterB}
                    />
                    <div className="flex flex-col justify-center gap-4">
                        <RotaryKnob label="HI" value={eqB.high} min={-10} max={10} onChange={v => { setEqB({ ...eqB, high: v }); djEngine.setEQ('B', 'high', v) }} color={colors.secondary} size={40} />
                        <RotaryKnob label="MID" value={eqB.mid} min={-10} max={10} onChange={v => { setEqB({ ...eqB, mid: v }); djEngine.setEQ('B', 'mid', v) }} color={colors.secondary} size={40} />
                        <RotaryKnob label="LOW" value={eqB.low} min={-10} max={10} onChange={v => { setEqB({ ...eqB, low: v }); djEngine.setEQ('B', 'low', v) }} color={colors.secondary} size={40} />
                    </div>
                </div>
            </div>

            {/* === AUTO HANDOFF BUTTON (Sleek Pill) === */}
            <div className="flex justify-center mt-4">
                <button
                    onClick={triggerHandoff}
                    disabled={transitionState !== 'idle'}
                    className={`
                        h-8 px-4 rounded-full text-xs font-bold uppercase tracking-widest 
                        flex items-center justify-center gap-2 transition-all duration-200
                        ${transitionState === 'idle'
                            ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:scale-105'
                            : 'bg-white text-black border-white animate-pulse cursor-not-allowed'}
                    `}
                >
                    {/* Zap Icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-current">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    {transitionState === 'idle' ? 'AUTOMIX' : 'MIXING...'}
                </button>
            </div>

            {/* === CROSSFADER (Bottom) === */}
            <div className="mt-6 px-4 pb-4">
                <div className="relative h-8 bg-white/5 rounded-full flex items-center px-3 border border-white/5">
                    <input
                        type="range" min="0" max="1" step="0.01"
                        value={crossfader}
                        onChange={(e) => setCrossfader(parseFloat(e.target.value))}
                        className="w-full h-full opacity-0 absolute inset-0 cursor-ew-resize z-10"
                    />
                    {/* Track */}
                    <div className="h-1 w-full bg-white/10 rounded-full absolute left-3 right-3 pointer-events-none" />
                    {/* Thumb */}
                    <div
                        className="w-12 h-6 bg-zinc-200 rounded shadow-lg absolute transition-transform duration-75 pointer-events-none"
                        style={{
                            left: `calc(${crossfader * 100}% - 24px + 12px)`,
                        }}
                    />
                </div>

                <div className="flex justify-between text-[10px] font-bold tracking-widest text-white/30 mt-2 px-2">
                    <span>A</span>
                    <span>CROSSFADE</span>
                    <span>B</span>
                </div>
            </div>

        </div>
    )
}
