import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';

interface LibraryTabProps {
    isSearchMode?: boolean;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({ isSearchMode = false }) => {
    const { libraryTracks, loadTrack } = usePlayer();
    const [searchTerm, setSearchTerm] = useState('');

    // --- NUCLEAR FIX: AGGRESSIVE SAFETY CHECKS ---
    // 1. Force 'safeTracks' to be an array, no matter what.
    const safeTracks = Array.isArray(libraryTracks) ? libraryTracks : [];

    // 2. Filter safely.
    const filteredTracks = safeTracks.filter(track => {
        // If track data is corrupt, skip it safely
        if (!track || !track.title) return false;
        return (
            track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            track.artist.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="p-8 pb-32 h-full overflow-y-auto">
            <h2 className="text-3xl font-header font-bold text-white mb-6">
                {isSearchMode ? 'Global Search' : 'Your Library'}
            </h2>

            {/* SEARCH BAR */}
            <div className="mb-8">
                <input
                    type="text"
                    placeholder="Search tracks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-full py-3 px-6 text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-600"
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
                    <div key={track.id || index} className="group bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800 transition-all relative">

                        {/* IMAGE */}
                        <div className="aspect-square bg-black rounded-lg mb-4 overflow-hidden relative shadow-lg group-hover:shadow-2xl transition-shadow">
                            <img
                                src={track.image || "https://placehold.co/400?text=No+Cover"}
                                alt={track.title}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />

                            {/* HOVER BUTTONS */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                {track.url ? (
                                    <>
                                        <button onClick={() => loadTrack(track, 'A')} className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-full hover:scale-105 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">LOAD A</button>
                                        <button onClick={() => loadTrack(track, 'B')} className="px-4 py-2 bg-zinc-200 text-black text-xs font-bold rounded-full hover:scale-105 hover:bg-white transition-all shadow-lg">LOAD B</button>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-red-400 font-mono bg-red-900/50 px-2 py-1 rounded">DRM LOCKED</span>
                                )}
                            </div>
                        </div>

                        {/* TEXT */}
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-zinc-200 truncate text-sm mb-1">{track.title || "Unknown Title"}</h3>
                            <p className="text-xs text-zinc-500 truncate font-mono">{track.artist || "Unknown Artist"}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LibraryTab;
