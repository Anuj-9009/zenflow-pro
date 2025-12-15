import React, { useEffect, useRef } from 'react'

interface VerticalWaveformProps {
    data: Uint8Array | number[]
    color?: string
    width?: number
    height?: number
    mirrored?: boolean // If true, expands from Right to Left (for Deck B side)
}

export const VerticalWaveform: React.FC<VerticalWaveformProps> = ({
    data,
    color = '#10b981',
    width = 60,
    height = 300,
    mirrored = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear
        ctx.clearRect(0, 0, width, height)

        // Style
        ctx.fillStyle = color
        ctx.lineCap = 'round'

        // Render "Waterfall"
        // We assume 'data' is FFT frequency data (0-255).
        // Vertical rendering means: Frequencies go from Top to Bottom? 
        // Or Time goes from Top to Bottom?
        // Prompt says: "Flow downward like a waterfall."
        // Usually waterfall = Spectrogram (Time on Y, Freq on X).
        // But for a DJ Deck "Waveform", usually it's the full waveform scrolling.
        // "Mirrored" usually implies Deck A vs Deck B symmetry.

        // Let's render a simple Oscilloscope/Waveform that flows?
        // Actually, simple static rendering of current buffer frame is standard for "Visualizer".
        // If we want "Scrolling" we need a history buffer.
        // For this V2, let's make it a high-res rapid scan of the current frame mapped vertically.

        const barHeight = height / data.length

        // We'll draw simple bars for now to represent the energy
        // A: Left Align, B: Right Align (Mirrored)

        for (let i = 0; i < data.length; i++) {
            const val = data[i] // 0-255
            const percent = val / 255
            const barW = percent * width

            const y = i * barHeight

            if (mirrored) {
                // Right aligned (Deck B)
                // x starts at width - barW
                ctx.fillRect(width - barW, y, barW, barHeight + 0.5)
            } else {
                // Left aligned (Deck A)
                ctx.fillRect(0, y, barW, barHeight + 0.5)
            }
        }

    }, [data, color, width, height, mirrored])

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="opacity-80"
        />
    )
}
