// Zustand Store - High Performance & Library Features
// Implements Direct Subscription for 60fps Audio Data
// Zero-latency Lyrics Sync logic
// Persistent History/Library

import { create } from 'zustand'
import { persistence } from '../utils/persistence'
// import { getDatabase, ZenFlowDatabase } from '../db'

// --- Interfaces ---

interface TrackInfo {
    id?: string // Added ID
    name: string
    artist: string
    album: string
    artUrl: string | null
    duration: number
    position: number
    path?: string // Added Path
}

// Stored History Item
interface HistoryItem {
    id?: string
    name: string
    artist: string
    artUrl: string | null
    timestamp: number
}

interface Playlist {
    name: string
    id: string
}

// Audio Data passed to subscribers (No React State overhead)
export interface AudioData {
    bass: number
    mids: number
    highs: number
    volume: number
    waveform: Uint8Array
}

type AudioCallback = (data: AudioData) => void

interface AudioState {
    // Initialization
    isInitialized: boolean
    isPlaying: boolean

    // Quick Fix for legacy components
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

    // Visualizer Mode
    visualizerMode: 'aurora' | 'particles' | 'waves' | 'minimal'

    // Playback State
    track: TrackInfo
    progress: number
    lastPlaybackUpdate: number

    // Library
    history: HistoryItem[]
    playlists: Playlist[]
    db: any | null // ZenFlowDatabase | null

    // Local DSP Player
    isLocalMode: boolean
    playbackSpeed: number
    reverbAmount: number

    // Store Internals
    audioContext: AudioContext | null
    analyser: AnalyserNode | null

    // Local DSP Nodes
    sourceNode: AudioBufferSourceNode | null
    gainNode: GainNode | null
    reverbNode: ConvolverNode | null
    dryNode: GainNode | null
    wetNode: GainNode | null

    // Actions
    init: () => Promise<void>
    playPause: () => Promise<void>
    next: () => Promise<void>
    previous: () => Promise<void>
    volumeUp: () => void
    volumeDown: () => void
    setVolume: (val: number) => void

    // Local DSP Actions
    playLocalFile: (file: File) => Promise<void>
    setPlaybackSpeed: (speed: number) => void
    setReverbAmount: (amount: number) => void

    setColors: (primary: string, secondary: string, background: string) => void
    setVisualizerMode: (mode: 'aurora' | 'particles' | 'waves' | 'minimal') => void

    // Internal Actions
    fetchMetadata: () => Promise<void>

    // High Performance Subscriptions
    subscribeAudio: (callback: AudioCallback) => () => void
    getAudioData: () => AudioData
}

// --- Helpers ---

const checkElectron = () => typeof window !== 'undefined' && !!(window as any).electron?.media
const isElectron = checkElectron()

// Create simple impulse response for reverb
const createReverbImpulse = (ctx: AudioContext, duration: number = 2.0, decay: number = 2.0) => {
    const rate = ctx.sampleRate
    const len = rate * duration
    const impulse = ctx.createBuffer(2, len, rate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)
    for (let i = 0; i < len; i++) {
        const n = i / len
        // Exponential decay
        const val = (Math.random() * 2 - 1) * Math.pow(1 - n, decay)
        left[i] = val
        right[i] = val
    }
    return impulse
}

// --- Store Implementation ---

export const useStore = create<AudioState>((set, get) => {
    const subscribers = new Set<AudioCallback>()
    let animationFrameId: number | null = null

    // Transient audio data
    const audioData: AudioData = {
        bass: 0, mids: 0, highs: 0, volume: 0,
        waveform: new Uint8Array(256)
    }

    const runAudioLoop = () => {
        const { analyser, isPlaying } = get()

        if (analyser) {
            analyser.getByteFrequencyData(audioData.waveform as any)

            const len = audioData.waveform.length
            const bassEnd = Math.floor(len * 0.1)
            const midEnd = Math.floor(len * 0.5)

            let b = 0, m = 0, h = 0
            for (let i = 0; i < len; i++) {
                if (i < bassEnd) b += audioData.waveform[i];
                else if (i < midEnd) m += audioData.waveform[i];
                else h += audioData.waveform[i];
            }

            audioData.bass = (b / bassEnd / 255) * 1.5
            audioData.mids = (m / (midEnd - bassEnd) / 255) * 1.2
            audioData.highs = (h / (len - midEnd) / 255) * 1.0
            audioData.volume = (audioData.bass + audioData.mids + audioData.highs) / 3
        } else {
            // Idle animation
            const t = Date.now() * 0.002
            audioData.bass = 0.3 + Math.sin(t) * 0.1
            audioData.mids = 0.2 + Math.cos(t * 1.3) * 0.1
            audioData.highs = 0.1 + Math.sin(t * 0.7) * 0.05
            audioData.volume = isPlaying ? 0.5 : 0.1
        }

        subscribers.forEach(cb => cb(audioData))
        animationFrameId = requestAnimationFrame(runAudioLoop)
    }

    return {
        isInitialized: false,
        isPlaying: false,
        bass: 0, mids: 0, highs: 0, volume: 0,

        colors: { primary: '#4facfe', secondary: '#00f2fe', background: '#050510' },
        visualizerMode: 'aurora',

        track: { name: 'No Track Playing', artist: 'Open Spotify', album: '', artUrl: null, duration: 0, position: 0 },
        progress: 0,
        lastPlaybackUpdate: Date.now(),

        history: [],
        playlists: [],
        db: null,

        // DSP Init
        isLocalMode: false,
        playbackSpeed: 1.0,
        reverbAmount: 0.0,
        sourceNode: null,
        gainNode: null,
        reverbNode: null,
        dryNode: null,
        wetNode: null,

        audioContext: null,
        analyser: null,

        // --- Initialization ---

        init: async () => {
            if (get().isInitialized) return

            try {
                // Load Settings and History (LocalStorage)
                const settings = persistence.loadSettings()
                if (settings.visualizerMode) {
                    set({ visualizerMode: settings.visualizerMode as any })
                }

                const history = persistence.loadHistory()
                set({ history, db: null })

                // Audio Init
                const audioContext = new AudioContext()
                const analyser = audioContext.createAnalyser()
                analyser.fftSize = 512
                analyser.smoothingTimeConstant = 0.8

                // DSP Setup
                const reverbNode = audioContext.createConvolver()
                reverbNode.buffer = createReverbImpulse(audioContext)

                const dryNode = audioContext.createGain()
                const wetNode = audioContext.createGain()
                wetNode.gain.value = 0

                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                    const source = audioContext.createMediaStreamSource(stream)
                    source.connect(analyser)
                } catch (e) { console.warn('Mic denied') }

                set({
                    audioContext, analyser,
                    reverbNode, dryNode, wetNode,
                    isInitialized: true
                })
                runAudioLoop()

                setInterval(() => get().fetchMetadata(), 500)
                get().fetchMetadata()

                // Fetch Playlists (if available)
                if (isElectron && window.electron.media.getPlaylists) {
                    window.electron.media.getPlaylists().then((playlists: any) => set({ playlists }))
                }

            } catch (e) {
                console.error('Init failed', e)
                set({ isInitialized: true })
            }
        },

        // --- Metadata & Sync ---

        fetchMetadata: async () => {
            if (!isElectron) return

            try {
                const meta = await window.electron.media.getMetadata()
                if (meta) {
                    const current = get()

                    // History Logic: If track changed, add to history
                    if (meta.name !== current.track.name && meta.name && meta.duration > 30) {
                        const newHistory = persistence.addToHistory({
                            id: crypto.randomUUID(),
                            name: meta.name,
                            artist: meta.artist,
                            artUrl: meta.artUrl,
                            timestamp: Date.now()
                        })
                        set({ history: newHistory })
                    }

                    if (meta.name !== current.track.name || meta.isPlaying !== current.isPlaying || Math.abs(meta.position - current.track.position) > 1) {
                        set({
                            track: { ...current.track, ...meta },
                            isPlaying: meta.isPlaying,
                            progress: meta.duration > 0 ? meta.position / meta.duration : 0,
                            lastPlaybackUpdate: Date.now()
                        })
                    } else {
                        set({
                            progress: meta.duration > 0 ? meta.position / meta.duration : 0,
                            track: { ...current.track, position: meta.position },
                            lastPlaybackUpdate: Date.now()
                        })
                    }
                }
            } catch { }
        },

        // --- Playback Actions ---

        playPause: async () => {
            if (isElectron) {
                await window.electron.media.playPause()
                setTimeout(() => get().fetchMetadata(), 50)
            } else {
                set(s => ({ isPlaying: !s.isPlaying }))
            }
        },
        next: async () => {
            if (isElectron) await window.electron.media.next()
            setTimeout(() => get().fetchMetadata(), 100)
        },
        previous: async () => {
            if (isElectron) await window.electron.media.previous()
            setTimeout(() => get().fetchMetadata(), 100)
        },
        volumeUp: () => isElectron && window.electron.media.setVolume(Math.min(100, (audioData.volume * 100 || 50) + 10)),
        volumeDown: () => isElectron && window.electron.media.setVolume(Math.max(0, (audioData.volume * 100 || 50) - 10)),
        setVolume: (v) => {
            set({ volume: v })
            if (isElectron) window.electron.media.setVolume(v * 100)
            const { gainNode } = get()
            if (gainNode) gainNode.gain.value = v
        },

        // --- Local DSP Actions ---

        playLocalFile: async (file: File) => {
            const { audioContext, sourceNode, analyser, reverbNode, dryNode, wetNode, playbackSpeed } = get()
            if (!audioContext || !analyser) return

            // Resume context
            if (audioContext.state === 'suspended') await audioContext.resume()

            // Stop previous
            if (sourceNode) {
                try { sourceNode.stop() } catch { }
                sourceNode.disconnect()
            }

            // Decode
            try {
                const arrayBuffer = await file.arrayBuffer()
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

                const source = audioContext.createBufferSource()
                source.buffer = audioBuffer
                source.playbackRate.value = playbackSpeed

                // Graph: 
                // Source -> DryNode -> Analyser -> Destination
                // Source -> ReverbNode -> WetNode -> Analyser -> Destination

                if (dryNode && wetNode && reverbNode) {
                    source.connect(dryNode)
                    dryNode.connect(analyser)
                    analyser.connect(audioContext.destination)

                    source.connect(reverbNode)
                    reverbNode.connect(wetNode)
                    wetNode.connect(analyser)
                    // Note: dry/wet gains are set by default or setReverbAmount
                } else {
                    source.connect(analyser)
                    analyser.connect(audioContext.destination)
                }

                source.start(0)

                const cleanName = file.name.split('.').slice(0, -1).join('.')
                const id = crypto.randomUUID()

                // Save to DB
                // Save to History
                const newHistory = persistence.addToHistory({
                    id,
                    name: cleanName,
                    artist: 'Local File',
                    artUrl: null,
                    timestamp: Date.now()
                })
                set({ history: newHistory })

                set({
                    isLocalMode: true,
                    sourceNode: source,
                    isPlaying: true,
                    track: {
                        id,
                        name: cleanName,
                        artist: 'Local File',
                        album: 'Drag & Drop',
                        artUrl: null,
                        duration: audioBuffer.duration,
                        position: 0,
                        path: file.path
                    }
                })

                // Start position tracker
                const startTime = audioContext.currentTime
                const tracker = setInterval(() => {
                    const { isPlaying, isLocalMode, sourceNode, playbackSpeed } = get()
                    if (!isPlaying || !isLocalMode || !sourceNode) {
                        clearInterval(tracker)
                        return
                    }
                    const pos = (audioContext.currentTime - startTime) * playbackSpeed
                    if (pos > audioBuffer.duration) {
                        // Loop or stop? Let's just stop/pause at end
                        set({ isPlaying: false })
                        clearInterval(tracker)
                    } else {
                        set({
                            progress: pos / audioBuffer.duration,
                            track: { ...get().track, position: pos },
                            lastPlaybackUpdate: Date.now()
                        })
                    }
                }, 100)
            } catch (err) {
                console.error('File play error', err)
            }
        },

        setPlaybackSpeed: (speed) => {
            const { sourceNode } = get()
            if (sourceNode) sourceNode.playbackRate.value = speed
            set({ playbackSpeed: speed })
        },

        setReverbAmount: (amount) => {
            const { dryNode, wetNode } = get()
            if (dryNode && wetNode) {
                // Crossfade
                dryNode.gain.setValueAtTime(1.0 - (amount * 0.4), 0)
                wetNode.gain.setValueAtTime(amount * 1.5, 0)
            }
            set({ reverbAmount: amount })
        },

        // --- Settings ---

        setColors: (p, s, b) => {
            const colors = { primary: p, secondary: s, background: b }
            set({ colors })
        },
        setVisualizerMode: async (mode) => {
            set({ visualizerMode: mode })
            persistence.saveSettings({ visualizerMode: mode })
        },

        // --- Subscription ---

        subscribeAudio: (callback: AudioCallback) => {
            subscribers.add(callback)
            return () => subscribers.delete(callback)
        },

        getAudioData: () => audioData
    }
})
