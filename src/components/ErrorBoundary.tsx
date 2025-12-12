import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    color: '#ff4444',
                    backgroundColor: '#050510',
                    height: '100vh',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                }}>
                    <h1>⚠️ SYSTEM CRASH</h1>
                    <h2 style={{ color: '#fff' }}>{this.state.error?.message}</h2>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', color: '#888' }}>
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#333',
                            border: '1px solid #555',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
