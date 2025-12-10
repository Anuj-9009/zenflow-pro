// Album Art - Floating album cover with living blur background
// Shows track info and real album art from Spotify/Apple Music

import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

interface Props {
    imageUrl?: string
}

// Default gradient placeholder
const DEFAULT_ART = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%234facfe"/%3E%3Cstop offset="100%25" stop-color="%2300f2fe"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="300" height="300" fill="url(%23g)"/%3E%3C/svg%3E'

export default function AlbumArt({ imageUrl }: Props) {
    const { colors, track } = useStore()
    const [loaded, setLoaded] = useState(false)
    const [imgError, setImgError] = useState(false)

    const displayUrl = imgError ? DEFAULT_ART : (imageUrl || DEFAULT_ART)

    useEffect(() => {
        setLoaded(false)
        setImgError(false)
        const timer = setTimeout(() => setLoaded(true), 300)
        return () => clearTimeout(timer)
    }, [imageUrl])

    // Debug logging
    useEffect(() => {
        console.log('AlbumArt render - imageUrl:', imageUrl, 'track:', track.name)
    }, [imageUrl, track.name])

    return (
        <>
            {/* Living Blur Background */}
            <div style={{
                position: 'fixed',
                inset: -100,
                zIndex: 1,
                backgroundImage: `url(${displayUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(80px) saturate(150%)',
                opacity: 0.4,
                transform: 'scale(1.2)',
                transition: 'opacity 1s ease, background-image 1s ease'
            }} />

            {/* Album Art Container */}
            <div style={{
                position: 'fixed',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.5s ease'
            }}>
                {/* Glow Behind Album */}
                <div style={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: 24,
                    background: `radial-gradient(circle, ${colors.primary}50 0%, transparent 70%)`,
                    filter: 'blur(50px)',
                    transform: 'translateY(20px)',
                    opacity: 0.7
                }} />

                {/* Album Cover */}
                <div style={{
                    position: 'relative',
                    width: 260,
                    height: 260,
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px rgba(0, 0, 0, 0.6), 
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 100px ${colors.primary}40`,
                    transition: 'box-shadow 0.5s ease'
                }}>
                    <img
                        src={displayUrl}
                        alt="Album Art"
                        onError={() => setImgError(true)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />

                    {/* Glass reflection overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)',
                        pointerEvents: 'none'
                    }} />
                </div>

                {/* Track Info Below Album */}
                <div style={{
                    marginTop: 24,
                    textAlign: 'center',
                    maxWidth: 280
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 500,
                        marginBottom: 6,
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {track.name || 'No Track Playing'}
                    </div>
                    <div style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 14,
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        {track.artist || 'Play something in Spotify'}
                    </div>
                </div>
            </div>
        </>
    )
}
