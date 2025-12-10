// Gesture Handler Hook
// Supports double-tap (play/pause) and swipe (prev/next)

import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'

interface Point {
    x: number
    y: number
    time: number
}

export function useGestures() {
    const { playPause } = useStore()
    const lastTap = useRef<number>(0)
    const touchStart = useRef<Point | null>(null)

    const handlePlayPause = useCallback(() => {
        playPause()
    }, [playPause])

    const handleSwipe = useCallback((direction: 'left' | 'right') => {
        window.dispatchEvent(new CustomEvent('zenflow:swipe', {
            detail: { direction }
        }))
    }, [])

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0]
            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            }
        }

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current) return

            const touch = e.changedTouches[0]
            const dx = touch.clientX - touchStart.current.x
            const dy = touch.clientY - touchStart.current.y
            const dt = Date.now() - touchStart.current.time

            // Swipe detection: min 60px, max 300ms, more horizontal than vertical
            if (Math.abs(dx) > 60 && dt < 300 && Math.abs(dx) > Math.abs(dy)) {
                handleSwipe(dx > 0 ? 'right' : 'left')
                touchStart.current = null
                return
            }

            // Double tap detection: max 300ms between taps
            const now = Date.now()
            if (now - lastTap.current < 300) {
                handlePlayPause()
                lastTap.current = 0
            } else {
                lastTap.current = now
            }

            touchStart.current = null
        }

        // Mouse double-click
        const handleDoubleClick = () => {
            handlePlayPause()
        }

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault()
                handlePlayPause()
            } else if (e.code === 'ArrowLeft') {
                handleSwipe('left')
            } else if (e.code === 'ArrowRight') {
                handleSwipe('right')
            }
        }

        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        document.addEventListener('touchend', handleTouchEnd, { passive: true })
        document.addEventListener('dblclick', handleDoubleClick)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchend', handleTouchEnd)
            document.removeEventListener('dblclick', handleDoubleClick)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [handlePlayPause, handleSwipe])
}
