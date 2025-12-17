import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

// --- CONFIGURATION ---
const CLIENT_ID = "960d4c9b0aa240cf8b6c3dd41addc0d5";
const REDIRECT_URI = "http://127.0.0.1:8888/callback";

// --- OFFICIAL SPOTIFY ENDPOINTS ---
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const API_ENDPOINT = "https://api.spotify.com/v1/me/tracks";

// --- PKCE HELPERS ---
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

const SpotifyLoader = () => {
    const { setLibraryTracks, setSpotifyToken } = usePlayer();
    const [status, setStatus] = useState("IDLE");

    // 1. Listen for the ACCESS TOKEN from Backend (exchange happens in main process)
    useEffect(() => {
        const electron = (window as any).electron;
        if (electron && electron.window) {
            // Listen for actual token (after backend does the PKCE exchange)
            electron.window.onSpotifyToken((token: string) => {
                console.log("Access Token Received from Backend!");
                loadTracks(token);
            });
        }
    }, []);

    const loadTracks = (token: string) => {
        setStatus("SYNCING...");
        setSpotifyToken(token);
        window.localStorage.setItem("token", token);

        fetch(API_ENDPOINT + "?limit=50", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("API Error: " + res.status);
                return res.json();
            })
            .then(data => {
                const items = data.items || [];
                const cleanTracks = items.map((item: any) => ({
                    id: item.track.id,
                    title: item.track.name,
                    artist: item.track.artists[0].name,
                    image: item.track.album.images[0]?.url || "",
                    url: item.track.preview_url,
                    bpm: 120
                }));
                setLibraryTracks(cleanTracks);
                setStatus("DONE");
            })
            .catch(err => {
                console.error(err);
                setStatus("ERROR: " + err.message);
            });
    };

    const handleLogin = async () => {
        setStatus("PREPARING...");

        // Generate PKCE codes
        const codeVerifier = generateRandomString(64);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);

        // Store verifier in backend (main process) for later exchange
        const electron = (window as any).electron;
        if (electron && electron.window) {
            await electron.window.storeCodeVerifier(codeVerifier);
        }

        const scopes = ["user-library-read"];

        // Build URL with PKCE parameters
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            scope: scopes.join(' '),
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            show_dialog: 'true'
        });

        const url = `${AUTH_ENDPOINT}?${params.toString()}`;

        setStatus("WAITING IN BROWSER...");

        // Open in System Browser
        if (electron && electron.shell) {
            electron.shell.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    };

    if (status === "DONE") return null;

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center">
            <div className="text-center p-10 bg-zinc-900 rounded-2xl border border-zinc-800">
                <h1 className="text-white text-3xl font-bold mb-4">ZenFlow Pro</h1>
                <p className="text-zinc-500 mb-6">{status === "IDLE" ? "Connect to Spotify" : status}</p>

                {status === "IDLE" && (
                    <button onClick={handleLogin} className="px-8 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:scale-105 transition-transform">
                        LOGIN IN BROWSER
                    </button>
                )}

                {(status === "WAITING IN BROWSER..." || status === "SYNCING..." || status === "PREPARING...") && (
                    <div className="text-xs text-zinc-500 animate-pulse">
                        {status}
                    </div>
                )}

                {status.startsWith("ERROR") && (
                    <div className="flex flex-col items-center">
                        <p className="text-red-500 text-sm mb-2">{status}</p>
                        <button onClick={() => setStatus("IDLE")} className="px-4 py-2 bg-zinc-800 rounded text-xs text-white hover:bg-zinc-700">
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpotifyLoader;
