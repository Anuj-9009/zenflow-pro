import React, { useState, useEffect } from 'react';

const LOG_STYLES = {
    position: 'fixed' as const,
    bottom: '0',
    left: '0',
    width: '100%',
    height: '200px',
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: '#00fa9a',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '10px',
    zIndex: 9999999,
    overflowY: 'auto' as const,
    pointerEvents: 'none' as const, // Let clicks pass through
    borderTop: '1px solid #333'
};

export const VisualConsole = () => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Hook into console
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addLog = (type: string, args: any[]) => {
            try {
                const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
                setLogs(prev => [`[${type}] ${msg}`, ...prev].slice(0, 50));
            } catch (e) {
                // ignore circular ref errors
            }
        };

        console.log = (...args) => { addLog('LOG', args); originalLog(...args); };
        console.error = (...args) => { addLog('ERR', args); originalError(...args); };
        console.warn = (...args) => { addLog('WRN', args); originalWarn(...args); };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return (
        <div style={LOG_STYLES}>
            <div style={{ fontWeight: 'bold', color: 'white', marginBottom: 5 }}>VISUAL DEBUG CONSOLE v1.0</div>
            {logs.map((log, i) => (
                <div key={i} style={{
                    color: log.startsWith('[ERR]') ? '#ff4444' : log.startsWith('[WRN]') ? '#ffcc00' : '#00fa9a',
                    borderBottom: '1px solid #111'
                }}>
                    {log}
                </div>
            ))}
        </div>
    );
};
