import { useEffect, useState } from 'react'
import { djEngine } from '../audio/DJEngine'

interface MediaTrack {
    source: 'Spotify' | 'Music'
    title: string
    artist: string
    artwork?: string
}

export const useSystemMedia = () => {
    const [currentTrack, setCurrentTrack] = useState<MediaTrack | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    useEffect(() => {
        // Listen for IPC updates from Electron
        const handleUpdate = (data: any) => {
            console.log("Media Update:", data)
            setCurrentTrack(data)
        }

        if (window.electron && window.electron.window) {
            window.electron.window.onMediaUpdate(handleUpdate)
        }

        // Mock for now if no IPC set up in preload yet
        const listener = (e: any) => handleUpdate(e.detail)
        window.addEventListener('media-update-mock', listener)

        return () => window.removeEventListener('media-update-mock', listener)
    }, [])

    const captureSystemAudio = async (deck: 'A' | 'B') => {
        try {
            // Request System Audio (Display Media)
            // 'audio: true' is key. 'video: true' required by API but we ignore it.
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true, // Required to get stream
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            })

            // We only want audio
            const audioTrack = stream.getAudioTracks()[0]
            if (!audioTrack) {
                console.warn("No audio track found in system capture. Make sure to check 'Share Audio'.")
                return
            }

            // Create Audio-Only stream
            const audioStream = new MediaStream([audioTrack])

            await djEngine.connectInput(deck, audioStream)
            setIsCapturing(true)

            // Cleanup video track to save resources
            stream.getVideoTracks().forEach(t => t.stop())

        } catch (e) {
            console.error("System Audio Capture Failed", e)
        }
    }

    // Commands
    const playPauseInfo = () => {
        // IPC call
        // window.electron.invoke('media-control', 'playpause')
    }

    return {
        currentTrack,
        isCapturing,
        captureSystemAudio,
        playPauseInfo
    }
}
