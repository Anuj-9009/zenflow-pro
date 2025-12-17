/**
 * useContextMenu - Right-Click Context Menu Hook
 * 
 * Provides a floating context menu for tracks in the library.
 * - Left Click: Play immediately (Spotify Preview)
 * - Right Click: Show menu with "Load to Deck A/B" options
 */

import { useState, useCallback, useEffect } from 'react';

interface ContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    track: any | null;
}

export function useContextMenu() {
    const [menuState, setMenuState] = useState<ContextMenuState>({
        isOpen: false,
        x: 0,
        y: 0,
        track: null,
    });

    // Open menu at cursor position
    const openMenu = useCallback((e: React.MouseEvent, track: any) => {
        e.preventDefault();
        e.stopPropagation();

        setMenuState({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            track,
        });
    }, []);

    // Close menu
    const closeMenu = useCallback(() => {
        setMenuState({
            isOpen: false,
            x: 0,
            y: 0,
            track: null,
        });
    }, []);

    // Close on click outside or escape
    useEffect(() => {
        if (!menuState.isOpen) return;

        const handleClick = () => closeMenu();
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeMenu();
        };

        // Delay to avoid immediate close
        setTimeout(() => {
            window.addEventListener('click', handleClick);
            window.addEventListener('keydown', handleEscape);
        }, 0);

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [menuState.isOpen, closeMenu]);

    return {
        menuState,
        openMenu,
        closeMenu,
    };
}

// ==================== CONTEXT MENU COMPONENT ====================

interface ContextMenuProps {
    x: number;
    y: number;
    track: any;
    onLoadDeck: (deck: 'A' | 'B', track: any) => void;
    onClose: () => void;
}

export const TrackContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    track,
    onLoadDeck,
    onClose,
}) => {
    const handleLoadA = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLoadDeck('A', track);
        onClose();
    };

    const handleLoadB = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLoadDeck('B', track);
        onClose();
    };

    // Adjust position to stay on screen
    const adjustedX = Math.min(x, window.innerWidth - 180);
    const adjustedY = Math.min(y, window.innerHeight - 100);

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                left: adjustedX,
                top: adjustedY,
                zIndex: 9999,
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 0, 0.3)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '160px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Track Info Header */}
            <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '4px',
            }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track?.title || 'Unknown'}
                </div>
                <div style={{ fontSize: '10px', color: '#888' }}>
                    {track?.artist || 'Unknown Artist'}
                </div>
            </div>

            {/* Menu Options */}
            <button
                onClick={handleLoadA}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFF00',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 0, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span style={{ fontSize: '16px' }}>🅰️</span>
                Load to Deck A
            </button>

            <button
                onClick={handleLoadB}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span style={{ fontSize: '16px' }}>🅱️</span>
                Load to Deck B
            </button>
        </div>
    );
};
