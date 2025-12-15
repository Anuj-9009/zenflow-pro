import { useState } from 'react'
import { djEngine } from '../audio/DJEngine'
import { SpotifyBridge } from '../services/SpotifyBridge'
import * as Tone from 'tone'

export interface SpotifyDeckState {
    track: any | null
    status: 'EMPTY' | 'CUED' | 'PLAYING'
    bpm: number
    key: number
}

export const useSpotifyDeck = (deckId: 'A' | 'B') => {
    const [deckState, setDeckState] = useState<SpotifyDeckState>({
        track: null,
        status: 'EMPTY',
        bpm: 0,
        key: 0
    })

    // 1. The "Staging" Workflow
    const stageTrack = async (spotifyTrackRaw: any) => {
        // Set basic info immediately
        setDeckState(prev => ({
            ...prev,
            track: spotifyTrackRaw,
            status: 'CUED'
        }))

        // Fetch Deep Metadata (BPM/Key)
        // Extract ID from URI (spotify:track:ID)
        const id = spotifyTrackRaw.uri.split(':')[2]
        if (id) {
            try {
                const features = await SpotifyBridge.getAudioFeatures(id)
                if (features) {
                    setDeckState(prev => ({
                        ...prev,
                        bpm: Math.round(features.tempo),
                        key: features.key // Integrity check: pitch class integer
                    }))
                    console.log(`[Deck ${deckId}] Staged: ${spotifyTrackRaw.name} (${Math.round(features.tempo)} BPM)`)
                }
            } catch (e) {
                console.warn("Failed to fetch audio features", e)
            }
        }
    }

    // 2. The "Latency Masking" Play (The "Safety Net")
    const triggerDrop = async () => {
        // 1. Lock the Deck
        // Status 'CUED' is already set, maybe we add a 'LOADING' state?
        // sticking to 'CUED' visually for now, but internal log
        console.log(`[Deck ${deckId}] Drop Triggered. Engaging Safety Net...`)

        // 2. OPTIONAL: Trigger "Stutter/Wash" mechanism on *other* deck here.
        // djEngine.applyWash(otherDeck, true) 

        // 3. Send the Command
        await SpotifyBridge.skipToNext()

        // 4. LISTEN for Audio (The "Safety Net")
        const silenceThreshold = -40 // dB
        const strip = deckId === 'A' ? djEngine.stripA : djEngine.stripB

        const checker = setInterval(() => {
            const val = strip.meter.getValue()
            const level = typeof val === 'number' ? val : val[0] // Handle Stereo

            if (level > silenceThreshold) {
                clearInterval(checker)

                // 5. NOW it's safe to start visualizer / cut effects
                console.log(`[Deck ${deckId}] Spotify Drop Confirmed! (Signal: ${level.toFixed(1)}dB)`)
                setDeckState(prev => ({ ...prev, status: 'PLAYING' }))

                // djEngine.applyWash(otherDeck, false)
            }
        }, 50) // Check every 50ms
    }

    return {
        deckState,
        stageTrack,
        triggerDrop
    }
}
