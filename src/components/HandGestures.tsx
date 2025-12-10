// Hand Gestures - MediaPipe hand tracking with Volume Control
// Recognizes: Open Palm (pause), Closed Fist (play), Swipe (prev/next), Pinch Up/Down (volume)

import { useEffect, useRef, useState } from 'react'
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
    const lastGestureTime = useRef(0)
    const lastHandX = useRef<number | null>(null)
    const lastHandY = useRef<number | null>(null)

    const { isPlaying, playPause } = useStore()

    useEffect(() => {
        if (!enabled || !videoRef.current) return

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
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
        }
    }, [enabled])

    const processResults = (results: Results) => {
        const now = Date.now()

        // Draw debug if enabled
        if (debug && canvasRef.current && results.image) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
                ctx.clearRect(0, 0, 320, 240)
                ctx.drawImage(results.image, 0, 0, 320, 240)

                if (results.multiHandLandmarks?.[0]) {
                    ctx.fillStyle = '#4facfe'
                    results.multiHandLandmarks[0].forEach(lm => {
                        ctx.beginPath()
                        ctx.arc(lm.x * 320, lm.y * 240, 4, 0, Math.PI * 2)
                        ctx.fill()
                    })
                }
            }
        }

        if (!results.multiHandLandmarks?.[0]) {
            lastHandX.current = null
            lastHandY.current = null
            return
        }

        const landmarks = results.multiHandLandmarks[0]
        const palmX = landmarks[0].x
        const palmY = landmarks[0].y

        // Detect horizontal swipe (prev/next)
        if (lastHandX.current !== null && now - lastGestureTime.current > 500) {
            const deltaX = palmX - lastHandX.current

            if (Math.abs(deltaX) > 0.15) {
                const direction = deltaX > 0 ? 'left' : 'right'
                setGesture(`Swipe ${direction}`)
                window.dispatchEvent(new CustomEvent('zenflow:swipe', { detail: { direction } }))
                lastGestureTime.current = now
            }
        }

        // Detect vertical swipe (volume up/down)
        if (lastHandY.current !== null && now - lastGestureTime.current > 400) {
            const deltaY = palmY - lastHandY.current

            if (Math.abs(deltaY) > 0.12) {
                if (deltaY < 0 && isElectron) {
                    // Hand moved UP = Volume Up
                    setGesture('Volume Up ↑')
                        ; (window as any).electron.media.volumeUp()
                    lastGestureTime.current = now
                } else if (deltaY > 0 && isElectron) {
                    // Hand moved DOWN = Volume Down
                    setGesture('Volume Down ↓')
                        ; (window as any).electron.media.volumeDown()
                    lastGestureTime.current = now
                }
            }
        }

        lastHandX.current = palmX
        lastHandY.current = palmY

        // Detect open palm vs closed fist
        const fingerTips = [8, 12, 16, 20]
        const fingerMCPs = [5, 9, 13, 17]

        let openFingers = 0
        fingerTips.forEach((tip, i) => {
            if (landmarks[tip].y < landmarks[fingerMCPs[i]].y) {
                openFingers++
            }
        })

        // Gesture recognition with cooldown
        if (now - lastGestureTime.current > 800) {
            if (openFingers >= 3 && isPlaying) {
                setGesture('Pause ✋')
                playPause()
                lastGestureTime.current = now
            } else if (openFingers <= 1 && !isPlaying) {
                setGesture('Play ✊')
                playPause()
                lastGestureTime.current = now
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

            {debug && (
                <div style={{
                    position: 'fixed',
                    bottom: 120,
                    right: 20,
                    zIndex: 1000,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    border: '2px solid rgba(255,255,255,0.2)'
                }}>
                    <canvas ref={canvasRef} width={320} height={240} />
                    {gesture && (
                        <div style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            padding: '6px 12px',
                            borderRadius: 20,
                            background: 'rgba(79, 172, 254, 0.9)',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 600
                        }}>
                            {gesture}
                        </div>
                    )}
                </div>
            )}

            {/* Gesture Guide */}
            {enabled && !debug && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 50,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontSize: 11,
                    opacity: 0.7
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 6, opacity: 0.8 }}>Hand Gestures</div>
                    <div>✋ Open Palm → Pause</div>
                    <div>✊ Closed Fist → Play</div>
                    <div>👋 Swipe → Next/Prev</div>
                    <div>☝️ Hand Up → Volume ↑</div>
                    <div>👇 Hand Down → Volume ↓</div>
                </div>
            )}
        </>
    )
}
