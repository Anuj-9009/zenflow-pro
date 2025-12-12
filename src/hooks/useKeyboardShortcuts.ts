// Keyboard Shortcuts Hook for ZenFlow
import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useKeyboardShortcuts() {
    const { playPause, next, previous, isInitialized } = useStore()

    useEffect(() => {
        if (!isInitialized) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault()
                    playPause()
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    next()
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    previous()
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    // Volume up - will be implemented with volume control
                    if (window.electron?.media?.volumeUp) {
                        window.electron.media.volumeUp()
                    }
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    // Volume down
                    if (window.electron?.media?.volumeDown) {
                        window.electron.media.volumeDown()
                    }
                    break
                case 'KeyM':
                    // Mute toggle - future implementation
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isInitialized, playPause, next, previous])
}
