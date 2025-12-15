// useSpotifyControls - Optimistic UI Hook for Spotify Control
// Updates UI instantly, then syncs with API in background

import { useState, useCallback, useEffect, useRef } from 'react'
import { SpotifyRemote } from '../services/SpotifyRemote'
import { SpotifyBridge } from '../services/SpotifyBridge'

interface SpotifyState {
    isPlaying: boolean
    trackName: string
    artistName: string
    artUrl: string
    duration: number
    position: number
    volume: number
}

export const useSpotifyControls = () => {
    const [state, setState] = useState<SpotifyState>({
        isPlaying: false,
        trackName: '',
        artistName: '',
        artUrl: '',
        duration: 0,
        position: 0,
        volume: 75
    })

    const positionRef = useRef(0)
    const isPlayingRef = useRef(false)

    // Heartbeat: Poll Spotify every 3 seconds
    useEffect(() => {
        if (!SpotifyBridge.token) return

        const syncWithSpotify = async () => {
            const playback = await SpotifyRemote.getPlaybackState()
            if (playback) {
                const newState: Partial<SpotifyState> = {
                    isPlaying: playback.is_playing,
                    trackName: playback.item?.name || '',
                    artistName: playback.item?.artists?.[0]?.name || '',
                    artUrl: playback.item?.album?.images?.[0]?.url || '',
                    duration: playback.item?.duration_ms || 0,
                    position: playback.progress_ms || 0,
                    volume: playback.device?.volume_percent || 75
                }

                setState(prev => ({ ...prev, ...newState }))
                positionRef.current = newState.position || 0
                isPlayingRef.current = newState.isPlaying || false
            }
        }

        // Initial sync
        syncWithSpotify()

        // Poll every 3 seconds
        const pollInterval = setInterval(syncWithSpotify, 3000)

        // Progress increment (smooth local update)
        const progressInterval = setInterval(() => {
            if (isPlayingRef.current) {
                positionRef.current += 1000
                setState(prev => ({
                    ...prev,
                    position: positionRef.current
                }))
            }
        }, 1000)

        return () => {
            clearInterval(pollInterval)
            clearInterval(progressInterval)
        }
    }, [])

    /**
     * Optimistic Play/Pause Toggle
     */
    const togglePlay = useCallback(async () => {
        // 1. Optimistic Update (Instant Feedback)
        const newState = !state.isPlaying
        setState(prev => ({ ...prev, isPlaying: newState }))
        isPlayingRef.current = newState

        // 2. API Call in Background
        try {
            const success = newState
                ? await SpotifyRemote.play()
                : await SpotifyRemote.pause()

            if (!success) {
                // Revert on error
                setState(prev => ({ ...prev, isPlaying: !newState }))
                isPlayingRef.current = !newState
            }
        } catch (e) {
            // Revert on error
            setState(prev => ({ ...prev, isPlaying: !newState }))
            isPlayingRef.current = !newState
        }
    }, [state.isPlaying])

    /**
     * Play (force play)
     */
    const play = useCallback(async () => {
        setState(prev => ({ ...prev, isPlaying: true }))
        isPlayingRef.current = true
        await SpotifyRemote.play()
    }, [])

    /**
     * Pause (force pause)
     */
    const pause = useCallback(async () => {
        setState(prev => ({ ...prev, isPlaying: false }))
        isPlayingRef.current = false
        await SpotifyRemote.pause()
    }, [])

    /**
     * Next Track (Optimistic)
     */
    const next = useCallback(async () => {
        console.log('[SpotifyControls] Next')
        await SpotifyRemote.next()
        // Force sync after skip
        setTimeout(async () => {
            const playback = await SpotifyRemote.getPlaybackState()
            if (playback?.item) {
                setState(prev => ({
                    ...prev,
                    trackName: playback.item.name,
                    artistName: playback.item.artists?.[0]?.name || '',
                    artUrl: playback.item.album?.images?.[0]?.url || '',
                    duration: playback.item.duration_ms,
                    position: 0
                }))
            }
        }, 500)
    }, [])

    /**
     * Previous Track (Optimistic)
     */
    const previous = useCallback(async () => {
        console.log('[SpotifyControls] Previous')
        await SpotifyRemote.previous()
        // Force sync after skip
        setTimeout(async () => {
            const playback = await SpotifyRemote.getPlaybackState()
            if (playback?.item) {
                setState(prev => ({
                    ...prev,
                    trackName: playback.item.name,
                    artistName: playback.item.artists?.[0]?.name || '',
                    artUrl: playback.item.album?.images?.[0]?.url || '',
                    duration: playback.item.duration_ms,
                    position: 0
                }))
            }
        }, 500)
    }, [])

    /**
     * Set Volume (Debounced API call)
     */
    const setVolume = useCallback(async (percent: number) => {
        setState(prev => ({ ...prev, volume: percent }))
        await SpotifyRemote.setVolume(percent)
    }, [])

    /**
     * Seek to position (ms)
     */
    const seek = useCallback(async (positionMs: number) => {
        positionRef.current = positionMs
        setState(prev => ({ ...prev, position: positionMs }))
        await SpotifyRemote.seek(positionMs)
    }, [])

    /**
     * Add to Queue
     */
    const addToQueue = useCallback(async (uri: string) => {
        return await SpotifyRemote.addToQueue(uri)
    }, [])

    return {
        // State
        ...state,

        // Controls
        togglePlay,
        play,
        pause,
        next,
        previous,
        setVolume,
        seek,
        addToQueue,

        // Raw state
        isConnected: !!SpotifyBridge.token
    }
}
