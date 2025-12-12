import { useState } from 'react'
import { djEngine } from '../audio/DJEngine'

export const useSystemAudio = () => {
    const [isSharing, setIsSharing] = useState(false)

    const startSystemCapture = async (deck: 'A' | 'B') => {
        try {
            // Screen Capture API (Video + Audio)
            // We request video: { width: 1 } to satisfy the API but minimize resource usage
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 1, height: 1 },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                }
            })

            // Filter for Audio Track
            const audioTrack = stream.getAudioTracks()[0]
            if (!audioTrack) {
                console.warn("User did not share audio. Stopping stream.")
                stream.getTracks().forEach(t => t.stop())
                return
            }

            // Create Audio-Only Stream for Tone.js
            const audioStream = new MediaStream([audioTrack])

            // Route to DJ Engine
            await djEngine.connectInput(deck, audioStream)

            setIsSharing(true)

            // Handling User ending stream via OS UI
            audioTrack.onended = () => {
                setIsSharing(false)
                console.log("System Audio Ended")
            }

        } catch (err) {
            console.error("Failed to capture system audio", err)
            setIsSharing(false)
        }
    }

    return {
        isSharing,
        startSystemCapture
    }
}
