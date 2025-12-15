// GestureDashboard - Full gesture control settings with live camera preview
import React, { useRef, useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'

interface GestureDashboardProps {
    gesturesEnabled: boolean
    onToggle: (enabled: boolean) => void
    videoRef?: React.RefObject<HTMLVideoElement>
    canvasRef?: React.RefObject<HTMLCanvasElement>
}

export const GestureDashboard: React.FC<GestureDashboardProps> = ({
    gesturesEnabled,
    onToggle,
    videoRef,
    canvasRef
}) => {
    const { colors } = useStore()
    const [sensitivity, setSensitivity] = useState(50)
    const [trackingStatus, setTrackingStatus] = useState<'active' | 'searching' | 'off'>('off')
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const localCanvasRef = useRef<HTMLCanvasElement>(null)

    // Use passed refs or local refs
    const activeVideoRef = videoRef || localVideoRef
    const activeCanvasRef = canvasRef || localCanvasRef

    useEffect(() => {
        if (gesturesEnabled) {
            setTrackingStatus('searching')
            // Simulate finding hand after delay
            const timeout = setTimeout(() => setTrackingStatus('active'), 2000)
            return () => clearTimeout(timeout)
        } else {
            setTrackingStatus('off')
        }
    }, [gesturesEnabled])

    const gestures = [
        {
            name: 'Open Palm',
            icon: '✋',
            action: 'Play / Pause',
            color: '#10B981'
        },
        {
            name: 'Swipe Left',
            icon: '👈',
            action: 'Previous Track',
            color: '#F59E0B'
        },
        {
            name: 'Swipe Right',
            icon: '👉',
            action: 'Next Track',
            color: '#3B82F6'
        },
        {
            name: 'Closed Fist',
            icon: '✊',
            action: 'Loop / Stop',
            color: '#EF4444'
        }
    ]

    return (
        <div className="h-full overflow-y-auto p-6">
            <h1 className="text-3xl font-bold mb-2">Gesture Controls</h1>
            <p className="text-white/50 mb-8">Control ZenFlow with your hands using AI-powered gesture recognition.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Live Preview */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span>Live Camera</span>
                        <span className={`w-2 h-2 rounded-full ${trackingStatus === 'active' ? 'bg-green-500 animate-pulse' :
                                trackingStatus === 'searching' ? 'bg-yellow-500 animate-pulse' :
                                    'bg-red-500'
                            }`} />
                        <span className="text-sm font-normal text-white/40">
                            {trackingStatus === 'active' ? 'Hand Detected' :
                                trackingStatus === 'searching' ? 'Searching...' :
                                    'Disabled'}
                        </span>
                    </h2>

                    <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10">
                        {gesturesEnabled ? (
                            <>
                                <video
                                    ref={activeVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                                />
                                <canvas
                                    ref={activeCanvasRef}
                                    className="absolute inset-0 w-full h-full scale-x-[-1]"
                                />
                                {/* Skeleton overlay hint */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {trackingStatus === 'searching' && (
                                        <div className="text-white/30 text-center">
                                            <div className="text-4xl mb-2">👋</div>
                                            <div>Wave your hand in front of the camera</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-white/30">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    <div>Camera Preview Disabled</div>
                                    <div className="text-sm">Enable gestures to start</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="space-y-6">
                    {/* Master Toggle */}
                    <div className="glass-panel p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">Enable Gestures</h3>
                                <p className="text-sm text-white/50">Control playback with hand movements</p>
                            </div>
                            <button
                                onClick={() => onToggle(!gesturesEnabled)}
                                className={`w-14 h-8 rounded-full transition-all relative ${gesturesEnabled ? 'bg-green-500' : 'bg-white/20'
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${gesturesEnabled ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Sensitivity */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="font-bold mb-4">Detection Sensitivity</h3>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            style={{
                                background: `linear-gradient(90deg, ${colors.primary} ${sensitivity}%, rgba(255,255,255,0.2) ${sensitivity}%)`
                            }}
                        />
                        <div className="flex justify-between text-sm text-white/40 mt-2">
                            <span>Low</span>
                            <span>Medium</span>
                            <span>High</span>
                        </div>
                    </div>

                    {/* Gesture Cheat Sheet */}
                    <div>
                        <h3 className="font-bold mb-4">Gesture Guide</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {gestures.map((gesture) => (
                                <div
                                    key={gesture.name}
                                    className="glass-panel p-4 rounded-xl flex items-center gap-4"
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                        style={{ background: `${gesture.color}20`, color: gesture.color }}
                                    >
                                        {gesture.icon}
                                    </div>
                                    <div>
                                        <div className="font-medium">{gesture.name}</div>
                                        <div className="text-sm text-white/50">{gesture.action}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default React.memo(GestureDashboard)
