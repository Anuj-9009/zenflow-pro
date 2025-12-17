/**
 * useSpotifyPlayer - Official Spotify Web Playback SDK Hook
 * 
 * This replaces the Tone.js player for Spotify tracks.
 * Provides legal, DRM-compliant audio streaming with full metadata.
 */

import { useState, useEffect, useCallback } from 'react';

// Type definitions for Spotify SDK
declare global {
    interface Window {
        Spotify: any;
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

interface SpotifyTrack {
    name: string;
    uri: string;
    id: string;
    duration_ms: number;
    album: {
        name: string;
        images: { url: string }[];
    };
    artists: { name: string }[];
}

interface SpotifyPlayerState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
        current_track: SpotifyTrack;
    };
}

export const useSpotifyPlayer = (token: string | null) => {
    const [player, setPlayer] = useState<any>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    // Initialize the SDK
    useEffect(() => {
        if (!token) return;

        // Load the SDK script
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log('🎵 Spotify Web Playback SDK Ready');

            const spotifyPlayer = new window.Spotify.Player({
                name: 'ZenFlow DJ Deck',
                getOAuthToken: (cb: (token: string) => void) => {
                    cb(token);
                },
                volume: 0.5,
            });

            // Ready
            spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
                console.log('✅ ZenFlow Device Ready:', device_id);
                setDeviceId(device_id);
                localStorage.setItem('zenflow_device_id', device_id);
            });

            // Not Ready
            spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                console.log('❌ Device Offline:', device_id);
                setIsActive(false);
            });

            // Playback State Changed
            spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
                if (!state) {
                    setIsActive(false);
                    return;
                }

                setCurrentTrack(state.track_window.current_track);
                setIsPaused(state.paused);
                setPosition(state.position);
                setDuration(state.duration);

                spotifyPlayer.getCurrentState().then((currentState: SpotifyPlayerState | null) => {
                    setIsActive(!!currentState);
                });
            });

            // Errors
            spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
                console.error('Init Error:', message);
            });

            spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
                console.error('Auth Error:', message);
            });

            spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
                console.error('Account Error (Premium Required):', message);
            });

            spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => {
                console.error('Playback Error:', message);
            });

            // Connect
            spotifyPlayer.connect().then((success: boolean) => {
                if (success) {
                    console.log('🔗 Connected to Spotify');
                }
            });

            setPlayer(spotifyPlayer);
        };

        return () => {
            if (player) {
                player.disconnect();
            }
        };
    }, [token]);

    // Position polling for smooth progress bar
    useEffect(() => {
        if (!player || isPaused) return;

        const interval = setInterval(() => {
            player.getCurrentState().then((state: SpotifyPlayerState | null) => {
                if (state) {
                    setPosition(state.position);
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [player, isPaused]);

    // Control methods
    const togglePlay = useCallback(() => {
        if (player) {
            player.togglePlay();
        }
    }, [player]);

    const seek = useCallback((positionMs: number) => {
        if (player) {
            player.seek(positionMs);
        }
    }, [player]);

    const setVolume = useCallback((volume: number) => {
        if (player) {
            player.setVolume(volume);
        }
    }, [player]);

    const nextTrack = useCallback(() => {
        if (player) {
            player.nextTrack();
        }
    }, [player]);

    const previousTrack = useCallback(() => {
        if (player) {
            player.previousTrack();
        }
    }, [player]);

    return {
        player,
        deviceId,
        isPaused,
        isActive,
        currentTrack,
        position,
        duration,
        // Controls
        togglePlay,
        seek,
        setVolume,
        nextTrack,
        previousTrack,
    };
};

// ==================== HELPER: Play a Spotify Track ====================

/**
 * Play a Spotify track on the ZenFlow device
 * @param spotifyUri - Spotify URI (e.g., "spotify:track:xxx")
 * @param token - OAuth access token
 */
export const playSpotifyTrack = async (spotifyUri: string, token: string): Promise<boolean> => {
    const deviceId = localStorage.getItem('zenflow_device_id');

    if (!deviceId) {
        console.error('❌ ZenFlow Device not ready! Wait for SDK to initialize.');
        return false;
    }

    if (!spotifyUri) {
        console.error('❌ No Spotify URI provided');
        return false;
    }

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ uris: [spotifyUri] }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.ok || response.status === 204) {
            console.log('▶️ Now Playing:', spotifyUri);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Playback Error:', error);
            return false;
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
        return false;
    }
};

/**
 * Transfer playback to ZenFlow device
 */
export const transferPlayback = async (token: string): Promise<boolean> => {
    const deviceId = localStorage.getItem('zenflow_device_id');

    if (!deviceId) {
        console.error('❌ ZenFlow Device not ready!');
        return false;
    }

    try {
        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            body: JSON.stringify({ device_ids: [deviceId], play: false }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        console.log('🔄 Playback transferred to ZenFlow');
        return true;
    } catch (error) {
        console.error('❌ Transfer Error:', error);
        return false;
    }
};
