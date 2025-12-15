import React from 'react'

export const DeckEmptyState: React.FC = () => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            {/* Pulsing Drop Zone Visual */}
            <div className="relative">
                <div className="w-64 h-64 rounded-full border-2 border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-white/5 animate-pulse flex items-center justify-center backdrop-blur-sm">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/40">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center animate-pulse">
                <h3 className="text-2xl font-bold text-white/20 tracking-widest">DROP SONG HERE</h3>
                <p className="text-xs text-white/10 mt-2 font-mono uppercase tracking-[0.2em]">or drag from spotify</p>
            </div>
        </div>
    )
}
