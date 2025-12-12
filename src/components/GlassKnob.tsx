import React, { useState, useEffect, useRef } from 'react'

interface GlassKnobProps {
    value: number // 0 to 1
    onChange: (val: number) => void
    min?: number
    max?: number
    label: string
    color?: string
    size?: number
}

export default function GlassKnob({ value, onChange, min = 0, max = 1, label, color = '#4facfe', size = 60 }: GlassKnobProps) {
    const [dragging, setDragging] = useState(false)
    const [startY, setStartY] = useState(0)
    const [startVal, setStartVal] = useState(0)

    // Normalize value to 0..1 for display
    const normalized = (value - min) / (max - min)

    // Calculate ARC
    const center = size / 2
    const radius = size / 2 - 4
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (normalized * circumference * 0.75) // 270 degree arc

    // Handler for drag
    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        setStartY(e.clientY)
        setStartVal(value)
    }

    useEffect(() => {
        if (!dragging) return
        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = startY - e.clientY
            const range = max - min
            const deltaVal = (deltaY / 100) * range // 100px = full range
            const newVal = Math.min(max, Math.max(min, startVal + deltaVal))
            onChange(newVal)
        }
        const handleMouseUp = () => setDragging(false)

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragging, startY, startVal, min, max, onChange])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
                onMouseDown={handleMouseDown}
                style={{
                    width: size, height: size,
                    borderRadius: '50%',
                    position: 'relative',
                    cursor: 'ns-resize',
                    background: 'rgba(255,255,255,0.05)',
                    boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.05)`,
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
                    {/* Track */}
                    <circle cx={center} cy={center} r={radius}
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"
                        strokeDasharray={circumference * 0.75 + ' ' + circumference}
                    />
                    {/* Value */}
                    <circle cx={center} cy={center} r={radius}
                        fill="none" stroke={color} strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                    />
                </svg>
                {/* Center Indicator */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: 'white', opacity: 0.5,
                    transform: 'translate(-50%, -50%)'
                }} />
            </div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>{label}</div>
        </div>
    )
}
