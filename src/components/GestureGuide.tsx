import { useState } from 'react'

// Fallback Hand Icon if lucide not installed
const HandIcon = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
)

const CloseIcon = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
)

const gestures = [
    { icon: '✋', name: 'Open Palm', action: 'Pause / Play' },
    { icon: '👈', name: 'Swipe Left', action: 'Previous Song' },
    { icon: '👉', name: 'Swipe Right', action: 'Skip Song' },
    { icon: '✊', name: 'Closed Fist', action: 'Grab Loop (Hold)' },
]

export const GestureGuide: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Collapsed State: Just the Icon */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all shadow-2xl"
                    title="Gesture Guide"
                >
                    <HandIcon size={28} className="text-white/70" />
                </button>
            )}

            {/* Expanded State: The Guide Panel */}
            {isExpanded && (
                <div className="w-72 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <HandIcon size={20} className="text-teal-400" />
                            <span className="font-header font-bold text-lg tracking-wide text-white">Zen Gestures</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <CloseIcon size={18} className="text-white/50" />
                        </button>
                    </div>

                    {/* Gesture List */}
                    <div className="p-4 space-y-3">
                        {gestures.map((g, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <span className="text-2xl">{g.icon}</span>
                                <div>
                                    <div className="font-bold text-white text-sm">{g.name}</div>
                                    <div className="text-white/50 text-xs">{g.action}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tip Footer */}
                    <div className="p-3 bg-teal-500/10 border-t border-teal-500/20">
                        <div className="text-[10px] text-teal-400 font-bold tracking-widest uppercase mb-1">PRO TIP</div>
                        <div className="text-xs text-white/60">
                            Good lighting = better tracking. Use your phone flashlight if venue is dark!
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
