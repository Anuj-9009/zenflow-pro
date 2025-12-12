// Now Playing Toast - Shows when track changes
import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store/useStore'

export default function NowPlayingToast() {
    const { track, isInitialized, colors } = useStore()
    const [isVisible, setIsVisible] = useState(false)
    const [displayTrack, setDisplayTrack] = useState(track)
    const previousTrack = useRef(track.name)
    const timeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (!isInitialized) return

        // Check if track changed
        if (track.name && track.name !== previousTrack.current && track.name !== 'No Track Playing') {
            previousTrack.current = track.name
            setDisplayTrack(track)
            setIsVisible(true)

            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Hide after 4 seconds
            timeoutRef.current = window.setTimeout(() => {
                setIsVisible(false)
            }, 4000)
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [track.name, isInitialized])

    if (!isInitialized) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: '24px',
                left: '50%',
                transform: `translate(-50%, ${isVisible ? '0' : '-120px'})`,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 20px 12px 12px',
                background: 'rgba(20, 20, 30, 0.95)',
                backdropFilter: 'blur(40px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 500,
                maxWidth: '400px'
            }}
        >
            {/* Album Art */}
            {displayTrack.artUrl && (
                <img
                    src={displayTrack.artUrl}
                    alt="Album Art"
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        boxShadow: `0 4px 20px ${colors.primary}40`
                    }}
                />
            )}

            {/* Track Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px'
                }}>
                    Now Playing
                </div>
                <div style={{
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '2px'
                }}>
                    {displayTrack.name}
                </div>
                <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {displayTrack.artist}
                </div>
            </div>

            {/* Animated bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
                {[0.6, 1, 0.4, 0.8, 0.5].map((height, i) => (
                    <div
                        key={i}
                        style={{
                            width: '3px',
                            height: isVisible ? `${height * 100}%` : '20%',
                            background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary})`,
                            borderRadius: '2px',
                            transition: `height 0.3s ease ${i * 0.1}s`,
                            animation: isVisible ? `pulse 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none'
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { height: 30%; }
                    100% { height: 100%; }
                }
            `}</style>
        </div>
    )
}
