// SpotifyRemote - Command & Control Service for Spotify Playback
// Handles Queue, Volume, Play/Pause via Spotify Web API

import { SpotifyBridge } from './SpotifyBridge'

// Debounce helper for volume changes
let volumeDebounceTimer: ReturnType<typeof setTimeout> | null = null

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${SpotifyBridge.token}`,
    'Content-Type': 'application/json'
})

export const SpotifyRemote = {
    /**
     * Add track to Spotify queue
     * POST /v1/me/player/queue?uri={track_uri}
     */
    addToQueue: async (uri: string): Promise<boolean> => {
        if (!SpotifyBridge.token) {
            console.error('[SpotifyRemote] No auth token')
            return false
        }

        try {
            const res = await fetch(
                `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
                {
                    method: 'POST',
                    headers: getAuthHeaders()
                }
            )

            if (res.status === 204 || res.ok) {
                console.log(`[SpotifyRemote] Queued: ${uri}`)
                return true
            } else {
                const error = await res.json().catch(() => ({}))
                console.error('[SpotifyRemote] Queue failed:', error)
                return false
            }
        } catch (e) {
            console.error('[SpotifyRemote] Queue error:', e)
            return false
        }
    },

    /**
     * Set Spotify volume (0-100)
     * PUT /v1/me/player/volume?volume_percent={val}
     * Debounced to avoid API rate limits
     */
    setVolume: async (percent: number): Promise<boolean> => {
        if (!SpotifyBridge.token) return false

        // Debounce - only send after 300ms of no changes
        if (volumeDebounceTimer) clearTimeout(volumeDebounceTimer)

        return new Promise((resolve) => {
            volumeDebounceTimer = setTimeout(async () => {
                try {
                    const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)))
                    const res = await fetch(
                        `https://api.spotify.com/v1/me/player/volume?volume_percent=${clampedPercent}`,
                        {
                            method: 'PUT',
                            headers: getAuthHeaders()
                        }
                    )

                    if (res.status === 204 || res.ok) {
                        console.log(`[SpotifyRemote] Volume set: ${clampedPercent}%`)
                        resolve(true)
                    } else {
                        console.error('[SpotifyRemote] Volume failed')
                        resolve(false)
                    }
                } catch (e) {
                    console.error('[SpotifyRemote] Volume error:', e)
                    resolve(false)
                }
            }, 300)
        })
    },

    /**
     * Start playback
     * PUT /v1/me/player/play
     */
    play: async (): Promise<boolean> => {
        if (!SpotifyBridge.token) return false

        try {
            const res = await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers: getAuthHeaders()
            })

            if (res.status === 204 || res.ok) {
                console.log('[SpotifyRemote] Play')
                return true
            }
            return false
        } catch (e) {
            console.error('[SpotifyRemote] Play error:', e)
            return false
        }
    },

    /**
     * Pause playback
     * PUT /v1/me/player/pause
     */
    pause: async (): Promise<boolean> => {
        if (!SpotifyBridge.token) return false

        try {
            const res = await fetch('https://api.spotify.com/v1/me/player/pause', {
                method: 'PUT',
                headers: getAuthHeaders()
            })

            if (res.status === 204 || res.ok) {
                console.log('[SpotifyRemote] Pause')
                return true
            }
            return false
        } catch (e) {
            console.error('[SpotifyRemote] Pause error:', e)
            return false
        }
    },

    /**
     * Skip to next track
     * POST /v1/me/player/next
     */
    next: async (): Promise<boolean> => {
        if (!SpotifyBridge.token) return false

        try {
            const res = await fetch('https://api.spotify.com/v1/me/player/next', {
                method: 'POST',
                headers: getAuthHeaders()
            })
            return res.status === 204 || res.ok
        } catch (e) {
            console.error('[SpotifyRemote] Next error:', e)
            return false
        }
    },

    /**
     * Skip to previous track
     * POST /v1/me/player/previous
     */
    previous: async (): Promise<boolean> => {
        if (!SpotifyBridge.token) return false

        try {
            const res = await fetch('https://api.spotify.com/v1/me/player/previous', {
                method: 'POST',
                headers: getAuthHeaders()
            })
            return res.status === 204 || res.ok
        } catch (e) {
            console.error('[SpotifyRemote] Previous error:', e)
            return false
        }
    },

    /**
     * Seek to position
     * PUT /v1/me/player/seek?position_ms={ms}
     */
    seek: async (positionMs: number): Promise<boolean> => {
        if (!SpotifyBridge.token) return false

        try {
            const res = await fetch(
                `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(positionMs)}`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders()
                }
            )
            return res.status === 204 || res.ok
        } catch (e) {
            console.error('[SpotifyRemote] Seek error:', e)
            return false
        }
    },

    /**
     * Get current playback state
     * GET /v1/me/player
     */
    getPlaybackState: async () => {
        if (!SpotifyBridge.token) return null

        try {
            const res = await fetch('https://api.spotify.com/v1/me/player', {
                headers: getAuthHeaders()
            })

            if (res.status === 204) {
                // No active device
                return null
            }

            if (res.ok) {
                return await res.json()
            }
            return null
        } catch (e) {
            console.error('[SpotifyRemote] Playback state error:', e)
            return null
        }
    }
}
