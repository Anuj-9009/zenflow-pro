// Waves Visualizer - CSS-based for reliability
import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function WavesVisualizer() {
    const bass = useStore(state => state.bass)
    const mids = useStore(state => state.mids)
    const highs = useStore(state => state.highs)
    const colors = useStore(state => state.colors)
    const isPlaying = useStore(state => state.isPlaying)

    // Generate wave bars
    const waveBars = useMemo(() => {
        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            delay: i * 0.05,
            baseHeight: 20 + Math.random() * 30
        }))
    }, [])

    // Floating orbs
    const orbs = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => ({
            id: i,
            size: 30 + Math.random() * 50,
            x: 10 + (i * 12),
            y: 30 + Math.random() * 40,
            delay: i * 0.5,
            duration: 4 + Math.random() * 3
        }))
    }, [])

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: `linear-gradient(180deg, ${colors.background} 0%, #000 100%)`,
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
        }}>
            {/* Background gradient glow */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: `linear-gradient(0deg, ${colors.primary}15 0%, transparent 100%)`,
                transition: 'opacity 0.3s ease',
                opacity: isPlaying ? 1 : 0.5
            }} />

            {/* Wave bars container */}
            <div style={{
                position: 'absolute',
                bottom: '20%',
                left: 0,
                right: 0,
                height: '200px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 20px'
            }}>
                {waveBars.map((bar, i) => {
                    // Audio-reactive height
                    const audioMultiplier = i < 10 ? bass : i < 25 ? mids : highs
                    const height = bar.baseHeight * (1 + audioMultiplier * 2)

                    return (
                        <div
                            key={bar.id}
                            style={{
                                width: '6px',
                                height: `${Math.min(180, height)}px`,
                                background: `linear-gradient(0deg, ${colors.primary}, ${colors.secondary})`,
                                borderRadius: '3px',
                                opacity: isPlaying ? 0.8 : 0.4,
                                transform: `scaleY(${0.5 + Math.sin(Date.now() * 0.003 + i * 0.2) * 0.3})`,
                                transformOrigin: 'bottom',
                                transition: 'height 0.15s ease-out, opacity 0.3s ease',
                                animation: isPlaying ? `wave 1.5s ease-in-out ${bar.delay}s infinite` : 'none',
                                boxShadow: `0 0 10px ${colors.primary}50`
                            }}
                        />
                    )
                })}
            </div>

            {/* Floating orbs */}
            {orbs.map(orb => (
                <div
                    key={orb.id}
                    style={{
                        position: 'absolute',
                        left: `${orb.x}%`,
                        top: `${orb.y}%`,
                        width: `${orb.size}px`,
                        height: `${orb.size}px`,
                        borderRadius: '50%',
                        background: orb.id % 2 === 0
                            ? `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`
                            : `radial-gradient(circle, ${colors.secondary}40 0%, transparent 70%)`,
                        animation: `orbFloat ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
                        filter: 'blur(2px)',
                        transform: `scale(${1 + bass * 0.3})`
                    }}
                />
            ))}

            {/* Horizontal line glow */}
            <div style={{
                position: 'absolute',
                bottom: '18%',
                left: '10%',
                right: '10%',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${colors.primary}60, ${colors.secondary}60, transparent)`,
                boxShadow: `0 0 20px ${colors.primary}40`,
                opacity: isPlaying ? 1 : 0.4
            }} />

            <style>{`
                @keyframes wave {
                    0%, 100% { 
                        transform: scaleY(0.6); 
                    }
                    50% { 
                        transform: scaleY(1); 
                    }
                }
                @keyframes orbFloat {
                    0%, 100% { 
                        transform: translateY(0) scale(1); 
                    }
                    50% { 
                        transform: translateY(-30px) scale(1.1); 
                    }
                }
            `}</style>
        </div>
    )
}
