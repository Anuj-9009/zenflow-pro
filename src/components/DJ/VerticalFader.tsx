import React from 'react'

interface VerticalFaderProps {
    value: number // 0-100
    onChange: (value: number) => void
    color?: string
    label?: string
    meterLevel?: number // 0-100, for VU meter
}

export const VerticalFader: React.FC<VerticalFaderProps> = ({
    value, onChange, color = '#fff', label, meterLevel = 0
}) => {
    const height = 160
    const thumbHeight = 32
    const trackWidth = 8

    // Calculate thumb position (inverted: 100 = top, 0 = bottom)
    const thumbTop = ((100 - value) / 100) * (height - thumbHeight)

    return (
        <div className="flex flex-col items-center gap-2">
            {label && (
                <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{label}</div>
            )}

            <div className="flex items-end gap-2">
                {/* VU Meter */}
                <div
                    className="w-1 rounded-full overflow-hidden relative"
                    style={{ height: height, background: 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="absolute bottom-0 left-0 w-full transition-all duration-75"
                        style={{
                            height: `${meterLevel}%`,
                            background: `linear-gradient(to top, #22c55e 0%, #eab308 60%, #ef4444 100%)`
                        }}
                    />
                </div>

                {/* Fader Track */}
                <div
                    className="relative cursor-ns-resize rounded-lg"
                    style={{
                        width: 40,
                        height: height,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const handleMove = (ev: MouseEvent) => {
                            const y = ev.clientY - rect.top
                            const pct = Math.max(0, Math.min(100, 100 - (y / height) * 100))
                            onChange(pct)
                        }
                        const handleUp = () => {
                            document.removeEventListener('mousemove', handleMove)
                            document.removeEventListener('mouseup', handleUp)
                        }
                        document.addEventListener('mousemove', handleMove)
                        document.addEventListener('mouseup', handleUp)
                        handleMove(e.nativeEvent as MouseEvent)
                    }}
                >
                    {/* Center Line */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-white/10 rounded-full"
                        style={{ top: 8, bottom: 8 }}
                    />

                    {/* Fader Thumb */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 rounded-sm shadow-lg pointer-events-none transition-transform duration-75"
                        style={{
                            top: thumbTop,
                            width: 32,
                            height: thumbHeight,
                            background: `linear-gradient(to bottom, #e4e4e7, #a1a1aa)`,
                            boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 10px ${color}30`
                        }}
                    >
                        {/* Grip Lines */}
                        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
                            <div className="h-[1px] bg-black/20" />
                            <div className="h-[1px] bg-black/20" />
                            <div className="h-[1px] bg-black/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Value Display */}
            <div className="text-xs font-mono text-white/30">{Math.round(value)}</div>
        </div >
    )
}
