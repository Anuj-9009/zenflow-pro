// Waveform Component - Real-time Audio Visualization
// Renders audio buffer as a colored waveform with interactive playhead

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { djEngine } from '../audio/DJEngine'

interface WaveformProps {
    deckId: 'A' | 'B'
    color?: string
    accentColor?: string
    height?: number
}

export const Waveform: React.FC<WaveformProps> = ({
    deckId,
    color = '#3b82f6',
    accentColor = '#60a5fa',
    height = 80
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const waveformDataRef = useRef<number[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Get deck strip
    const strip = deckId === 'A' ? djEngine.stripA : djEngine.stripB
    const state = deckId === 'A' ? djEngine.stateA : djEngine.stateB

    // Generate waveform data from audio buffer
    const generateWaveformData = useCallback((samples: Float32Array, targetLength: number): number[] => {
        const blockSize = Math.floor(samples.length / targetLength)
        const peaks: number[] = []

        for (let i = 0; i < targetLength; i++) {
            let sum = 0
            const start = i * blockSize
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(samples[start + j] || 0)
            }
            peaks.push(sum / blockSize)
        }

        // Normalize
        const max = Math.max(...peaks) || 1
        return peaks.map(p => p / max)
    }, [])

    // Draw the waveform once when track loads
    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const h = canvas.height
        const mid = h / 2

        // Clear
        ctx.clearRect(0, 0, width, h)

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
        bgGrad.addColorStop(0, 'rgba(0,0,0,0.3)')
        bgGrad.addColorStop(0.5, 'rgba(0,0,0,0.1)')
        bgGrad.addColorStop(1, 'rgba(0,0,0,0.3)')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, width, h)

        // Draw center line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, mid)
        ctx.lineTo(width, mid)
        ctx.stroke()

        // If no data, show placeholder
        if (waveformDataRef.current.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.1)'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Drop a track to see waveform', width / 2, mid)
            return
        }

        // Draw waveform bars
        const barWidth = width / waveformDataRef.current.length
        const data = waveformDataRef.current

        data.forEach((peak, i) => {
            const barHeight = peak * (h * 0.8)
            const x = i * barWidth

            // Gradient color based on intensity
            const intensity = peak
            const r = Math.floor(59 + intensity * 196) // Blue to cyan
            const g = Math.floor(130 + intensity * 125)
            const b = Math.floor(246 - intensity * 100)

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

            // Top half (mirrored)
            ctx.fillRect(x, mid - barHeight / 2, barWidth - 1, barHeight / 2)
            // Bottom half
            ctx.fillRect(x, mid, barWidth - 1, barHeight / 2)
        })
    }, [])

    // Draw playhead on RAF loop
    useEffect(() => {
        if (!isLoaded) return

        let animationId: number
        const canvas = canvasRef.current
        if (!canvas) return

        const playheadCanvas = document.createElement('canvas')
        playheadCanvas.width = canvas.width
        playheadCanvas.height = canvas.height

        const loop = () => {
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                animationId = requestAnimationFrame(loop)
                return
            }

            // Redraw base waveform
            drawWaveform()

            // Get current progress
            const duration = state.duration
            const position = state.position
            const progress = duration > 0 ? position / duration : 0

            // Draw playhead
            const x = progress * canvas.width
            ctx.fillStyle = 'rgba(255,255,255,0.8)'
            ctx.fillRect(x - 1, 0, 2, canvas.height)

            // Played region overlay
            ctx.fillStyle = 'rgba(255,255,255,0.1)'
            ctx.fillRect(0, 0, x, canvas.height)

            animationId = requestAnimationFrame(loop)
        }

        animationId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(animationId)
    }, [isLoaded, drawWaveform, state])

    // Load waveform when track changes
    useEffect(() => {
        const checkForBuffer = () => {
            try {
                // Try to get buffer from Tone.Player
                const player = strip.input
                if (player && 'buffer' in player && player.buffer && player.buffer.length > 0) {
                    const samples = player.buffer.getChannelData(0)
                    const canvas = canvasRef.current
                    if (canvas) {
                        waveformDataRef.current = generateWaveformData(samples, canvas.width / 2)
                        setIsLoaded(true)
                        drawWaveform()
                    }
                }
            } catch (e) {
                // Buffer not ready yet
            }
        }

        // Check periodically for buffer
        const interval = setInterval(checkForBuffer, 500)
        checkForBuffer()

        return () => clearInterval(interval)
    }, [state.track, strip, generateWaveformData, drawWaveform])

    // Handle resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resizeObserver = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth * 2 // Retina
            canvas.height = height * 2
            if (isLoaded) {
                // Regenerate waveform data for new width
                try {
                    const player = strip.input
                    if (player && 'buffer' in player && player.buffer) {
                        const samples = player.buffer.getChannelData(0)
                        waveformDataRef.current = generateWaveformData(samples, canvas.width / 2)
                    }
                } catch (e) { }
                drawWaveform()
            }
        })

        resizeObserver.observe(canvas)
        return () => resizeObserver.disconnect()
    }, [height, isLoaded, strip, generateWaveformData, drawWaveform])

    // Click to seek
    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas || state.duration <= 0) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const progress = x / rect.width

        djEngine.seek(deckId, progress)
    }, [deckId, state.duration])

    return (
        <canvas
            ref={canvasRef}
            onClick={handleClick}
            className="w-full cursor-pointer rounded-lg"
            style={{ height: `${height}px` }}
        />
    )
}

export default React.memo(Waveform)
