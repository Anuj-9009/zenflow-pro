// ZenFlow Pro - Smooth Now Playing
// Larger album art, working controls, smooth animations

import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function ImmersiveNowPlaying() {
    const { track, progress, isPlaying, colors, playPause, next, previous } = useStore()

    const bgGradient = useMemo(() => {
        const hex = colors.primary.replace('#', '')
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        const l1 = `rgb(${Math.min(255, r * 0.25 + 185)}, ${Math.min(255, g * 0.25 + 188)}, ${Math.min(255, b * 0.25 + 192)})`
        const l2 = `rgb(${Math.min(255, r * 0.15 + 210)}, ${Math.min(255, g * 0.15 + 215)}, ${Math.min(255, b * 0.15 + 220)})`
        return `linear-gradient(160deg, ${l1} 0%, ${l2} 100%)`
    }, [colors.primary])

    const formatTime = (sec: number) => {
        if (!sec || isNaN(sec)) return '0:00'
        return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`
    }

    // Control handlers
    const handlePrevious = () => previous()
    const handlePlayPause = () => playPause()
    const handleNext = () => next()

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: bgGradient,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            transition: 'background 1.2s ease'
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: `radial-gradient(circle, ${colors.primary}25 0%, transparent 65%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }} />

            {/* Floating orbs */}
            <style>{`
                @keyframes floatA { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,-30px); } }
                @keyframes floatB { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-25px,20px); } }
                @keyframes floatC { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,25px); } }
            `}</style>
            {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${20 + i * 20}%`,
                    top: `${25 + (i % 2) * 40}%`,
                    width: `${80 + i * 30}px`,
                    height: `${80 + i * 30}px`,
                    borderRadius: '50%',
                    background: `${colors.primary}12`,
                    filter: 'blur(50px)',
                    animation: `float${['A', 'B', 'C'][i % 3]} ${10 + i * 3}s ease-in-out infinite`,
                    pointerEvents: 'none'
                }} />
            ))}

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px'
            }}>
                {/* Large Album Art */}
                <div style={{
                    width: '350px',
                    height: '350px',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: `0 40px 100px rgba(0,0,0,0.18), 0 0 60px ${colors.primary}20`,
                    marginBottom: '40px',
                    transition: 'box-shadow 0.5s ease'
                }}>
                    {track.artUrl ? (
                        <img src={track.artUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '100px'
                        }}>🎵</div>
                    )}
                </div>

                {/* Track Info */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        fontSize: '26px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        marginBottom: '8px'
                    }}>{track.name || 'No Track'}</div>
                    <div style={{ fontSize: '17px', color: '#666' }}>{track.artist || 'Play something'}</div>
                </div>

                {/* Progress */}
                <div style={{ width: '350px', marginBottom: '28px' }}>
                    <div style={{
                        height: '5px',
                        background: 'rgba(0,0,0,0.08)',
                        borderRadius: '3px',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0, top: 0,
                            height: '100%',
                            width: `${progress * 100}%`,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                            borderRadius: '3px',
                            transition: 'width 0.25s linear',
                            boxShadow: `0 0 15px ${colors.primary}50`
                        }} />
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                        fontSize: '13px',
                        color: '#888'
                    }}>
                        <span>{formatTime(track.position)}</span>
                        <span>{formatTime(track.duration)}</span>
                    </div>
                </div>

                {/* Controls - Using onClick directly */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button
                        onClick={handlePrevious}
                        style={{
                            background: 'rgba(0,0,0,0.06)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            fontSize: '26px',
                            cursor: 'pointer',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.1s ease, background 0.1s ease'
                        }}
                    >⏮</button>

                    <button
                        onClick={handlePlayPause}
                        style={{
                            background: '#1a1a1a',
                            border: 'none',
                            borderRadius: '50%',
                            width: '80px',
                            height: '80px',
                            fontSize: '32px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.1s ease',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                    >{isPlaying ? '⏸' : '▶'}</button>

                    <button
                        onClick={handleNext}
                        style={{
                            background: 'rgba(0,0,0,0.06)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            fontSize: '26px',
                            cursor: 'pointer',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.1s ease, background 0.1s ease'
                        }}
                    >⏭</button>
                </div>
            </div>
        </div>
    )
}
