import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

// FIX 2: GESTURE CONTROL & SETTINGS TAB
export default function GestureSettings() {
    const { colors } = useStore()
    const [enabled, setEnabled] = useState(true)
    const [previewOpen, setPreviewOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Camera Preview Logic
    useEffect(() => {
        let stream: MediaStream | null = null
        if (previewOpen) {
            navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
                .then(s => {
                    stream = s
                    if (videoRef.current) {
                        videoRef.current.srcObject = s
                        videoRef.current.play()
                    }
                })
        }
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop())
        }
    }, [previewOpen])

    return (
        <div style={{ padding: '24px', color: 'white', fontFamily: 'Inter', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontFamily: 'Space Grotesk' }}>Gesture Control</h2>

            {/* Main Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <span style={{ opacity: 0.8 }}>Enable Hand Tracking</span>
                <button
                    onClick={() => setEnabled(!enabled)}
                    style={{
                        padding: '8px 16px',
                        background: enabled ? colors.primary : 'rgba(255,255,255,0.1)',
                        border: 'none', borderRadius: '20px',
                        color: enabled ? 'black' : 'white',
                        fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                >
                    {enabled ? 'ACTIVE' : 'OFF'}
                </button>
            </div>

            {/* Instruction Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                <div className="gesture-card">
                    <div style={{ fontSize: '24px' }}>✋</div>
                    <div style={{ fontWeight: 600 }}>Palm Open</div>
                    <div style={{ opacity: 0.6, fontSize: '12px' }}>Play / Pause</div>
                </div>
                <div className="gesture-card">
                    <div style={{ fontSize: '24px' }}>👉</div>
                    <div style={{ fontWeight: 600 }}>Index Point</div>
                    <div style={{ opacity: 0.6, fontSize: '12px' }}>Volume Control</div>
                </div>
                <div className="gesture-card">
                    <div style={{ fontSize: '24px' }}>👋</div>
                    <div style={{ fontWeight: 600 }}>Swipe</div>
                    <div style={{ opacity: 0.6, fontSize: '12px' }}>Next Track</div>
                </div>
                <div className="gesture-card">
                    <div style={{ fontSize: '24px' }}>✊</div>
                    <div style={{ fontWeight: 600 }}>Fist</div>
                    <div style={{ opacity: 0.6, fontSize: '12px' }}>Mute</div>
                </div>
            </div>

            <style>{`
                .gesture-card {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 12px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
            `}</style>

            {/* Camera Preview Toggle */}
            <button
                onClick={() => setPreviewOpen(!previewOpen)}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', cursor: 'pointer' }}
            >
                {previewOpen ? 'Hide Camera Preview' : 'Show Camera Preview'}
            </button>

            {previewOpen && (
                <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.primary}` }}>
                    <video ref={videoRef} style={{ width: '100%', display: 'block' }} muted playsInline />
                </div>
            )}
        </div>
    )
}
