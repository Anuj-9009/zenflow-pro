import { useEffect, useRef, useState } from 'react'
import { djEngine } from '../audio/DJEngine'

export const useHandGestures = () => {
    const [enabled, setEnabled] = useState(false)
    const [gestureState, setGestureState] = useState<'Play' | 'Pause' | 'None'>('None')

    const workerRef = useRef<Worker | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const loopRef = useRef<number>()
    const lastGestureTime = useRef(0)

    useEffect(() => {
        if (!enabled) {
            stopLoop()
            return
        }

        // Init Worker
        workerRef.current = new Worker(new URL('../workers/handTracking.worker.ts', import.meta.url), { type: 'module' })

        workerRef.current.onmessage = (e) => {
            if (e.data.type === 'gesture') {
                const { isFist } = e.data.data
                handleGesture(isFist)
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
            const imageData = ctx.getImageData(0, 0, 320, 240)
            // Send to worker
            // We can't send ImageData directly efficiently without Transferable, but for hackathon simple postMessage is ok
            // Or better, ImageBitmap.
            createImageBitmap(videoRef.current).then(bmp => {
                workerRef.current?.postMessage({ image: bmp, width: 320, height: 240 }, [bmp])
            })
        }

        // Throttle to 10fps to save CPU
        setTimeout(() => {
            loopRef.current = requestAnimationFrame(loop)
        }, 100)
    }

    const handleGesture = (isFist: boolean) => {
        const now = Date.now()
        if (now - lastGestureTime.current < 1500) return // Cooldown 1.5s to prevent accidental triggers

        // Logic: Fist = Play, Open (Not Fist) = Pause? 
        // Or Toggle? 
        // Prompt: "Open Palm (Pause) and Fist (Play)"

        if (isFist) {
            console.log("Gesture: FIST -> PLAY")
            djEngine.play('A') // Default Deck A for simple control
            setGestureState('Play')
            lastGestureTime.current = now
        } else {
            // Open Palm
            // Need to be careful not to trigger on random noise. 
            // Ideally we check confidence or sustain.
            // For now, simple Mapping.
            console.log("Gesture: PALM -> PAUSE")
            djEngine.pause('A')
            setGestureState('Pause')
            lastGestureTime.current = now
        }
    }

    // Hidden Video/Canvas elements for the DOM
    // Hooks can't return JSX easily unless they are components or we use a Portal. 
    // We'll return refs and let consumer render them hidden.
    return { enabled, setEnabled, gestureState, videoRef, canvasRef }
}
