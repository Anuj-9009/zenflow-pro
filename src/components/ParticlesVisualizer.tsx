// Particles Visualizer - CSS-based for reliability
import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function ParticlesVisualizer() {
    const bass = useStore(state => state.bass)
    const mids = useStore(state => state.mids)
    const colors = useStore(state => state.colors)
    const isPlaying = useStore(state => state.isPlaying)

    // Generate particles
    const particles = useMemo(() => {
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            size: 2 + Math.random() * 6,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 10 + Math.random() * 20,
            opacity: 0.3 + Math.random() * 0.5
        }))
    }, [])

    const pulseScale = 1 + bass * 0.3

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${colors.primary}20 0%, ${colors.background} 70%)`,
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
        }}>
            {/* Central glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '400px',
                height: '400px',
                transform: `translate(-50%, -50%) scale(${pulseScale})`,
                background: `radial-gradient(circle, ${colors.primary}30 0%, transparent 70%)`,
                borderRadius: '50%',
                transition: 'transform 0.15s ease-out',
                filter: 'blur(40px)'
            }} />

            {/* Secondary glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '300px',
                height: '300px',
                transform: `translate(-50%, -50%) scale(${1 + mids * 0.2})`,
                background: `radial-gradient(circle, ${colors.secondary}40 0%, transparent 70%)`,
                borderRadius: '50%',
                transition: 'transform 0.2s ease-out',
                filter: 'blur(30px)'
            }} />

            {/* Floating particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        borderRadius: '50%',
                        background: p.id % 2 === 0 ? colors.primary : colors.secondary,
                        opacity: p.opacity * (isPlaying ? 1 : 0.5),
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? colors.primary : colors.secondary}`,
                        animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                        transition: 'opacity 0.5s ease'
                    }}
                />
            ))}

            {/* Ring pulse */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '200px',
                height: '200px',
                transform: `translate(-50%, -50%) scale(${pulseScale})`,
                border: `2px solid ${colors.primary}40`,
                borderRadius: '50%',
                transition: 'transform 0.15s ease-out'
            }} />

            <style>{`
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0) translateX(0); 
                    }
                    25% { 
                        transform: translateY(-30px) translateX(15px); 
                    }
                    50% { 
                        transform: translateY(-10px) translateX(-10px); 
                    }
                    75% { 
                        transform: translateY(-40px) translateX(5px); 
                    }
                }
            `}</style>
        </div>
    )
}
