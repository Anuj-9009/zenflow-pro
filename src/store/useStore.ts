// Zustand Store - with Real Media Integration
// Handles audio analysis and real Spotify/Apple Music control

import { create } from 'zustand'

interface TrackInfo {
    name: string
    artist: string
    album: string
    artUrl: string | null
    duration: number
    position: number
}

interface AudioState {
    // Initialization
    isInitialized: boolean
    isPlaying: boolean

    // Audio Analysis (from microphone)
    bass: number
    mids: number
    highs: number
    volume: number

    // Colors
    colors: {
        primary: string
        secondary: string
        background: string
    }

    // Progress (0-1)
    progress: number

    // Track Info (real from Spotify/Apple Music)
    track: TrackInfo

    // Internals
    audioContext: AudioContext | null
    analyser: AnalyserNode | null
    metadataInterval: number | null

    // Actions
    init: () => Promise<void>
    playPause: () => Promise<void>
    next: () => Promise<void>
    previous: () => Promise<void>
    setColors: (primary: string, secondary: string, background: string) => void
    fetchMetadata: () => Promise<void>
    _updateAudio: () => void
}

// Check if running in Electron with detailed logging
const checkElectron = () => {
    const hasWindow = typeof window !== 'undefined'
    const hasElectron = hasWindow && !!(window as any).electron
    const hasMedia = hasElectron && !!(window as any).electron?.media
    console.log('Electron check:', { hasWindow, hasElectron, hasMedia, electronObj: (window as any).electron })
    return hasMedia
}

const isElectron = checkElectron()

export const useStore = create<AudioState>((set, get) => ({
    isInitialized: false,
    isPlaying: false,

    bass: 0.3,
    mids: 0.2,
    highs: 0.1,
    volume: 0.2,

    colors: {
        primary: '#4facfe',
        secondary: '#00f2fe',
        background: '#050510'
    },

    progress: 0,

    track: {
        name: 'No Track Playing',
        artist: 'Open Spotify or Apple Music',
        album: '',
        artUrl: null,
        duration: 0,
        position: 0
    },

    audioContext: null,
    analyser: null,
    metadataInterval: null,

    // Initialize audio and start metadata polling
    init: async () => {
        if (get().isInitialized) return

        try {
            // Initialize audio context for visualization
            const audioContext = new AudioContext()
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            analyser.smoothingTimeConstant = 0.8

            // Try microphone for audio visualization
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                })
                const source = audioContext.createMediaStreamSource(stream)
                source.connect(analyser)
                console.log('Audio initialized with microphone')
            } catch (err) {
                console.warn('Microphone denied, using idle animation')
            }

            set({ audioContext, analyser, isInitialized: true })

            // Start audio analysis loop
            const audioLoop = () => {
                get()._updateAudio()
                requestAnimationFrame(audioLoop)
            }
            audioLoop()

            // Start metadata polling (every 500ms)
            const metadataInterval = window.setInterval(() => {
                get().fetchMetadata()
            }, 500)

            set({ metadataInterval })

            // Initial metadata fetch
            await get().fetchMetadata()

        } catch (err) {
            console.error('Init error:', err)
            set({ isInitialized: true })
        }
    },

    // Fetch real metadata from Spotify/Apple Music
    fetchMetadata: async () => {
        if (!isElectron) {
            // Idle animation for non-Electron
            const time = Date.now() * 0.001
            set({
                bass: 0.3 + Math.sin(time * 0.5) * 0.2,
                mids: 0.2 + Math.sin(time * 0.7) * 0.15,
                highs: 0.15 + Math.sin(time * 1.1) * 0.1
            })
            return
        }

        try {
            const metadata = await window.electron.media.getMetadata()
            console.log('Metadata received:', metadata)

            if (metadata) {
                const progress = metadata.duration > 0
                    ? metadata.position / metadata.duration
                    : 0

                set({
                    track: {
                        name: metadata.name,
                        artist: metadata.artist,
                        album: metadata.album,
                        artUrl: metadata.artUrl,
                        duration: metadata.duration,
                        position: metadata.position
                    },
                    isPlaying: metadata.isPlaying,
                    progress: Math.min(1, Math.max(0, progress))
                })
            }
        } catch (err) {
            console.error('Metadata fetch error:', err)
        }
    },

    // Real playPause
    playPause: async () => {
        if (isElectron) {
            await window.electron.media.playPause()
            // Update immediately
            setTimeout(() => get().fetchMetadata(), 100)
        } else {
            set(s => ({ isPlaying: !s.isPlaying }))
        }
    },

    // Real next
    next: async () => {
        if (isElectron) {
            await window.electron.media.next()
            setTimeout(() => get().fetchMetadata(), 100)
        }
    },

    // Real previous
    previous: async () => {
        if (isElectron) {
            await window.electron.media.previous()
            setTimeout(() => get().fetchMetadata(), 100)
        }
    },

    setColors: (primary, secondary, background) => set({
        colors: { primary, secondary, background }
    }),

    // Audio analysis
    _updateAudio: () => {
        const { analyser } = get()
        if (!analyser) {
            // Idle animation
            const time = Date.now() * 0.001
            set({
                bass: 0.3 + Math.sin(time * 0.5) * 0.2,
                mids: 0.2 + Math.sin(time * 0.7) * 0.15,
                highs: 0.15 + Math.sin(time * 1.1) * 0.1,
                volume: 0.25
            })
            return
        }

        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)

        const bassEnd = Math.floor(data.length * 0.1)
        const midsEnd = Math.floor(data.length * 0.4)

        let bassSum = 0, midsSum = 0, highsSum = 0

        for (let i = 0; i < data.length; i++) {
            if (i < bassEnd) bassSum += data[i]
            else if (i < midsEnd) midsSum += data[i]
            else highsSum += data[i]
        }

        const bass = Math.min(1, bassSum / bassEnd / 255 * 1.5)
        const mids = Math.min(1, midsSum / (midsEnd - bassEnd) / 255 * 1.3)
        const highs = Math.min(1, highsSum / (data.length - midsEnd) / 255 * 1.2)
        const volume = (bass + mids + highs) / 3

        set({ bass, mids, highs, volume })
    }
}))
