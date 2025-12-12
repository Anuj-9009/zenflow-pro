// ZenFlow Pro - AI Visualizer Enhanced
// Immersive flowing light effects inspired by Klanglicht - organic nebula/aurora style

import { useMemo, useRef, useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

export default function AIVisualizer() {
    const bass = useStore(state => state.bass)
    const mids = useStore(state => state.mids)
    const highs = useStore(state => state.highs)
    const colors = useStore(state => state.colors)
    const isPlaying = useStore(state => state.isPlaying)
    const [time, setTime] = useState(0)

    // Animation loop for fluid motion
    useEffect(() => {
        let animationId: number
        const animate = () => {
            setTime(t => t + 0.016)
            animationId = requestAnimationFrame(animate)
        }
        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [])

    // Generate subtle stars
    const stars = useMemo(() => {
        return Array.from({ length: 80 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.5,
            twinkleDelay: Math.random() * 5
        }))
    }, [])

    // Audio-reactive values with smoothing
    const intensity = isPlaying ? 1 : 0.3
    const nebulaScale = 1 + bass * 0.2
    const nebulaRotation = time * 10 + mids * 30

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: `linear-gradient(180deg, #0a0a15 0%, #050510 50%, #0a0512 100%)`,
            overflow: 'hidden',
            pointerEvents: 'none'
        }}>
            {/* Deep space gradient base */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse 120% 80% at 50% 50%, 
                    ${colors.primary}08 0%, 
                    transparent 50%),
                    radial-gradient(ellipse 80% 120% at 30% 70%, 
                    ${colors.secondary}06 0%, 
                    transparent 40%)`
            }} />

            {/* Main Nebula Cloud 1 - Large organic blob */}
            <div style={{
                position: 'absolute',
                top: '30%',
                left: '40%',
                width: '600px',
                height: '500px',
                transform: `translate(-50%, -50%) scale(${nebulaScale}) rotate(${nebulaRotation}deg)`,
                background: `radial-gradient(ellipse 100% 80% at 50% 50%, 
                    ${colors.primary}${Math.round(25 * intensity).toString(16).padStart(2, '0')} 0%, 
                    ${colors.primary}${Math.round(15 * intensity).toString(16).padStart(2, '0')} 30%,
                    transparent 70%)`,
                filter: 'blur(80px)',
                transition: 'transform 0.5s ease-out',
                animation: isPlaying ? 'nebulaDrift1 20s ease-in-out infinite' : 'none'
            }} />

            {/* Main Nebula Cloud 2 - Secondary organic blob */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '60%',
                width: '500px',
                height: '600px',
                transform: `translate(-50%, -50%) scale(${1 + mids * 0.15}) rotate(${-nebulaRotation * 0.7}deg)`,
                background: `radial-gradient(ellipse 70% 100% at 50% 50%, 
                    ${colors.secondary}${Math.round(20 * intensity).toString(16).padStart(2, '0')} 0%, 
                    ${colors.secondary}${Math.round(10 * intensity).toString(16).padStart(2, '0')} 40%,
                    transparent 70%)`,
                filter: 'blur(100px)',
                transition: 'transform 0.6s ease-out',
                animation: isPlaying ? 'nebulaDrift2 25s ease-in-out infinite' : 'none'
            }} />

            {/* Bright Core Glow */}
            <div style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                width: '300px',
                height: '300px',
                transform: `translate(-50%, -50%) scale(${1 + bass * 0.3})`,
                background: `radial-gradient(circle, 
                    rgba(255,255,255,${0.15 * intensity}) 0%, 
                    ${colors.primary}${Math.round(30 * intensity).toString(16).padStart(2, '0')} 20%,
                    transparent 60%)`,
                filter: 'blur(40px)',
                transition: 'transform 0.2s ease-out'
            }} />

            {/* Flowing light tendrils */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '45%',
                width: '400px',
                height: '200px',
                transform: `translate(-50%, -50%) rotate(${30 + Math.sin(time) * 10}deg) scaleX(${1 + highs * 0.3})`,
                background: `linear-gradient(90deg, 
                    transparent 0%, 
                    ${colors.primary}${Math.round(25 * intensity).toString(16).padStart(2, '0')} 30%, 
                    ${colors.secondary}${Math.round(20 * intensity).toString(16).padStart(2, '0')} 70%, 
                    transparent 100%)`,
                filter: 'blur(50px)',
                borderRadius: '50%',
                transition: 'transform 0.3s ease-out'
            }} />

            {/* Secondary flowing tendril */}
            <div style={{
                position: 'absolute',
                top: '55%',
                left: '55%',
                width: '350px',
                height: '180px',
                transform: `translate(-50%, -50%) rotate(${-45 + Math.cos(time * 0.8) * 15}deg) scaleX(${1 + mids * 0.25})`,
                background: `linear-gradient(90deg, 
                    transparent 0%, 
                    ${colors.secondary}${Math.round(20 * intensity).toString(16).padStart(2, '0')} 30%, 
                    ${colors.primary}${Math.round(15 * intensity).toString(16).padStart(2, '0')} 70%, 
                    transparent 100%)`,
                filter: 'blur(60px)',
                borderRadius: '50%',
                transition: 'transform 0.35s ease-out'
            }} />

            {/* Subtle stars */}
            {stars.map(star => (
                <div
                    key={star.id}
                    style={{
                        position: 'absolute',
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        borderRadius: '50%',
                        background: 'white',
                        opacity: star.opacity * intensity,
                        animation: isPlaying ? `twinkle 3s ease-in-out ${star.twinkleDelay}s infinite` : 'none',
                        transition: 'opacity 0.5s ease'
                    }}
                />
            ))}

            {/* Very subtle light rays */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '2px',
                transform: `translate(-50%, -50%) rotate(${25}deg)`,
                background: `linear-gradient(90deg, transparent, ${colors.primary}15, transparent)`,
                filter: 'blur(20px)',
                opacity: intensity
            }} />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '2px',
                transform: `translate(-50%, -50%) rotate(${-35}deg)`,
                background: `linear-gradient(90deg, transparent, ${colors.secondary}12, transparent)`,
                filter: 'blur(25px)',
                opacity: intensity
            }} />

            {/* Vignette for depth */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)'
            }} />

            {/* CSS Animations */}
            <style>{`
                @keyframes nebulaDrift1 {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        left: 40%;
                        top: 30%;
                    }
                    25% {
                        left: 45%;
                        top: 35%;
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.1) rotate(10deg);
                        left: 42%;
                        top: 40%;
                    }
                    75% {
                        left: 38%;
                        top: 32%;
                    }
                }
                @keyframes nebulaDrift2 {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        left: 60%;
                        top: 50%;
                    }
                    33% {
                        left: 55%;
                        top: 55%;
                    }
                    66% { 
                        transform: translate(-50%, -50%) scale(1.15) rotate(-15deg);
                        left: 62%;
                        top: 48%;
                    }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.3); }
                }
            `}</style>
        </div>
    )
}
