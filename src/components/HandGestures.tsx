// Hand Gestures - Improved Detection with Better Reliability
// Recognizes: Open Palm (pause), Closed Fist (play), Swipe (prev/next), Hand Up/Down (volume)

import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { useStore } from '../store/useStore'

interface Props {
    enabled?: boolean
    debug?: boolean
}

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electron?.media

export default function HandGestures({ enabled = true, debug = false }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [gesture, setGesture] = useState<string>('')
    const [gestureIcon, setGestureIcon] = useState<string>('')
    const [isTracking, setIsTracking] = useState(false)
    const [showGuide, setShowGuide] = useState(true)

    // Gesture tracking refs
    const lastGestureTime = useRef(0)
    const handPositions = useRef<{ x: number; y: number; time: number }[]>([])
    const gestureTimeoutRef = useRef<number | null>(null)
    const lastOpenFingers = useRef(0)
    const stableFingerCount = useRef(0)
    const fingerStabilityFrames = useRef(0)

    const { isPlaying, playPause, next, previous } = useStore()
    const { colors } = useStore()

    // Auto-hide guide after 10 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowGuide(false), 10000)
        return () => clearTimeout(timer)
    }, [])

    // Show gesture feedback with auto-clear
    const showGestureFeedback = useCallback((text: string, icon: string) => {
        setGesture(text)
        setGestureIcon(icon)

        if (gestureTimeoutRef.current) {
            clearTimeout(gestureTimeoutRef.current)
        }
        gestureTimeoutRef.current = window.setTimeout(() => {
            setGesture('')
            setGestureIcon('')
        }, 1200)
    }, [])

    useEffect(() => {
        if (!enabled || !videoRef.current) return

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.75,
            minTrackingConfidence: 0.65
        })

        hands.onResults((results: Results) => {
            processResults(results)
        })

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await hands.send({ image: videoRef.current })
                }
            },
            width: 320,
            height: 240
        })

        camera.start()

        return () => {
            camera.stop()
            hands.close()
            if (gestureTimeoutRef.current) {
                clearTimeout(gestureTimeoutRef.current)
            }
        }
    }, [enabled])

    const processResults = (results: Results) => {
        const now = Date.now()

        // Draw debug view
        if (debug && canvasRef.current && results.image) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
                ctx.save()
                ctx.clearRect(0, 0, 320, 240)
                // Mirror the video
                ctx.scale(-1, 1)
                ctx.drawImage(results.image, -320, 0, 320, 240)
                ctx.restore()

                if (results.multiHandLandmarks?.[0]) {
                    const landmarks = results.multiHandLandmarks[0]

                    // Draw skeleton
                    ctx.strokeStyle = colors.primary
                    ctx.lineWidth = 2
                    const connections = [
                        [0, 1], [1, 2], [2, 3], [3, 4],
                        [0, 5], [5, 6], [6, 7], [7, 8],
                        [5, 9], [9, 10], [10, 11], [11, 12],
                        [9, 13], [13, 14], [14, 15], [15, 16],
                        [13, 17], [17, 18], [18, 19], [19, 20],
                        [0, 17]
                    ]

                    connections.forEach(([a, b]) => {
                        const lmA = landmarks[a]
                        const lmB = landmarks[b]
                        ctx.beginPath()
                        ctx.moveTo((1 - lmA.x) * 320, lmA.y * 240)
                        ctx.lineTo((1 - lmB.x) * 320, lmB.y * 240)
                        ctx.stroke()
                    })

                    // Draw landmarks
                    landmarks.forEach((lm, i) => {
                        ctx.fillStyle = [4, 8, 12, 16, 20].includes(i) ? colors.secondary : 'white'
                        ctx.beginPath()
                        ctx.arc((1 - lm.x) * 320, lm.y * 240, [4, 8, 12, 16, 20].includes(i) ? 6 : 4, 0, Math.PI * 2)
                        ctx.fill()
                    })
                }
            }
        }

        if (!results.multiHandLandmarks?.[0]) {
            handPositions.current = []
            setIsTracking(false)
            fingerStabilityFrames.current = 0
            return
        }

        setIsTracking(true)
        const landmarks = results.multiHandLandmarks[0]

        // Use wrist position for movement tracking
        const wristX = landmarks[0].x
        const wristY = landmarks[0].y

        // Store position history (last 8 frames)
        handPositions.current.push({ x: wristX, y: wristY, time: now })
        if (handPositions.current.length > 8) {
            handPositions.current.shift()
        }

        // Calculate movement deltas over last few frames
        const positions = handPositions.current
        if (positions.length >= 4) {
            const oldPos = positions[0]
            const newPos = positions[positions.length - 1]
            const deltaX = newPos.x - oldPos.x
            const deltaY = newPos.y - oldPos.y
            const timeDelta = newPos.time - oldPos.time

            // Horizontal swipe detection (more lenient)
            if (Math.abs(deltaX) > 0.12 && timeDelta < 400 && now - lastGestureTime.current > 800) {
                if (deltaX > 0) {
                    // Hand moved right in camera = swipe left = previous
                    showGestureFeedback('Previous', '⏮️')
                    previous()
                    lastGestureTime.current = now
                    handPositions.current = []
                } else {
                    // Hand moved left in camera = swipe right = next
                    showGestureFeedback('Next', '⏭️')
                    next()
                    lastGestureTime.current = now
                    handPositions.current = []
                }
            }

            // Vertical movement for volume (more lenient)
            if (Math.abs(deltaY) > 0.10 && timeDelta < 400 && now - lastGestureTime.current > 600 && isElectron) {
                if (deltaY < -0.10) {
                    // Hand moved up
                    showGestureFeedback('Volume Up', '🔊')
                        ; (window as any).electron.media.volumeUp()
                    lastGestureTime.current = now
                    handPositions.current = []
                } else if (deltaY > 0.10) {
                    // Hand moved down
                    showGestureFeedback('Volume Down', '🔉')
                        ; (window as any).electron.media.volumeDown()
                    lastGestureTime.current = now
                    handPositions.current = []
                }
            }
        }

        // Count open fingers (improved detection)
        const fingerTips = [8, 12, 16, 20] // Index, Middle, Ring, Pinky tips
        const fingerPIPs = [6, 10, 14, 18] // Second joints

        let openFingers = 0
        fingerTips.forEach((tip, i) => {
            // Finger is open if tip is above PIP joint
            if (landmarks[tip].y < landmarks[fingerPIPs[i]].y - 0.02) {
                openFingers++
            }
        })

        // Check thumb separately (compare x position)
        const thumbOpen = Math.abs(landmarks[4].x - landmarks[2].x) > 0.05
        if (thumbOpen) openFingers++

        // Stabilize finger count (wait for consistent reading)
        if (openFingers === lastOpenFingers.current) {
            fingerStabilityFrames.current++
        } else {
            fingerStabilityFrames.current = 0
            lastOpenFingers.current = openFingers
        }

        // Only trigger gesture after stable reading (5 frames ~100ms)
        if (fingerStabilityFrames.current >= 5 && now - lastGestureTime.current > 1200) {
            if (openFingers >= 4 && isPlaying) {
                showGestureFeedback('Pause', '⏸️')
                playPause()
                lastGestureTime.current = now
                fingerStabilityFrames.current = 0
            } else if (openFingers <= 1 && !isPlaying) {
                showGestureFeedback('Play', '▶️')
                playPause()
                lastGestureTime.current = now
                fingerStabilityFrames.current = 0
            }
        }
    }

    return (
        <>
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
                muted
            />

            {/* Large Gesture Feedback Popup */}
            {gesture && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '32px 48px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(30px)',
                    borderRadius: '24px',
                    border: `2px solid ${colors.primary}40`,
                    zIndex: 600,
                    animation: 'gesturePopup 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${colors.primary}30`
                }}>
                    <span style={{ fontSize: '56px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                        {gestureIcon}
                    </span>
                    <span style={{
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        {gesture}
                    </span>
                </div>
            )}

            {/* Debug Camera View */}
            {debug && (
                <div style={{
                    position: 'fixed',
                    bottom: 120,
                    right: 20,
                    zIndex: 1000,
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    border: `2px solid ${isTracking ? colors.primary : 'rgba(255,255,255,0.2)'}`,
                    transition: 'border-color 0.3s ease'
                }}>
                    <canvas ref={canvasRef} width={320} height={240} style={{ display: 'block' }} />
                    <div style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isTracking ? '#4ade80' : '#ef4444',
                            boxShadow: isTracking ? '0 0 10px #4ade80' : 'none',
                            animation: isTracking ? 'pulse 1s infinite' : 'none'
                        }} />
                        <span style={{
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 500
                        }}>
                            {isTracking ? 'Hand Detected' : 'No Hand'}
                        </span>
                    </div>
                </div>
            )}

            {/* Compact Gesture Guide */}
            {enabled && showGuide && !debug && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        left: '20px',
                        zIndex: 50,
                        padding: '16px 20px',
                        borderRadius: '16px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '12px',
                        animation: 'slideIn 0.5s ease-out',
                        cursor: 'pointer',
                        maxWidth: '200px'
                    }}
                    onClick={() => setShowGuide(false)}
                    title="Click to dismiss"
                >
                    <div style={{
                        fontWeight: 600,
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: colors.primary,
                        fontSize: '13px'
                    }}>
                        <span>👋</span> Hand Gestures
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.85 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>✋ Open Palm</span>
                            <span style={{ opacity: 0.6 }}>Pause</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>✊ Fist</span>
                            <span style={{ opacity: 0.6 }}>Play</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>👈👉 Swipe</span>
                            <span style={{ opacity: 0.6 }}>Skip</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>☝️👇 Up/Down</span>
                            <span style={{ opacity: 0.6 }}>Volume</span>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '10px',
                        fontSize: '10px',
                        opacity: 0.4,
                        textAlign: 'center'
                    }}>
                        Click to dismiss
                    </div>
                </div>
            )}

            <style>{`
                @keyframes gesturePopup {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateX(-20px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    )
}
