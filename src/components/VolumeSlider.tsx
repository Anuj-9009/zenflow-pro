// Volume Slider Component - ZenFlow v2.0 (Fully Functional)
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export default function VolumeSlider() {
    const { colors } = useStore()
    const [volume, setVolume] = useState(50)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [previousVolume, setPreviousVolume] = useState(50)
    const isInitialized = useRef(false)

    // Get initial system volume on mount
    useEffect(() => {
        const getInitialVolume = async () => {
            if (window.electron?.media?.getVolume) {
                try {
                    const systemVolume = await window.electron.media.getVolume()
                    setVolume(systemVolume)
                    setPreviousVolume(systemVolume)
                    setIsMuted(systemVolume === 0)
                    isInitialized.current = true
                } catch (e) {
                    console.log('Could not get system volume:', e)
                }
            }
        }
        getInitialVolume()
    }, [])

    const handleVolumeChange = async (newVolume: number) => {
        setVolume(newVolume)
        setIsMuted(newVolume === 0)

        // Apply volume change via Electron
        if (window.electron?.media?.setVolume) {
            try {
                await window.electron.media.setVolume(newVolume)
            } catch (e) {
                console.log('Volume control error:', e)
            }
        }
    }

    const toggleMute = async () => {
        if (isMuted || volume === 0) {
            // Unmute - restore previous volume
            const restoreVolume = previousVolume > 0 ? previousVolume : 50
            await handleVolumeChange(restoreVolume)
            setIsMuted(false)
        } else {
            // Mute - save current volume and set to 0
            setPreviousVolume(volume)
            await handleVolumeChange(0)
            setIsMuted(true)
        }
    }

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
        )
        if (volume < 35) return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            </svg>
        )
        if (volume < 70) return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
        )
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
        )
    }

    const isExpanded = isHovered || isDragging

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isExpanded
                    ? `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)`
                    : 'none',
                transform: isExpanded ? 'scale(1.02)' : 'scale(1)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => !isDragging && setIsHovered(false)}
        >
            {/* Volume Icon */}
            <button
                onClick={toggleMute}
                style={{
                    background: 'none',
                    border: 'none',
                    color: isMuted ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                {getVolumeIcon()}
            </button>

            {/* Slider Container */}
            <div
                style={{
                    width: isExpanded ? '100px' : '0px',
                    overflow: 'hidden',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                }}
            >
                <div style={{
                    position: 'relative',
                    width: '100px',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    borderRadius: '3px',
                    overflow: 'visible'
                }}>
                    {/* Filled portion */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${volume}%`,
                        background: isMuted
                            ? 'rgba(255, 255, 255, 0.3)'
                            : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                        borderRadius: '3px',
                        transition: isDragging ? 'none' : 'width 0.15s ease-out',
                        boxShadow: isMuted ? 'none' : `0 0 10px ${colors.primary}50`
                    }} />

                    {/* Knob */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${volume}%`,
                        transform: 'translate(-50%, -50%)',
                        width: isExpanded ? '14px' : '0px',
                        height: isExpanded ? '14px' : '0px',
                        background: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.2s ease',
                        cursor: 'grab'
                    }} />
                </div>

                {/* Hidden range input for interaction */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    style={{
                        position: 'absolute',
                        top: '-7px',
                        left: 0,
                        width: '100px',
                        height: '20px',
                        opacity: 0,
                        cursor: 'pointer'
                    }}
                />
            </div>

            {/* Volume Percentage */}
            <div
                style={{
                    width: isExpanded ? '32px' : '0px',
                    overflow: 'hidden',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'right'
                }}
            >
                <span style={{
                    color: isMuted ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '11px',
                    fontFamily: 'SF Mono, Monaco, monospace',
                    fontWeight: 600,
                    letterSpacing: '-0.5px'
                }}>
                    {isMuted ? 'OFF' : `${volume}%`}
                </span>
            </div>
        </div>
    )
}
