// GlobalSearch - Spotify-style Search with Top Result + Songs Layout
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { SpotifyBridge } from '../services/SpotifyBridge'
import { TrackRow } from './Library/TrackRow'

interface SearchResult {
    tracks: any[]
    artists: any[]
    topResult: any | null
}

export const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult>({ tracks: [], artists: [], topResult: null })
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const categories = [
        { name: 'Pop', color: 'from-pink-500 to-rose-600' },
        { name: 'Hip-Hop', color: 'from-orange-500 to-amber-600' },
        { name: 'Electronic', color: 'from-cyan-500 to-blue-600' },
        { name: 'Chill', color: 'from-teal-500 to-emerald-600' },
        { name: 'Rock', color: 'from-red-500 to-orange-600' },
        { name: 'Jazz', color: 'from-violet-500 to-purple-600' },
        { name: 'Classical', color: 'from-amber-400 to-yellow-600' },
        { name: 'R&B', color: 'from-fuchsia-500 to-pink-600' }
    ]

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !SpotifyBridge.token) {
            setResults({ tracks: [], artists: [], topResult: null })
            return
        }

        setLoading(true)
        try {
            const res = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,artist&limit=10`,
                { headers: { Authorization: `Bearer ${SpotifyBridge.token}` } }
            )
            const data = await res.json()

            const tracks = data.tracks?.items?.map((t: any) => ({
                id: t.id,
                name: t.name,
                artist: t.artists?.[0]?.name || 'Unknown',
                album: t.album?.name,
                artUrl: t.album?.images?.[0]?.url,
                duration: t.duration_ms,
                uri: t.uri
            })) || []

            const artists = data.artists?.items?.slice(0, 3) || []

            // Top result = first artist or first track
            const topResult = artists[0] || (tracks[0] ? { ...tracks[0], type: 'track' } : null)

            setResults({ tracks, artists, topResult })
        } catch (e) {
            console.error('Search failed:', e)
        }
        setLoading(false)
    }, [])

    // Handle input change with debounce
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => performSearch(value), 300)
    }, [performSearch])

    // Focus on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const showToast = (msg: string) => console.log('[Toast]', msg)

    return (
        <div className="h-full overflow-y-auto">
            {/* Sticky Search Bar */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-black via-black/95 to-transparent pb-8 pt-6 px-6">
                <div className="relative max-w-2xl">
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="What do you want to play?"
                        className="w-full pl-12 pr-4 py-3 bg-white/10 rounded-full text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                    {loading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 pb-24">
                {/* Empty State: Browse Categories */}
                {!query.trim() && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Browse All</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {categories.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setQuery(cat.name)}
                                    className={`aspect-[1.5] rounded-lg bg-gradient-to-br ${cat.color} p-4 text-left font-bold text-lg hover:scale-105 transition-transform`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {query.trim() && !loading && results.tracks.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
                        {/* Left: Top Result */}
                        {results.topResult && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Top Result</h2>
                                <TopResultCard result={results.topResult} />
                            </div>
                        )}

                        {/* Right: Songs */}
                        <div>
                            <h2 className="text-xl font-bold mb-4">Songs</h2>
                            <div className="bg-white/5 rounded-xl overflow-hidden">
                                {results.tracks.slice(0, 5).map((track, i) => (
                                    <TrackRow
                                        key={track.id}
                                        track={track}
                                        index={i}
                                        showToast={showToast}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* No Results */}
                {query.trim() && !loading && results.tracks.length === 0 && (
                    <div className="text-center text-white/40 py-12">
                        No results found for "{query}"
                    </div>
                )}
            </div>
        </div>
    )
}

// Top Result Card Component
const TopResultCard: React.FC<{ result: any }> = ({ result }) => {
    const [imgError, setImgError] = useState(false)
    const imageUrl = result.images?.[0]?.url || result.artUrl

    return (
        <div className="bg-white/5 hover:bg-white/10 rounded-xl p-5 transition-all cursor-pointer group">
            <div className="relative">
                {/* Image */}
                <div className={`w-24 h-24 mb-4 overflow-hidden shadow-lg ${result.type === 'track' ? 'rounded-lg' : 'rounded-full'}`}>
                    {imageUrl && !imgError ? (
                        <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Play Button (appears on hover) */}
                <button className="absolute bottom-4 right-0 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
                    <svg width="20" height="20" viewBox="0 0 12 14" fill="black">
                        <path d="M0 0L12 7L0 14V0Z" />
                    </svg>
                </button>
            </div>

            {/* Info */}
            <h3 className="text-2xl font-bold mb-1 truncate">{result.name}</h3>
            <p className="text-sm text-white/50">
                {result.type === 'track' ? (
                    <>Song • {result.artist}</>
                ) : (
                    'Artist'
                )}
            </p>
        </div>
    )
}

export default React.memo(GlobalSearch)
