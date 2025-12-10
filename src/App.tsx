// ZenFlow - Main App with Real Media Integration
// Functional app connecting to Spotify/Apple Music

import { useEffect } from 'react'
import AuroraVisualizer from './components/AuroraVisualizer'
import StartScreen from './components/StartScreen'
import GlassDock from './components/GlassDock'
import ProgressBar from './components/ProgressBar'
import AlbumArt from './components/AlbumArt'
import HandGestures from './components/HandGestures'
import { useStore } from './store/useStore'
import { useGestures } from './hooks/useGestures'

// Color palettes based on common album aesthetics
const colorPalettes = [
    { primary: '#4facfe', secondary: '#00f2fe', background: '#050510' },
    { primary: '#f093fb', secondary: '#f5576c', background: '#0a0510' },
    { primary: '#4ade80', secondary: '#22d3ee', background: '#050a10' },
    { primary: '#a78bfa', secondary: '#818cf8', background: '#08051a' },
    { primary: '#fb923c', secondary: '#facc15', background: '#0a0805' },
]

export default function App() {
    const { isInitialized, track, setColors } = useStore()

    // Enable touch gestures (in addition to hand gestures)
    useGestures()

    // Change colors based on track name (simple hash)
    useEffect(() => {
        if (!isInitialized || !track.name) return

        // Simple hash to pick a palette
        let hash = 0
        for (let i = 0; i < track.name.length; i++) {
            hash = ((hash << 5) - hash) + track.name.charCodeAt(i)
            hash = hash & hash
        }
        const paletteIndex = Math.abs(hash) % colorPalettes.length
        const palette = colorPalettes[paletteIndex]

        setColors(palette.primary, palette.secondary, palette.background)
    }, [isInitialized, track.name, setColors])

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            background: '#050510',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none'
        }}>
            {/* Aurora Background */}
            <AuroraVisualizer />

            {/* Album Art with Living Blur */}
            {isInitialized && <AlbumArt imageUrl={track.artUrl || undefined} />}

            {/* Hand Gesture Recognition */}
            {isInitialized && <HandGestures enabled={true} debug={false} />}

            {/* Start Screen */}
            <StartScreen />

            {/* Progress Bar (Apple Music style) */}
            {isInitialized && <ProgressBar />}

            {/* Glass Dock */}
            {isInitialized && <GlassDock />}
        </div>
    )
}
