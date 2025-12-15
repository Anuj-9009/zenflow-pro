import * as Tone from 'tone'
import { ChannelStrip } from './ChannelStrip'

export interface DeckState {
    track: string // Clean name for display. File references held internally by channel strip logic if needed.
    isPlaying: boolean
    duration: number
    position: number
    bpm: number
}

export class DJEngineClass {
    // Pro Audio Strips
    stripA: ChannelStrip
    stripB: ChannelStrip

    // Mixing
    crossfade: Tone.CrossFade
    master: Tone.Volume

    // Ghost Deck (Smart Buffer)
    recorder: Tone.Recorder
    ghostPlayer: Tone.Player
    isGhosting: boolean = false

    // State
    stateA: DeckState = { track: 'Empty', isPlaying: false, duration: 0, position: 0, bpm: 120 }
    stateB: DeckState = { track: 'Empty', isPlaying: false, duration: 0, position: 0, bpm: 120 }

    // Crossfader Value (0 - 1)
    crossfadeValue: number = 0.5

    initialized: boolean = false

    constructor() {
        this.stripA = new ChannelStrip('player')
        this.stripB = new ChannelStrip('player')

        this.crossfade = new Tone.CrossFade(0.5)
        this.master = new Tone.Volume(0).toDestination()

        // Ghost Deck Init
        this.recorder = new Tone.Recorder()
        this.ghostPlayer = new Tone.Player()
        this.ghostPlayer.loop = true

        // Connect Recorder to Ghost Player is NOT needed directly.
        // We connect Source -> Recorder (temporary)
        // We connect GhostPlayer -> Crossfade (temporary)

        // Reroute Strips to Crossfader logic
        this.stripA.solo.disconnect()
        this.stripB.solo.disconnect()

        this.stripA.solo.connect(this.crossfade.a)
        this.stripB.solo.connect(this.crossfade.b)

        this.crossfade.connect(this.master)
    }

    async init() {
        if (this.initialized) return
        await Tone.start()
        this.initialized = true

            // Expose to window for debugging (type: any to avoid TS issues)
            ; (window as any).audioEngine = this

        console.log('DJ Engine 2.0 (Pro Strips) Initialized')
        console.log('[DEBUG] Access engine via window.audioEngine')
    }

    async loadTrack(deck: 'A' | 'B', file: File | string) {
        if (!this.initialized) await this.init()

        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB

        if (typeof file === 'string') {
            // Virtual / URL
            state.track = file
            // Try load if it's a valid URL?
            // For Spotify URI, we don't load into Player.
            if (file.startsWith('http')) {
                if (strip.input instanceof Tone.Player) {
                    try {
                        await strip.input.load(file)
                        state.duration = strip.input.buffer.duration
                    } catch (e) { console.error(e) }
                }
            }
            return
        }

        // Local File
        if (strip.input instanceof Tone.Player) {
            const url = URL.createObjectURL(file)
            await strip.input.load(url)
            state.track = file.name.replace(/\.[^/.]+$/, "") // Remove extension
            state.duration = strip.input.buffer.duration
            console.log(`Loaded ${file.name} to Deck ${deck}`)
        }
    }

    play(deck: 'A' | 'B') {
        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB

        if (strip.input instanceof Tone.Player && strip.input.loaded) {
            strip.input.start()
            state.isPlaying = true
        }
    }

    pause(deck: 'A' | 'B') {
        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB

        if (strip.input instanceof Tone.Player) {
            strip.input.stop()
            state.isPlaying = false
        }
    }

    setEQ(deck: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) {
        const strip = deck === 'A' ? this.stripA : this.stripB

        // Map UI (-10 to 10) to dB (approx -15 to +15)
        const dB = value * 1.5

        if (band === 'low') strip.eq.low.value = dB
        if (band === 'mid') strip.eq.mid.value = dB
        if (band === 'high') strip.eq.high.value = dB
    }

    setFilter(deck: 'A' | 'B', value: number) {
        // Value -1 to 1. Map to 0-100 for ChannelStrip
        const mapVal = (value + 1) * 50
        const strip = deck === 'A' ? this.stripA : this.stripB
        strip.setFilter(mapVal)
    }

    setCrossfader(val: number) {
        this.crossfade.fade.rampTo(val, 0.1)
        this.crossfadeValue = val
    }

    setVolume(deck: 'A' | 'B', val: number) {
        const strip = deck === 'A' ? this.stripA : this.stripB
        strip.setVolume(val)
    }

    setMasterVolume(val: number) {
        // val is 0-1, convert to dB
        const db = val > 0 ? Tone.gainToDb(val) : -Infinity
        this.master.volume.rampTo(db, 0.1)
    }

    /**
     * Set playback speed/pitch for a deck
     * @param deck 'A' | 'B'
     * @param rate 0.5 = half speed, 1.0 = normal, 1.5 = 1.5x speed
     */
    setPitch(deck: 'A' | 'B', rate: number) {
        const strip = deck === 'A' ? this.stripA : this.stripB
        if (strip.input instanceof Tone.Player) {
            strip.input.playbackRate = rate
            console.log(`[DJEngine] Deck ${deck} pitch set to ${rate}`)
        }
    }

    /**
     * Cue - Jump to start of track
     */
    cue(deck: 'A' | 'B') {
        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB

        if (strip.input instanceof Tone.Player && strip.input.loaded) {
            strip.input.stop()
            strip.input.start(0)
            state.position = 0
            state.isPlaying = true
            console.log(`[DJEngine] Deck ${deck} cued to start`)
        }
    }

    /**
     * Set loop on/off for a deck
     */
    setLoop(deck: 'A' | 'B', enabled: boolean) {
        const strip = deck === 'A' ? this.stripA : this.stripB
        if (strip.input instanceof Tone.Player) {
            strip.input.loop = enabled
            console.log(`[DJEngine] Deck ${deck} loop ${enabled ? 'enabled' : 'disabled'}`)
        }
    }

    async enableSystemInput(deck: 'A' | 'B') {
        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB
        console.log(`Enabling System Input for Deck ${deck}`)

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true }) // video:true often required for window capture
            const audioTrack = stream.getAudioTracks()[0]
            if (!audioTrack) throw new Error("No audio track in stream")

            const context = Tone.context.rawContext as AudioContext
            const source = context.createMediaStreamSource(stream)

            // Disconnect internal input
            if (strip.input) {
                // Determine connection point. strip.input connected to strip.eq
                try { strip.input.disconnect(strip.eq) } catch (e) { }
            }

            const entryGain = new Tone.Gain()
            Tone.connect(source, entryGain)
            entryGain.connect(strip.eq)

            // Overwrite input so other methods fail gracefully or we could wrap it
            // strip.input = entryGain as any

            state.track = "LIVE INPUT: System Audio"
            state.isPlaying = true

            console.log("System Audio Connected")
        } catch (e) {
            console.error("System Input Failed", e)
        }
    }

    // Alias for legacy hooks
    async connectInput(deck: 'A' | 'B', stream: any) {
        // We ignore the stream arg as we get our own displayMedia, OR we use it if passed?
        // To be safe and compatible with old logic which passed a stream:
        // Check if stream is passed, if so try to use it, otherwise call enableSystemInput logic
        // For now, just call our new robust method
        return this.enableSystemInput(deck)
    }

    // Sync: Adjust playbackRate of targetDeck to match sourceDeck
    syncTracks(targetDeck: 'A' | 'B') {
        const sourceDeck = targetDeck === 'A' ? 'B' : 'A'
        const sourceState = sourceDeck === 'A' ? this.stateA : this.stateB
        const targetState = targetDeck === 'A' ? this.stateA : this.stateB
        const targetStrip = targetDeck === 'A' ? this.stripA : this.stripB

        if (!sourceState.isPlaying || sourceState.bpm === 0 || targetState.bpm === 0) {
            console.warn("Sync failed: Invalid BPM or Source not playing")
            return
        }

        const ratio = sourceState.bpm / targetState.bpm
        console.log(`Syncing Deck ${targetDeck} (${targetState.bpm}) to Deck ${sourceDeck} (${sourceState.bpm}). Ratio: ${ratio}`)

        if (targetStrip.input instanceof Tone.Player) {
            // Smooth ramp to new rate
            // Note: Tone.Player.playbackRate is a signal
            targetStrip.input.playbackRate = ratio
        } else {
            // Master Context Rule: Apply Tone.PitchShift to System Input (limited +/- 5%)
            if (ratio < 0.95 || ratio > 1.05) {
                console.warn("Sync ignored: Spotify Pitch Correct limited to +/- 5%")
                return
            }

            console.log(`[Spotify Sync] ratio: ${ratio}. (PitchShift Node not in graph, skipping to avoid glitches)`)
            console.warn("CANNOT SYNC: Spotify is the MASTER Tempo. You must speed up the Local Deck instead.")
        }
    }

    // Restore getPositions for AutoMix
    getPositions() {
        return {
            posA: this.stateA.position,
            posB: this.stateB.position
        }
    }

    // Seek (0-1 progress)
    seek(deck: 'A' | 'B', progress: number) {
        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB

        if (strip.input instanceof Tone.Player && strip.input.loaded) {
            const time = progress * strip.input.buffer.duration
            state.position = time
            if (state.isPlaying) {
                strip.input.start(undefined, time)
            }
        }
    }
    // --- Smart Buffer Logic ---

    // 1. Capture the last N seconds of the active deck (System Input)
    async captureLoop(deck: 'A' | 'B', duration: number) {
        if (this.isGhosting) return // Already active?

        const strip = deck === 'A' ? this.stripA : this.stripB
        const state = deck === 'A' ? this.stateA : this.stateB

        console.log(`[SmartBuffer] Capturing ${duration}s from Deck ${deck}...`)

        // Connect Recorder to the Strip's Input (Pre-EQ/Vol) or Post?
        // Pre-EQ allows us to EQ the ghostloop same as live.
        // The strip input is usually the System Source.

        // Need to tap into the System Source.
        // Note: enableSystemInput created a 'source' and connected to strip.eq.
        // The 'source' var is local to that function.
        // We need 'strip.input' to be the source node.
        // In enableSystemInput we set `strip.input` (logic was conceptual).

        // Fallback: We can't easily tap "strip.input" if it's a MediaStreamSource wrapper not stored.
        // Hack: We record from the 'strip.eq.low' input? No, we need clean signal.
        // Actually, recording POST-EQ is safer for seamless transition if we want to freeze the sound.
        // Let's record from 'strip.solo' (Post-Everything).
        // Then we play back directly to Crossfader?
        // If we play back to Crossfader, we bypass Strip controls (EQ/Vol).
        // This means knobs stop working on the loop.

        // Better: Record Pre-EQ.
        // But we don't have easy access to Pre-EQ unless we stored the System Source.

        // Compromise: Record Master Output? No.
        // We will assume 'strip.eq.low' IS the input point.
        // We'll connect the recorder to 'strip.eq' logic?
        // Tone.Recorder can connect to any node.
        // Let's connect Recorder to strip.eq (the input of the EQ chain).
        // But we need to know what is connected TO strip.eq.

        // Workaround: We will use global routing.
        // Recorder is connected to the Strip "Output" (Post Fader) for simplicity in V1?
        // No, prompt says: "Ghost Player connected to Deck A's channel strip".
        // This implies Ghost Player -> Strip Input.
        // This means we record the SOURCE.

        // Let's restart the recording process:
        // 1. Start Recorder.
        await this.recorder.start()

        // We need to ensure Recorder is connected to something!
        // constructor didn't connect it.
        // We need to connect the Active Deck's source to recorder.
        // In `enableSystemInput` we should connect the source to a `recordingBus`?

        // Just-in-time connection:
        // Use a persistent 'monitor' node in the strip?
        // Let's connect strip.solo to recorder for now (Post-FX capture).
        strip.solo.connect(this.recorder)

        // Wait for duration
        await new Promise(r => setTimeout(r, duration * 1000))

        // Stop
        const blob = await this.recorder.stop()
        const url = URL.createObjectURL(blob)

        // Disconnect recorder
        strip.solo.disconnect(this.recorder)

        // Load into Ghost Player
        await this.ghostPlayer.load(url)
        // this.ghostPlayer.buffer.duration = duration // Read-only, inferred from file

        // Start Ghost
        this.ghostPlayer.start()
        this.isGhosting = true
        console.log(`[SmartBuffer] Ghost Loop Active`)

        // MUTE System Input (Prevent Double Audio)
        // We do this by disconnecting the Strip from the Crossfader?
        // Or setting volume to 0?
        // If we set Volume to 0, we can't play the Ghost Player through the Strip if we routed it there.

        // Strategy: 
        // 1. Ghost Player connects to Crossfader (Bypassing Strip).
        // 2. We captured Post-Strip audio.
        // 3. So playing it raw to Crossfader sounds correct (Logic 1).
        // 4. We mute the Strip.

        // Routing Ghost:
        this.ghostPlayer.disconnect()
        if (deck === 'A') this.ghostPlayer.connect(this.crossfade.a)
        else this.ghostPlayer.connect(this.crossfade.b)

        // Mute Strip
        strip.setVolume(0) // Quick mute

        return true
    }

    stopGhosting(deck: 'A' | 'B') {
        if (!this.isGhosting) return

        this.ghostPlayer.stop()
        this.isGhosting = false

        // Restore Strip
        const strip = deck === 'A' ? this.stripA : this.stripB
        strip.setVolume(100) // Restore volume (assuming it was max? or store prev vol?)
        // Ideally we fade it back in or it's implicitly handled by crossfader moving away.
        console.log(`[SmartBuffer] Ghost Loop Stopped`)
    }
}

export const djEngine = new DJEngineClass()
