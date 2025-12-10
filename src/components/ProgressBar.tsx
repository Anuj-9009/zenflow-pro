// Progress Bar - Clean Minimal with Seek Functionality
// Glassmorphic design with working seek control

import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '../store/useStore'

// Check Electron
const isElectron = typeof window !== 'undefined' && (window as any).electron?.media

export default function ProgressBar() {
  const { progress, track, colors, isPlaying } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }, [])

  // Seek to position in song
  const handleSeek = async (newProgress: number) => {
    if (!isElectron || track.duration <= 0) return
    const seekPosition = newProgress * track.duration
    try {
      await (window as any).electron.media.seek(seekPosition)
      console.log('Seeked to:', seekPosition, 'seconds')
    } catch (err) {
      console.error('Seek failed:', err)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragProgress(getProgressFromEvent(e))
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) setDragProgress(getProgressFromEvent(e))
  }, [isDragging, getProgressFromEvent])

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    if (isDragging && dragProgress !== null) {
      await handleSeek(dragProgress)
    }
    setIsDragging(false)
    setDragProgress(null)
  }, [isDragging, dragProgress, track.duration])

  // Click to seek (without drag)
  const handleClick = async (e: React.MouseEvent) => {
    if (!isDragging) {
      const clickProgress = getProgressFromEvent(e)
      await handleSeek(clickProgress)
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const displayProgress = dragProgress ?? progress
  const percent = Math.max(0, Math.min(100, displayProgress * 100))
  const showHandle = isDragging || isHovering

  return (
    <div style={{
      position: 'fixed',
      bottom: 110,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 360,
      zIndex: 100
    }}>
      <div style={{
        padding: '14px 20px',
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 40px ${colors.primary}15`
      }}>
        {/* Progress Track */}
        <div
          ref={barRef}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{
            position: 'relative',
            height: showHandle ? 8 : 5,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.12)',
            cursor: 'pointer',
            transition: 'height 0.2s ease'
          }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${percent}%`,
            height: 16,
            background: `linear-gradient(90deg, ${colors.primary}50, ${colors.secondary}60)`,
            filter: 'blur(10px)',
            borderRadius: 8,
            opacity: isPlaying ? 0.7 : 0.4,
            pointerEvents: 'none'
          }} />

          {/* Progress Fill */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${percent}%`,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
            transition: isDragging ? 'none' : 'width 0.15s linear'
          }} />

          {/* Handle */}
          <div style={{
            position: 'absolute',
            left: `${percent}%`,
            top: '50%',
            transform: `translate(-50%, -50%) scale(${showHandle ? 1 : 0})`,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'white',
            boxShadow: `0 0 12px ${colors.secondary}, 0 2px 6px rgba(0,0,0,0.4)`,
            transition: 'transform 0.15s ease',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
          fontSize: 11,
          fontFamily: 'monospace',
          color: 'rgba(255, 255, 255, 0.45)'
        }}>
          <span>{formatTime(track.position)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>
    </div>
  )
}
