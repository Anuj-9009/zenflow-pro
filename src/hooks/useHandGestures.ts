import { useEffect, useRef, useState } from 'react'
import { djEngine } from '../audio/DJEngine'

// Persistence threshold - gesture must be detected for N consecutive frames
const GESTURE_PERSISTENCE_THRESHOLD = 5

export const useHandGestures = () => {
    const [enabled, setEnabled] = useState(false)
    const [gestureState, setGestureState] = useState<'Play' | 'Pause' | 'None'>('None')

    const workerRef = useRef<Worker | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const loopRef = useRef<number>()
    const lastGestureTime = useRef(0)

    // Persistence buffer - tracks consecutive frame detections
    const fistFrameCount = useRef(0)
    const palmFrameCount = useRef(0)
    const lastDetectedGesture = useRef<'fist' | 'palm' | 'none'>('none')

    useEffect(() => {
        if (!enabled) {
            stopLoop()
            // Reset counters when disabled
            fistFrameCount.current = 0
            palmFrameCount.current = 0
            return
        }

        // Init Worker
        workerRef.current = new Worker(new URL('../workers/handTracking.worker.ts', import.meta.url), { type: 'module' })

        workerRef.current.onmessage = (e) => {
            if (e.data.type === 'gesture') {
                const { isFist, confidence } = e.data.data
                // Only process if confidence is high enough
                if (confidence === undefined || confidence > 0.7) {
                    handleGestureFrame(isFist)
                }
            }
        }

        startCamera()

        return () => {
            stopLoop()
            workerRef.current?.terminate()
        }
    }, [enabled])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
                loop()
            }
        } catch (e) {
            console.error("Camera Error", e)
        }
    }

    const stopLoop = () => {
        if (loopRef.current) cancelAnimationFrame(loopRef.current)
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        }
    }

    const loop = () => {
        if (!videoRef.current || !canvasRef.current || !workerRef.current) return

        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 320, 240)
            createImageBitmap(videoRef.current).then(bmp => {
                workerRef.current?.postMessage({ image: bmp, width: 320, height: 240 }, [bmp])
            })
        }

        // Throttle to 10fps to save CPU
        setTimeout(() => {
            loopRef.current = requestAnimationFrame(loop)
        }, 100)
    }

    // Handle each frame detection - accumulates persistence buffer
    const handleGestureFrame = (isFist: boolean) => {
        if (isFist) {
            fistFrameCount.current++
            palmFrameCount.current = 0 // Reset opposite counter

            // Trigger action only after persistence threshold met
            if (fistFrameCount.current === GESTURE_PERSISTENCE_THRESHOLD) {
                triggerGestureAction('fist')
            }
        } else {
            palmFrameCount.current++
            fistFrameCount.current = 0 // Reset opposite counter

            if (palmFrameCount.current === GESTURE_PERSISTENCE_THRESHOLD) {
                triggerGestureAction('palm')
            }
        }
    }

    // Actually trigger the action after persistence confirmed
    const triggerGestureAction = (gesture: 'fist' | 'palm') => {
        const now = Date.now()
        if (now - lastGestureTime.current < 1500) return // Cooldown 1.5s

        // Don't re-trigger same gesture
        if (gesture === lastDetectedGesture.current) return

        lastDetectedGesture.current = gesture
        lastGestureTime.current = now

        if (gesture === 'fist') {
            console.log("Gesture: FIST -> PLAY (Confirmed after 5 frames)")
            djEngine.play('A')
            setGestureState('Play')
        } else {
            console.log("Gesture: PALM -> PAUSE (Confirmed after 5 frames)")
            djEngine.pause('A')
            setGestureState('Pause')
        }
    }

    return { enabled, setEnabled, gestureState, videoRef, canvasRef }
}
