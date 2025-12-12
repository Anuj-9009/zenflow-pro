import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

// FIX 1: ULTRA-SMOOTH LYRICS ENGINE ("Karaoke Style")
export default function LyricsView() {
    const { track, isPlaying, lastPlaybackUpdate, colors } = useStore()
    const [lines, setLines] = useState<{ time: number, text: string, duration?: number }[]>([])

    const containerRef = useRef<HTMLDivElement>(null)
    const frameRef = useRef<number>()

    // Fetch Lyrics & Calculate Durations
    useEffect(() => {
        if (!track.name) return
        setLines([])
        if (containerRef.current) containerRef.current.scrollTop = 0

        fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(track.name + ' ' + track.artist)}`)
            .then(res => res.json())
            .then(data => {
                if (data?.[0]?.syncedLyrics) {
                    const parsed = parseLrc(data[0].syncedLyrics)
                    // Calculate durations
                    for (let i = 0; i < parsed.length; i++) {
                        const nextTime = parsed[i + 1]?.time || (parsed[i].time + 5) // default 5s if last
                        parsed[i].duration = nextTime - parsed[i].time
                    }
                    setLines(parsed)
                } else {
                    setLines([{ time: 0, text: "Instrumental / Lyrics Not Found", duration: 999 }])
                }
            })
            .catch(() => setLines([{ time: 0, text: "Lyrics Unavailable", duration: 999 }]))
    }, [track.name])

    const parseLrc = (lrc: string) => lrc.split('\n').map(line => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
        if (!match) return null
        return { time: parseInt(match[1]) * 60 + parseFloat(match[2]), text: match[3].trim() }
    }).filter(Boolean) as { time: number, text: string, duration?: number }[]

    // The Render Loop (60fps)
    useEffect(() => {
        const update = () => {
            if (!containerRef.current || lines.length === 0) {
                frameRef.current = requestAnimationFrame(update)
                return
            }

            // Calculate Exact Audio Time
            const now = Date.now()
            // If playing, interpolate. If not, stick to static position.
            const audioTime = isPlaying
                ? (track.position || 0) + ((now - lastPlaybackUpdate) / 1000)
                : (track.position || 0)

            // Find Active Line
            let activeIdx = -1
            for (let i = 0; i < lines.length; i++) {
                if (audioTime >= lines[i].time && audioTime < (lines[i].time + (lines[i].duration || 5))) {
                    activeIdx = i
                    break
                }
            }

            // Direct DOM Manipulation for Perf
            const children = containerRef.current.children
            for (let i = 0; i < children.length; i++) {
                const el = children[i] as HTMLElement

                if (i === activeIdx) {
                    // Active Styles
                    el.style.opacity = '1'
                    el.style.transform = 'scale(1.05)'
                    el.style.filter = 'blur(0px)'
                    // Gradient Logic (Karaoke)
                    const line = lines[i]
                    if (line.duration) {
                        const progress = Math.max(0, Math.min(1, (audioTime - line.time) / line.duration))
                        const pct = progress * 100
                        el.style.backgroundImage = `linear-gradient(to right, white ${pct}%, rgba(255,255,255,0.4) ${pct}%)`
                        el.style.webkitBackgroundClip = 'text'
                        el.style.backgroundClip = 'text'
                        el.style.color = 'transparent' // text-fill-color transparent
                    }

                    // Smooth Auto-Scroll
                    const targetTop = el.offsetTop - (containerRef.current.clientHeight / 2) + (el.clientHeight / 2)
                    // Lerp scrollTop
                    const currentTop = containerRef.current.scrollTop
                    const diff = targetTop - currentTop
                    if (Math.abs(diff) > 1) {
                        containerRef.current.scrollTop = currentTop + (diff * 0.05) // Smooth ease
                    }

                } else {
                    // Inactive Styles
                    el.style.backgroundImage = 'none'
                    el.style.color = 'rgba(255,255,255,0.3)'
                    el.style.transform = 'scale(1)'

                    // Distance Blur
                    const dist = Math.abs(i - activeIdx)
                    if (activeIdx !== -1) {
                        el.style.filter = `blur(${Math.min(4, dist * 1)}px)`
                        el.style.opacity = `${Math.max(0.1, 0.5 - (dist * 0.1))}`
                    } else {
                        el.style.filter = 'blur(0px)'
                        el.style.opacity = '0.5'
                    }
                }
            }

            frameRef.current = requestAnimationFrame(update)
        }

        if (isPlaying) {
            frameRef.current = requestAnimationFrame(update)
        }

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        }
    }, [isPlaying, lines, track.position, lastPlaybackUpdate])

    return (
        <div
            ref={containerRef}
            className="no-scrollbar"
            style={{
                width: '100%', height: '100%',
                overflowY: 'scroll',
                padding: '50vh 0', // Center first/last lines
                position: 'relative',
                maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
            }}
        >
            {lines.map((line, i) => (
                <div
                    key={i}
                    style={{
                        padding: '12px 20px',
                        fontSize: '32px',
                        fontWeight: 700,
                        textAlign: 'center',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out', // CSS transition for transform/opacity but NOT color (handled by loop)
                        cursor: 'default',
                        userSelect: 'none'
                    }}
                >
                    {line.text}
                </div>
            ))}
        </div>
    )
}
