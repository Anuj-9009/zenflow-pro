// Glass Dock - Clean Minimal Controls
// Just controls, no duplicate track info

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

    return (
        <div style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            borderRadius: 50,
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 30px ${colors.primary}10`
        }}>
            {/* Prev */}
            <button onClick={previous} style={btnStyle}>
                <PrevIcon />
            </button>

            {/* Play/Pause */}
            <button
                onClick={playPause}
                style={{
                    ...btnStyle,
                    width: 52,
                    height: 52,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`,
                    boxShadow: isPlaying ? `0 0 20px ${colors.primary}40` : 'none',
                    transition: 'box-shadow 0.3s ease'
                }}
            >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Next */}
            <button onClick={next} style={btnStyle}>
                <NextIcon />
            </button>
        </div>
    )
}

const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    transition: 'background 0.2s ease',
    outline: 'none'
}
