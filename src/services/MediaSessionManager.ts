// MediaSessionManager - System Keyboard Play/Pause Integration
// Makes keyboard media keys work with ZenFlow

import { djEngine } from '../audio/DJEngine'

class MediaSessionManagerClass {
    private initialized = false

    init() {
        if (this.initialized) return
        if (!('mediaSession' in navigator)) {
            console.log('[MediaSession] Not supported in this environment')
            return
        }

        this.initialized = true
        console.log('[MediaSession] Initializing media key handlers...')

        // Play handler
        navigator.mediaSession.setActionHandler('play', () => {
            console.log('[MediaSession] Play key pressed')
            this.playActiveDeck()
        })

        // Pause handler
        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('[MediaSession] Pause key pressed')
            this.pauseActiveDeck()
        })

        // Previous track
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            console.log('[MediaSession] Previous key pressed')
            // In DJ mode, we could switch to the other deck or seek back
            this.seekBack()
        })

        // Next track
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            console.log('[MediaSession] Next key pressed')
            // In DJ mode, skip to next or fast forward
            this.seekForward()
        })

        // Seek backward/forward (for scrubbing)
        try {
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const seekOffset = details?.seekOffset || 10
                this.seekRelative(-seekOffset)
            })

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const seekOffset = details?.seekOffset || 10
                this.seekRelative(seekOffset)
            })
        } catch (e) {
            console.log('[MediaSession] Seek handlers not supported')
        }

        console.log('[MediaSession] Media key handlers registered')
    }

    // Update the currently displayed track info
    updateMetadata(title: string, artist: string, artUrl?: string) {
        if (!('mediaSession' in navigator)) return

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'ZenFlow Pro',
                artist: artist || 'DJ Mix',
                album: 'ZenFlow',
                artwork: artUrl ? [
                    { src: artUrl, sizes: '512x512', type: 'image/jpeg' }
                ] : []
            })
        } catch (e) {
            console.error('[MediaSession] Failed to set metadata:', e)
        }
    }

    // Update playback state
    updatePlaybackState(isPlaying: boolean) {
        if (!('mediaSession' in navigator)) return
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }

    // Play the active deck (based on crossfader position)
    private playActiveDeck() {
        const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
        const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB

        if (state.track !== 'Empty') {
            djEngine.play(activeDeck)
        } else {
            // Try the other deck
            const otherDeck = activeDeck === 'A' ? 'B' : 'A'
            const otherState = otherDeck === 'A' ? djEngine.stateA : djEngine.stateB
            if (otherState.track !== 'Empty') {
                djEngine.play(otherDeck)
            }
        }
    }

    // Pause the active deck
    private pauseActiveDeck() {
        if (djEngine.stateA.isPlaying) djEngine.pause('A')
        if (djEngine.stateB.isPlaying) djEngine.pause('B')
    }

    // Seek back 10 seconds
    private seekBack() {
        const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
        const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB
        if (state.duration > 0) {
            const newProgress = Math.max(0, (state.position - 10) / state.duration)
            djEngine.seek(activeDeck, newProgress)
        }
    }

    // Seek forward 10 seconds
    private seekForward() {
        const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
        const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB
        if (state.duration > 0) {
            const newProgress = Math.min(1, (state.position + 10) / state.duration)
            djEngine.seek(activeDeck, newProgress)
        }
    }

    // Seek relative amount
    private seekRelative(seconds: number) {
        const activeDeck = djEngine.crossfadeValue < 0.5 ? 'A' : 'B'
        const state = activeDeck === 'A' ? djEngine.stateA : djEngine.stateB
        if (state.duration > 0) {
            const newProgress = Math.max(0, Math.min(1, (state.position + seconds) / state.duration))
            djEngine.seek(activeDeck, newProgress)
        }
    }
}

export const MediaSessionManager = new MediaSessionManagerClass()
