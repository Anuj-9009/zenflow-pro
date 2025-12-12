import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

interface LrcLine {
    time: number
    text: string
}

export default function LyricsVisualizer() {
    const { track, isPlaying, lastPlaybackUpdate, progress, colors } = useStore()
    const [lines, setLines] = useState<LrcLine[]>([])
    const [loading, setLoading] = useState(false)
    const [activeLineIndex, setActiveLineIndex] = useState(-1)

    // Refs for animation
    const contentRef = useRef<HTMLDivElement>(null)
    const scrollState = useRef({ currentY: 0, targetY: 0 })
    const frameRef = useRef<number>()
    const linesRef = useRef<LrcLine[]>([]) // Ref copy for loop

    // Fetch Lyrics
    useEffect(() => {
        if (!track.name) return
        setLoading(true)
        setLines([])
        linesRef.current = []
        setActiveLineIndex(-1)

        const query = `${track.name} ${track.artist}`
        fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].syncedLyrics) {
                    const parsed = parseLrc(data[0].syncedLyrics)
                    setLines(parsed)
                    linesRef.current = parsed
                } else {
                    setLines([{ time: 0, text: "No synced lyrics found." }])
                    linesRef.current = [{ time: 0, text: "Instructional: Just vibe." }]
                }
            })
            .catch(() => {
                setLines([{ time: 0, text: "Lyrics unavailable." }])
            })
            .finally(() => setLoading(false))
    }, [track.name, track.artist])

    // Parse LRC
    const parseLrc = (lrc: string): LrcLine[] => {
        return lrc.split('\n').map(line => {
            const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
            if (match) {
                const min = parseInt(match[1])
                const sec = parseFloat(match[2])
                return { time: min * 60 + sec, text: match[3].trim() }
            }
            return null
        }).filter(Boolean) as LrcLine[]
    }

    // Optimized Render Loop
    useEffect(() => {
        const loop = () => {
            if (!contentRef.current || linesRef.current.length === 0) {
                frameRef.current = requestAnimationFrame(loop)
                return
            }

            const now = Date.now()
            const timeSinceUpdate = (now - lastPlaybackUpdate) / 1000
            const audioTime = isPlaying
                ? (track.position || 0) + timeSinceUpdate
                : (track.position || 0)

            // Find Active Line
            const currentLines = linesRef.current
            let activeIdx = -1

            for (let i = 0; i < currentLines.length; i++) {
                // Check if current time is past this line's start
                // And before next line's start (or end of song)
                const lineTime = currentLines[i].time
                const nextLineTime = currentLines[i + 1]?.time || Infinity

                if (audioTime >= lineTime && audioTime < nextLineTime) {
                    activeIdx = i
                    break
                }
            }

            // Sync State sparingly
            if (activeIdx !== activeLineIdxRef.current) {
                activeLineIdxRef.current = activeIdx
                setActiveLineIndex(activeIdx) // Trigger React render only for class/style updates
            }

            // Smooth Scroll Logic (Direct DOM)
            // Goal: Center the active line
            const LINE_HEIGHT = 60
            const CONTAINER_HEIGHT = contentRef.current.clientHeight

            let targetScroll = 0
            if (activeIdx !== -1) {
                // Calculate position to center the line
                // target = (activeIdx * LINE_HEIGHT) - (CONTAINER_HEIGHT / 2) + (LINE_HEIGHT / 2)
                targetScroll = (activeIdx * LINE_HEIGHT) - (CONTAINER_HEIGHT / 2) + (LINE_HEIGHT / 2)
            }

            // Lerp ScrollTop
            const currentScroll = contentRef.current.scrollTop
            const diff = targetScroll - currentScroll

            if (Math.abs(diff) > 0.5) {
                contentRef.current.scrollTop = currentScroll + (diff * 0.1) // 0.1 easing factor
            }

            frameRef.current = requestAnimationFrame(loop)
        }

        loop()
        return () => cancelAnimationFrame(frameRef.current!)
    }, [isPlaying, track.position, lastPlaybackUpdate])

    // NOTE: contentRef now points to the SCROLLABLE CONTAINER, not the inner wrapper.

    const activeLineIdxRef = useRef(-1)

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}>
            {/* Scrollable Container */}
            <div
                ref={contentRef}
                style={{
                    width: '100%',
                    height: '100%',
                    overflowY: 'hidden', // Hide scrollbar but allow scrollTop
                    scrollBehavior: 'auto', // We control it manually
                    paddingTop: '50vh', // Start with padding to center first line
                    paddingBottom: '50vh'
                }}
            >
                {lines.map((line, i) => {
                    const isActive = i === activeLineIndex
                    const isPast = i < activeLineIndex

                    return (
                        <div
                            key={i}
                            style={{
                                height: '60px',
                                width: '100%',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isActive ? '32px' : '24px',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                                filter: isActive ? `blur(0px) drop-shadow(0 0 10px ${colors.primary})` : (isPast ? 'blur(1px)' : 'blur(0.5px)'),
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                opacity: isActive ? 1 : 0.5,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                letterSpacing: '-0.5px'
                            }}
                        >
                            {line.text}
                        </div>
                    )
                })}
            </div>

            {loading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }}>Syncing...</div>
            )}
        </div>
    )
}
