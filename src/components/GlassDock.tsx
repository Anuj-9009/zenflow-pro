// Glass Dock - Enhanced with Smooth Animations
// Premium controls with micro-interactions

import { useState } from 'react'
import { useStore } from '../store/useStore'

const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
)

const PauseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
)

const PrevIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <polygon points="19 20 9 12 19 4 19 20" />
        <rect x="5" y="4" width="3" height="16" rx="1" />
    </svg>
)

const NextIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <polygon points="5 4 15 12 5 20 5 4" />
        <rect x="16" y="4" width="3" height="16" rx="1" />
    </svg>
)

export default function GlassDock() {
    const { isPlaying, playPause, next, previous, colors } = useStore()
    const [hoveredButton, setHoveredButton] = useState<string | null>(null)
    const [pressedButton, setPressedButton] = useState<string | null>(null)

    const getButtonStyle = (id: string, isMain = false): React.CSSProperties => ({
        background: isMain
            ? `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`
            : hoveredButton === id
                ? 'rgba(255, 255, 255, 0.12)'
                : 'transparent',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: isMain ? 56 : 44,
        height: isMain ? 56 : 44,
        borderRadius: '50%',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        transform: pressedButton === id
            ? 'scale(0.92)'
            : hoveredButton === id
                ? 'scale(1.08)'
                : 'scale(1)',
        boxShadow: isMain && isPlaying
            ? `0 0 24px ${colors.primary}50, inset 0 0 12px ${colors.primary}20`
            : hoveredButton === id
                ? `0 4px 16px rgba(0, 0, 0, 0.3)`
                : 'none'
    })

    const handleClick = (action: () => void, id: string) => {
        setPressedButton(id)
        action()
        setTimeout(() => setPressedButton(null), 150)
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 24px',
            borderRadius: 60,
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            animation: 'dockSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {/* Prev */}
            <button
                onClick={() => handleClick(previous, 'prev')}
                onMouseEnter={() => setHoveredButton('prev')}
                onMouseLeave={() => setHoveredButton(null)}
                style={getButtonStyle('prev')}
            >
                <PrevIcon />
            </button>

            {/* Play/Pause */}
            <button
                onClick={() => handleClick(playPause, 'play')}
                onMouseEnter={() => setHoveredButton('play')}
                onMouseLeave={() => setHoveredButton(null)}
                style={getButtonStyle('play', true)}
            >
                <div style={{
                    transition: 'transform 0.2s ease',
                    transform: pressedButton === 'play' ? 'scale(0.9)' : 'scale(1)'
                }}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </div>
            </button>

            {/* Next */}
            <button
                onClick={() => handleClick(next, 'next')}
                onMouseEnter={() => setHoveredButton('next')}
                onMouseLeave={() => setHoveredButton(null)}
                style={getButtonStyle('next')}
            >
                <NextIcon />
            </button>

            <style>{`
                @keyframes dockSlideUp {
                    0% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(20px); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0); 
                    }
                }
            `}</style>
        </div>
    )
}
