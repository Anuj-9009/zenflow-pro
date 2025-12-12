import { useStore } from '../store/useStore'
import { useState, useEffect } from 'react'

export default function MasonryGrid({ onPlay }: { onPlay: () => void }) {
    const { history, playlists, colors, playPause } = useStore()

    // In a real app we might fetch more items to fill the grid

    return (
        <div style={{ padding: '0 40px 150px 40px' }}>

            {/* Playlists Horizontal Scroll */}
            {playlists.length > 0 && (
                <div style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '24px', opacity: 0.9, fontFamily: '"Times New Roman", serif', letterSpacing: '-0.5px' }}>Your Playlists</h2>
                    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '40px', scrollBehavior: 'smooth' }}>
                        {playlists.map((pl, i) => (
                            <div
                                key={i}
                                className="playlist-card"
                                style={{
                                    minWidth: '220px', height: '280px',
                                    borderRadius: '32px',
                                    position: 'relative', overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                    background: '#1a1a1a'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)'
                                    e.currentTarget.style.boxShadow = `0 30px 60px ${colors.primary}30`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div style={{
                                    height: '100%', width: '100%',
                                    background: `linear-gradient(135deg, ${colors.primary}40, #000)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '48px', opacity: 0.5 }}>💿</span>
                                </div>

                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '30px 24px',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
                                    display: 'flex', flexDirection: 'column', gap: '6px'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '20px', letterSpacing: '0.3px', fontFamily: '"Times New Roman", serif' }}>{pl.name}</div>
                                    <div style={{ fontSize: '13px', opacity: 0.6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Playlist</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recents Masonry (Waterfall) */}
            <div>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', opacity: 0.9, fontFamily: '"Times New Roman", serif', letterSpacing: '-0.5px' }}>Recently Played</h2>
                <div style={{
                    columnCount: 4,
                    columnGap: '24px',
                }}>
                    {history.map((item, i) => {
                        const aspect = i % 3 === 0 ? '3/4' : '1/1' // Rhythm: Tall, Square, Square...
                        return (
                            <div
                                key={i}
                                onClick={onPlay}
                                style={{
                                    breakInside: 'avoid',
                                    marginBottom: '24px',
                                    background: '#1a1a1a',
                                    borderRadius: '32px', // Heavy rounded
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    aspectRatio: aspect,
                                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // Springy
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.03) translateY(-10px)'
                                    e.currentTarget.style.boxShadow = `0 25px 50px rgba(0,0,0,0.5), 0 0 30px ${colors.primary}20`
                                    e.currentTarget.style.zIndex = '10'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none'
                                    e.currentTarget.style.boxShadow = 'none'
                                    e.currentTarget.style.zIndex = '1'
                                }}
                            >
                                {item.artUrl ? (
                                    <img
                                        src={item.artUrl}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#222' }} />
                                )}

                                {/* Full Bleed Info Overlay */}
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '40px 24px 24px 24px',
                                    background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.8) 40%, transparent 100%)',
                                    color: 'white',
                                    transform: 'translateY(10px)',
                                    transition: 'transform 0.3s ease',
                                    display: 'flex', flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '18px', fontFamily: '"Times New Roman", serif' }}>{item.name}</div>
                                    <div style={{ fontSize: '14px', opacity: 0.7, fontFamily: 'sans-serif' }}>{item.artist}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <style>{`
                /* Hide scrollbar for playlist row */
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}
