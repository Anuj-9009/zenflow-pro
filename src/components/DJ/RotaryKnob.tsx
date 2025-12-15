import React, { useState, useRef, useEffect } from 'react'

interface RotaryKnobProps {
    value: number // 0-100
    min?: number
    max?: number
    onChange: (val: number) => void
    label?: string
    size?: number
    color?: string
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
    value,
    min = 0,
    max = 100,
    onChange,
    label,
    size = 60,
    color = '#10b981' // emerald-500 default
}) => {
    const [dragging, setDragging] = useState(false)
    const prevY = useRef<number>(0)

    // Calculate rotation: Map value (min-max) to angle (-145deg to +145deg)
    const percentage = (value - min) / (max - min)
    const angle = -145 + (percentage * 290)

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        prevY.current = e.clientY
        document.body.style.cursor = 'ns-resize'

        const handleMouseMove = (mv: MouseEvent) => {
            const dy = prevY.current - mv.clientY
            prevY.current = mv.clientY

            // Sensitivity
            const change = dy * 0.8

            // Note: We need to pull the LATEST value from a ref or use functional update if this was inside a hook that captured it.
            // Since we are firing onChange, the parent updates the prop, and we re-render. 
            // BUT inside this event listener 'value' might be stale if we aren't careful?
            // Actually, best pattern for knobs is to calculate new value based on DELTA and fire onChange.
            // The parent is responsible for clamping and state.
            // HOWEVER, we need the "current" value to add the delta to.
            // So we really should pass the functional update pattern or just use the delta.

            // Simplest: Fire delta? No, onChange expects absolute.
            // We'll rely on the parent updating `value` prop fast enough, 
            // OR proper way:
        }

        const handleMouseUp = () => {
            setDragging(false)
            document.body.style.cursor = 'default'
            window.removeEventListener('mousemove', handleMouseMoveGlobal)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        const handleMouseMoveGlobal = (mv: MouseEvent) => {
            const dy = prevY.current - mv.clientY // positive = drag up
            prevY.current = mv.clientY

            const range = max - min
            const delta = (dy / 200) * range // 200px drag = full range

            let newValue = value + delta
            // Clamp
            if (newValue < min) newValue = min
            if (newValue > max) newValue = max

            // We can't rely on 'value' prop being fresh inside this closure if it doesn't re-bind.
            // If the component re-renders, handleMouseDown captures the *new* value scope? No.
            // Standard React closure staleness.
            // Better to use a mutable ref for the value or re-bind.

            // FIX: We will just fire the event with the calculated new value based on a Ref tracking current internal value
            // We must update the ref every render.
            // Or simpler:
            onChange(newValue)
        }

        // We need a stable ref to the value for the event listener
        // Let's rely on the fact that we can't easily fix the closure without a Ref.
        // I will implement a Ref to track value.
    }

    // Ref to track latest value for the event listener (to avoid stale closures)
    const valRef = useRef(value)
    useEffect(() => { valRef.current = value }, [value])

    const startDrag = (e: React.MouseEvent) => {
        setDragging(true)
        prevY.current = e.clientY
        document.body.style.cursor = 'ns-resize'

        const onMove = (ev: MouseEvent) => {
            const dy = prevY.current - ev.clientY
            prevY.current = ev.clientY

            const range = max - min
            const delta = (dy / 100) * range // 100px = full range for faster feel

            let next = valRef.current + delta
            if (next < min) next = min
            if (next > max) next = max

            onChange(next)
        }

        const onUp = () => {
            setDragging(false)
            document.body.style.cursor = 'default'
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    return (
        <div className="flex flex-col items-center gap-2 group cursor-ns-resize" onMouseDown={startDrag}>
            <div className="relative" style={{ width: size, height: size }}>
                {/* SVG Knob */}
                <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(90deg)' }}>
                    {/* Track */}
                    <circle cx="50" cy="50" r="40"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset="50.24" /* 20% gap at bottom */
                        strokeLinecap="round"
                        className="opacity-50"
                    />

                    {/* Fill */}
                    <circle cx="50" cy="50" r="40"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (percentage * 201)} /* Map 0-100 to the arc length (approx 80% circle) */
                        strokeLinecap="round"
                        className={`transition-all duration-75 ${dragging ? 'brightness-125' : ''}`}
                    />
                </svg>

                {/* Center Cap / Value readout optionally */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-[10px] font-mono font-bold text-white/50 tracking-tighter">
                        {Math.round(value)}
                    </div>
                </div>
            </div>

            {label && (
                <span className={`text-[10px] uppercase tracking-widest font-bold text-white/40 group-hover:text-white/80 transition-colors select-none`}>
                    {label}
                </span>
            )}
        </div>
    )
}
