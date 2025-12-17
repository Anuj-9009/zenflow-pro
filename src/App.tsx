import React from 'react';
import { PlayerProvider } from './context/PlayerContext';
import SpotifyLoader from './components/SpotifyLoader';
import ZenFlowLayout from './components/ZenFlowLayout';
import { useAudioUnlock } from './hooks/useAudioUnlock';

// --- THE ERROR TRAP (Stops White Screen) ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("CRASH CAUGHT:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, background: '#18181b', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h1 style={{ color: '#ef4444', fontSize: 32, fontWeight: 'bold' }}>APP CRASHED</h1>
                    <p style={{ color: '#a1a1aa', marginBottom: 20 }}>The app encountered a fatal error.</p>
                    <div style={{ background: '#000', padding: 20, borderRadius: 8, fontFamily: 'monospace', maxWidth: '800px', overflow: 'auto' }}>
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <button
                        onClick={() => { window.localStorage.clear(); window.location.reload(); }}
                        style={{ marginTop: 20, padding: '12px 24px', background: '#fff', color: '#000', border: 'none', borderRadius: 99, fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        HARD RESET APP
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- APP WRAPPER WITH AUDIO UNLOCK ---
const AppContent = () => {
    // Priority Alpha: Unlock audio on first user interaction
    useAudioUnlock();

    return (
        <>
            <SpotifyLoader />
            <ZenFlowLayout />
        </>
    );
};

// --- THE MAIN APP ---
const App = () => {
    return (
        <ErrorBoundary>
            <PlayerProvider>
                <AppContent />
            </PlayerProvider>
        </ErrorBoundary>
    );
};

export default App;
