import React, { useState, useMemo, useCallback } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useContextMenu, TrackContextMenu } from '../../hooks/useContextMenu';
import { fuzzySearchTracks, debounce } from '../../utils/searchUtils';

interface LibraryTabProps {
    isSearchMode?: boolean;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({ isSearchMode = false }) => {
    const { libraryTracks, playTrack, loadTrack, isSpotifyReady } = usePlayer();
    const [searchTerm, setSearchTerm] = useState('');
    const { menuState, openMenu, closeMenu } = useContextMenu();

    // Force 'safeTracks' to be an array
    const safeTracks = Array.isArray(libraryTracks) ? libraryTracks : [];

    // Fuzzy search with Fuse.js
    const filteredTracks = useMemo(() => {
        if (!searchTerm.trim()) return safeTracks;
        return fuzzySearchTracks(safeTracks, searchTerm);
    }, [safeTracks, searchTerm]);

    // Debounced search handler (300ms)
    const handleSearchChange = useMemo(
        () => debounce((value: string) => setSearchTerm(value), 300),
        []
    );

    // Handle loading to DJ decks
    const handleLoadToDeck = useCallback(async (deck: 'A' | 'B', track: any) => {
        console.log(`🎛️ Loading "${track.title}" to Deck ${deck}`);
        await loadTrack(track, deck);
    }, [loadTrack]);

    // Handle left-click (play immediately via Spotify SDK)
    const handlePlayNow = useCallback(async (track: any) => {
        console.log(`▶️ Playing Now: "${track.title}"`);
        await playTrack(track);
    }, [playTrack]);

    // Handle right-click (context menu)
    const handleRightClick = useCallback((e: React.MouseEvent, track: any) => {
        openMenu(e, track);
    }, [openMenu]);

    return (
        <div className="p-8 pb-32 h-full overflow-y-auto">
            <h2 className="text-3xl font-header font-bold text-white mb-4">
                {isSearchMode ? 'Global Search' : 'Your Library'}
            </h2>

            {/* SDK Status Indicator */}
            <div className="mb-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSpotifyReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                <span className="text-xs text-zinc-500">
                    {isSpotifyReady ? 'Spotify Ready' : 'Connecting to Spotify...'}
                </span>
            </div>

            {/* SEARCH BAR - Fuzzy Search */}
            <div className="mb-8">
                <input
                    type="text"
                    placeholder="Search tracks... (fuzzy matching enabled)"
                    defaultValue=""
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-full py-3 px-6 text-white outline-none focus:border-yellow-500 transition-colors placeholder:text-zinc-600"
                />
            </div>

            {/* EMPTY STATE */}
            {filteredTracks.length === 0 && (
                <div className="text-zinc-500 mt-10 p-10 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/50">
                    {isSearchMode ? "No results found." : "No tracks loaded. Connect Spotify to begin."}
                </div>
            )}

            {/* GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredTracks.map((track, index) => (
                    <div
                        key={track.id || index}
                        className="group bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800 transition-all relative cursor-pointer"
                        onClick={() => handlePlayNow(track)}
                        onContextMenu={(e) => handleRightClick(e, track)}
                    >
                        {/* IMAGE */}
                        <div className="aspect-square bg-black rounded-lg mb-4 overflow-hidden relative shadow-lg group-hover:shadow-2xl transition-shadow">
                            <img
                                src={track.image || "https://placehold.co/400?text=No+Cover"}
                                alt={track.title}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />

                            {/* HOVER OVERLAY */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                {/* Spotify URI = playable */}
                                {track.uri ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePlayNow(track); }}
                                            className="px-4 py-2 bg-green-500 text-black text-xs font-bold rounded-full hover:scale-105 hover:bg-green-400 transition-all shadow-lg"
                                        >
                                            ▶ PLAY
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLoadToDeck('A', track); }}
                                                className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full hover:scale-105 transition-all"
                                            >
                                                DECK A
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLoadToDeck('B', track); }}
                                                className="px-3 py-1 bg-zinc-200 text-black text-[10px] font-bold rounded-full hover:scale-105 transition-all"
                                            >
                                                DECK B
                                            </button>
                                        </div>
                                    </>
                                ) : track.url ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLoadToDeck('A', track); }}
                                            className="px-4 py-2 bg-yellow-400 text-black text-xs font-bold rounded-full hover:scale-105 transition-all shadow-lg"
                                        >
                                            LOAD A
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLoadToDeck('B', track); }}
                                            className="px-4 py-2 bg-zinc-200 text-black text-xs font-bold rounded-full hover:scale-105 transition-all shadow-lg"
                                        >
                                            LOAD B
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-red-400 font-mono bg-red-900/50 px-2 py-1 rounded">NO AUDIO</span>
                                )}
                            </div>
                        </div>

                        {/* TEXT */}
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-zinc-200 truncate text-sm mb-1">{track.title || "Unknown Title"}</h3>
                            <p className="text-xs text-zinc-500 truncate font-mono">{track.artist || "Unknown Artist"}</p>
                        </div>

                        {/* Right-click hint */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] text-zinc-500 bg-zinc-900/80 px-1.5 py-0.5 rounded">Right-click ➤</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* CONTEXT MENU */}
            {menuState.isOpen && menuState.track && (
                <TrackContextMenu
                    x={menuState.x}
                    y={menuState.y}
                    track={menuState.track}
                    onLoadDeck={handleLoadToDeck}
                    onClose={closeMenu}
                />
            )}
        </div>
    );
};

export default LibraryTab;
