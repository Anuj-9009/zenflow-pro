// Start Screen - Audio unlock + welcome
// Required due to browser autoplay policies

import { useStore } from '../store/useStore'

export default function StartScreen() {
    const { isInitialized, init } = useStore()

    if (isInitialized) return null

    const handleStart = async () => {
        await init()
    }

    return (
        <div
            onClick={handleStart}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5, 5, 16, 0.95)',
                backdropFilter: 'blur(20px)',
                cursor: 'pointer'
            }}
        >
            {/* Logo */}
            <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.3) 0%, rgba(0, 242, 254, 0.3) 100%)',
                border: '2px solid rgba(79, 172, 254, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                boxShadow: '0 0 60px rgba(79, 172, 254, 0.3)',
                animation: 'pulse 2s ease-in-out infinite'
            }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4facfe" />
                            <stop offset="100%" stopColor="#00f2fe" />
                        </linearGradient>
                    </defs>
                    <polygon points="5 3 19 12 5 21 5 3" fill="url(#gradient)" stroke="none" />
                </svg>
            </div>

            {/* Title */}
            <h1 style={{
                fontSize: 42,
                fontWeight: 300,
                letterSpacing: 12,
                marginBottom: 12,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase'
            }}>
                ZenFlow
            </h1>

            {/* Subtitle */}
            <p style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: 3,
                marginBottom: 48,
                textTransform: 'uppercase'
            }}>
                Audio Visualizer
            </p>

            {/* Start Button */}
            <div style={{
                padding: '16px 48px',
                borderRadius: 50,
                border: '1px solid rgba(79, 172, 254, 0.5)',
                background: 'rgba(79, 172, 254, 0.1)',
                color: '#4facfe',
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 3,
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
            }}>
                Tap to Start
            </div>

            {/* Hint */}
            <p style={{
                position: 'absolute',
                bottom: 40,
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.3)',
                textAlign: 'center',
                maxWidth: 300,
                lineHeight: 1.8
            }}>
                Allow microphone access to visualize system audio.<br />
                Play music from Spotify, YouTube, or any app.
            </p>

            {/* Keyframes */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
        </div>
    )
}
