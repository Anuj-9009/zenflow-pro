// Settings Panel - ZenFlow v2.0 (Polished)
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

interface SettingsProps {
    isOpen: boolean
    onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsProps) {
    const { colors, setColors, visualizerMode, setVisualizerMode } = useStore()
    const [sensitivity, setSensitivity] = useState(1.0)
    const [animationSpeed, setAnimationSpeed] = useState(1.0)
    const [isVisible, setIsVisible] = useState(false)

    // Animate panel entrance/exit
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const colorPresets = [
        { name: 'Ocean', primary: '#4facfe', secondary: '#00f2fe', background: '#050510' },
        { name: 'Sunset', primary: '#f093fb', secondary: '#f5576c', background: '#0a0510' },
        { name: 'Forest', primary: '#4ade80', secondary: '#22d3ee', background: '#050a10' },
        { name: 'Galaxy', primary: '#a78bfa', secondary: '#818cf8', background: '#08051a' },
        { name: 'Fire', primary: '#fb923c', secondary: '#facc15', background: '#0a0805' },
        { name: 'Mint', primary: '#34d399', secondary: '#a7f3d0', background: '#022c22' },
    ]

    const visualizerModes = [
        { id: 'aurora', name: 'Aurora', icon: '🌌' },
        { id: 'particles', name: 'Particles', icon: '✨' },
        { id: 'waves', name: 'Waves', icon: '🌊' },
        { id: 'minimal', name: 'Minimal', icon: '◯' },
    ]

    if (!isVisible) return null

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 999
                }}
            />

            {/* Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '340px',
                    height: '100vh',
                    background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(5, 5, 15, 0.98) 100%)',
                    backdropFilter: 'blur(40px)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1000,
                    padding: '28px',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '22px',
                        fontWeight: 600,
                        margin: 0,
                        letterSpacing: '-0.5px'
                    }}>
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Visualizer Mode */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        marginBottom: '14px',
                        fontWeight: 500
                    }}>
                        Visualizer Mode
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {visualizerModes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setVisualizerMode(mode.id as 'aurora' | 'particles' | 'waves' | 'minimal')}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: visualizerMode === mode.id
                                        ? `1px solid ${colors.primary}`
                                        : '1px solid rgba(255, 255, 255, 0.08)',
                                    background: visualizerMode === mode.id
                                        ? `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}10)`
                                        : 'rgba(255, 255, 255, 0.03)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s',
                                    color: 'white'
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>{mode.icon}</span>
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{mode.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Themes */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        marginBottom: '14px',
                        fontWeight: 500
                    }}>
                        Color Theme
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => setColors(preset.primary, preset.secondary, preset.background)}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    border: colors.primary === preset.primary
                                        ? '2px solid white'
                                        : '2px solid transparent',
                                    background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: colors.primary === preset.primary
                                        ? `0 0 20px ${preset.primary}50`
                                        : 'none'
                                }}
                                title={preset.name}
                            />
                        ))}
                    </div>
                </div>

                {/* Sensitivity Slider */}
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 500 }}>
                            Audio Sensitivity
                        </span>
                        <span style={{
                            color: colors.primary,
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                        }}>
                            {Math.round(sensitivity * 100)}%
                        </span>
                    </div>
                    <div style={{
                        position: 'relative',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${(sensitivity / 2) * 100}%`,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                            borderRadius: '3px',
                            transition: 'width 0.1s'
                        }} />
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                        style={{
                            width: '100%',
                            height: '24px',
                            marginTop: '-15px',
                            opacity: 0,
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Animation Speed Slider */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 500 }}>
                            Animation Speed
                        </span>
                        <span style={{
                            color: colors.secondary,
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                        }}>
                            {animationSpeed.toFixed(1)}x
                        </span>
                    </div>
                    <div style={{
                        position: 'relative',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${((animationSpeed - 0.5) / 1.5) * 100}%`,
                            background: `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`,
                            borderRadius: '3px',
                            transition: 'width 0.1s'
                        }} />
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                        style={{
                            width: '100%',
                            height: '24px',
                            marginTop: '-15px',
                            opacity: 0,
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Keyboard Shortcuts */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        marginBottom: '14px',
                        fontWeight: 500
                    }}>
                        Keyboard Shortcuts
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        padding: '14px'
                    }}>
                        {[
                            { key: 'Space', action: 'Play / Pause' },
                            { key: '←', action: 'Previous Track' },
                            { key: '→', action: 'Next Track' },
                            { key: '↑', action: 'Volume Up' },
                            { key: '↓', action: 'Volume Down' },
                        ].map(({ key, action }) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>{action}</span>
                                <kbd style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '11px',
                                    fontFamily: 'SF Mono, Monaco, monospace',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    {key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    position: 'absolute',
                    bottom: '28px',
                    left: '28px',
                    right: '28px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '11px',
                        letterSpacing: '0.5px'
                    }}>
                        ZenFlow v2.0 • Made with ♥
                    </div>
                </div>
            </div>
        </>
    )
}
