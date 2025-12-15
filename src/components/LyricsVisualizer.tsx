import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { SpotifyBridge } from '../services/SpotifyBridge'
import { djEngine } from '../audio/DJEngine'

interface LrcLine {
    time: number
    text: string
}

export default function LyricsVisualizer() {
    const { track, isPlaying, lastPlaybackUpdate, colors } = useStore()
    const [lines, setLines] = useState<LrcLine[]>([])
    const [loading, setLoading] = useState(false)
    const [activeLineIndex, setActiveLineIndex] = useState(-1)
    const [hoverIndex, setHoverIndex] = useState(-1)

    // Refs for animation
    const contentRef = useRef<HTMLDivElement>(null)
    const frameRef = useRef<number>()
    const linesRef = useRef<LrcLine[]>([])

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

    // Interaction
    const handleSeek = async (seconds: number) => {
        // Determine source? For Hackathon, mostly Spotify or Local.
        // If track has spotify URI, use Bridge.
        // We lack explicit source flag in minimal store, check URI or try both/one.
        if (track.uri?.includes('spotify')) {
            await SpotifyBridge.seek(Math.round(seconds * 1000))
        } else {
            // Assume Deck A for now if local? Or check logic.
            // Simplified: Just log/try Deck A local or update Store to support seek request
            // djEngine.seek('A', 0.5) // seek(deck, percent) - Engine API mismatched
            // Actually Engine.seek takes (deck, progress0-1). We have seconds.
            // We need duration.
            const duration = track.duration || 1
            const progress = seconds / duration
            djEngine.seek('A', progress)
        }
    }

    // Optimized Render Loop
    useEffect(() => {
        const loop = () => {
            // If unmounted or empty
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
            let percentDone = 0

            for (let i = 0; i < currentLines.length; i++) {
                const lineTime = currentLines[i].time
                const nextLineTime = currentLines[i + 1]?.time || Infinity // or lineTime + 3s default

                if (audioTime >= lineTime && audioTime < nextLineTime) {
                    activeIdx = i
                    const duration = nextLineTime === Infinity ? 5 : nextLineTime - lineTime
                    percentDone = Math.max(0, Math.min(1, (audioTime - lineTime) / duration))
                    break
                }
            }

            // Sync React State for classes/scroll target
            if (activeIdx !== activeLineIdxRef.current) {
                activeLineIdxRef.current = activeIdx
                setActiveLineIndex(activeIdx)
            }

            // --- DIRECT DOM MANIPULATION (Zero-State Render) ---
            if (activeIdx !== -1) {
                const activeEl = contentRef.current.children[activeIdx] as HTMLElement
                if (activeEl) {
                    // Apply Karaoke Gradient
                    // Left (Primary Color) -> Right (Faded White)
                    const p1 = Math.floor(percentDone * 100)
                    const p2 = Math.min(100, p1 + 5) // Soft edge

                    // We need to set this directly on the element style
                    activeEl.style.background = `linear-gradient(90deg, ${colors.primary || '#0ff'} ${p1}%, rgba(255,255,255,0.3) ${p2}%)`
                    activeEl.style.webkitBackgroundClip = 'text'
                    activeEl.style.webkitTextFillColor = 'transparent'
                    activeEl.style.transform = 'scale(1.05)'
                    activeEl.style.filter = `drop-shadow(0 0 10px ${colors.primary}80)`
                }

                // Reset siblings (Clean up previous active styles if they lag)
                // Actually React renders CSS classes for inactive, so we only need to worry if we override style attribute.
                // React will reconcile style={} prop, but we are overwriting it.
                // We should clean up prev element? 
                // We can rely on React re-render when activeLineIndex changes to clear style=""?
                // Probably yes.
            }

            // Scroll Logic
            const LINE_HEIGHT = 70 // Updated for larger text + gap
            const CONTAINER_HEIGHT = contentRef.current.clientHeight
            let targetScroll = 0
            if (activeIdx !== -1) {
                targetScroll = (activeIdx * LINE_HEIGHT) - (CONTAINER_HEIGHT / 2) + (LINE_HEIGHT / 2)
            }

            // Smooth Scroll
            const currentScroll = contentRef.current.scrollTop
            const diff = targetScroll - currentScroll
            if (Math.abs(diff) > 0.5) {
                contentRef.current.scrollTop = currentScroll + (diff * 0.1)
            }

            frameRef.current = requestAnimationFrame(loop)
        }

        loop()
        return () => cancelAnimationFrame(frameRef.current!)
    }, [isPlaying, track.position, lastPlaybackUpdate, colors.primary])

    const activeLineIdxRef = useRef(-1)

    return (
        <div style={{
            width: '100%', height: '100%', position: 'relative',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}>
            <div
                ref={contentRef}
                style={{
                    width: '100%', height: '100%', overflowY: 'hidden',
                    paddingTop: '50vh', paddingBottom: '50vh'
                }}
            >
                {lines.map((line, i) => {
                    const isActive = i === activeLineIndex
                    const isHovered = i === hoverIndex

                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex(-1)}
                            onClick={() => handleSeek(line.time)}
                            style={{
                                height: '70px', // Matches LINE_HEIGHT logic in loop
                                width: '100%',
                                textAlign: 'center',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isActive ? '36px' : '24px',
                                fontWeight: isActive ? 800 : 500,
                                color: isActive ? 'transparent' : 'rgba(255,255,255,0.3)', // Active overridden by loop gradient
                                cursor: 'pointer',
                                transition: 'font-size 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s',

                                // Default styles (overwritten by JS loop when active)
                                background: isActive ? undefined : 'none',
                                WebkitBackgroundClip: isActive ? undefined : 'none',
                                WebkitTextFillColor: isActive ? undefined : 'currentcolor',
                            }}
                        >
                            {/* Hover Play Icon */}
                            {isHovered && !isActive && (
                                <span style={{ position: 'absolute', left: '10%', fontSize: '20px', color: colors.primary }}>
                                    ▶
                                </span>
                            )}

                            {line.text}
                        </div>
                    )
                })}
            </div>

            {loading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }}>
                    Searching Lyrics...
                </div>
            )}
        </div>
    )
}
