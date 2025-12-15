import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

// --- CONFIGURATION ---
const CLIENT_ID = "960d4c9b0aa240cf8b6c3dd41addc0d5";
const REDIRECT_URI = "http://127.0.0.1:8888/callback";

// --- THE FIX: OFFICIAL SPOTIFY ADDRESSES ---
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const API_ENDPOINT = "https://api.spotify.com/v1/me/tracks"; // Liked Songs

const SpotifyLoader = () => {
    const { setLibraryTracks, setSpotifyToken } = usePlayer();
    const [status, setStatus] = useState("IDLE");

    // 1. Listen for Token from Backend (Your local server)
    useEffect(() => {
        const electron = (window as any).electron;
        // We use the safe 'window.onSpotifyCode' bridge from preload.ts
        // instead of ipcRenderer directly (which is sandbox-blocked)
        if (electron && electron.window) {
            electron.window.onSpotifyCode((token: string) => {
                console.log("Token Received via IPC!");
                loadTracks(token);
            });
        }
    }, []);

    const loadTracks = (token: string) => {
        setStatus("SYNCING...");
        setSpotifyToken(token);
        window.localStorage.setItem("token", token);

        // Fetch User's Liked Songs
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

    const handleLogin = () => {
        setStatus("WAITING IN BROWSER...");
        const scopes = ["user-library-read"];

        // Construct the OFFICIAL Auth URL
        const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&show_dialog=true&scope=${encodeURIComponent(scopes.join(" "))}`;

        // Open in System Browser using Shell (Safest for Desktop)
        const electron = (window as any).electron;
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

                {status === "WAITING IN BROWSER..." && (
                    <div className="text-xs text-zinc-500 animate-pulse">
                        Check your browser window...
                    </div>
                )}

                {status.startsWith("ERROR") && (
                    <button onClick={() => setStatus("IDLE")} className="mt-4 text-xs text-red-500 underline">
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpotifyLoader;
