import React, { useEffect, useRef, useState } from 'react'
// import { Camera } from '@mediapipe/camera_utils'
import { useStore } from '../store/useStore'

export const GestureController = () => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const workerRef = useRef<Worker | null>(null)
    const { playPause, next, previous, setVolume, volume } = useStore()

    const [status, setStatus] = useState<'Init' | 'Active' | 'Error'>('Init')
    const [cursor, setCursor] = useState<{ x: number, y: number } | null>(null)
    const [gesture, setGesture] = useState<string>('None')

    // Debounce/Logic State
    const lastAction = useRef<number>(0)
    const lastX = useRef<number>(0)
    const lastFrame = useRef<number>(0)

    useEffect(() => {
        // Initialize Worker
        workerRef.current = new Worker(new URL('../workers/handTracking.worker.ts', import.meta.url), {
            type: 'module'
        })

        workerRef.current.onmessage = (e) => {
            const { type, data } = e.data

            if (type === 'gesture') {
                const { index, isFist, wrist } = data

                // 1. Comet Cursor (Lerped)
                // Invert X for mirror effect
                const x = 1.0 - index.x
                const y = index.y

                setCursor({ x, y })

                // 2. Gesture Logic
                const now = Date.now()
                if (now - lastAction.current > 1000) { // 1s cooldown
                    if (isFist) {
                        setGesture('FIST (Play)')
                        playPause()
                        lastAction.current = now
                    }
                }
            }
        }

        // Initialize Camera (Native Way)
        const startCamera = async () => {
            if (!videoRef.current) return

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 }
                })

                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setStatus('Active')

                // Frame Loop
                const loop = async () => {
                    if (!videoRef.current || !workerRef.current) return

                    const now = Date.now()
                    if (now - lastFrame.current > 33) { // ~30 FPS
                        lastFrame.current = now
                        try {
                            const bitmap = await createImageBitmap(videoRef.current)
                            workerRef.current.postMessage({ image: bitmap }, [bitmap])
                        } catch (e) {
                            // Frame skipped
                        }
                    }
                    requestAnimationFrame(loop)
                }
                loop()

            } catch (err) {
                console.error('Camera Error:', err)
                setStatus('Error')
            }
        }

        startCamera()

        return () => {
            workerRef.current?.terminate()
            // Stop tracks
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    if (status === 'Error') return null

    return (
        <>
            {/* Hidden Input Video */}
            <video ref={videoRef} style={{ display: 'none' }} />

            {/* Debug / Feedback UI */}
            <div style={{
                position: 'fixed', bottom: 20, right: 20,
                background: 'rgba(0,0,0,0.5)', padding: '10px',
                borderRadius: '8px', color: '#0f0',
                fontFamily: 'monospace', fontSize: '10px',
                zIndex: 9999, pointerEvents: 'none'
            }}>
                CV: {status} | {gesture}
            </div>

            {/* Debug Red Dot (Atlas Protocol) */}
            {cursor && (
                <div style={{
                    position: 'fixed',
                    left: `${cursor.x * 100}%`,
                    top: `${cursor.y * 100}%`,
                    width: '12px', height: '12px',
                    borderRadius: '50%',
                    background: 'red', // Red Dot
                    boxShadow: '0 0 10px red',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 9999, // Top z-index
                    transition: 'all 0.05s linear'
                }} />
            )}
        </>
    )
}
