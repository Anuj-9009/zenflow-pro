export const SPOTIFY_CLIENT_ID = '960d4c9b0aa240cf8b6c3dd41addc0d5'
export const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-playback-state',
]

// Detect environment
const IS_ELECTRON = !!(window as any).electron
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Use deep link in production, localhost in dev
const REDIRECT_URI = (IS_ELECTRON && !IS_DEV)
    ? 'zenflow://callback'
    : 'http://127.0.0.1:5173/'

console.log('[SpotifyBridge] Environment:', { IS_ELECTRON, IS_DEV, REDIRECT_URI })

// PKCE Helper Functions
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let text = ''
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return crypto.subtle.digest('SHA-256', data)
}

function base64urlencode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const hashed = await sha256(verifier)
    return base64urlencode(hashed)
}

class SpotifyBridgeService {
    token: string | null = null
    deviceId: string | null = null
    private listenerRegistered = false
    private codeVerifier: string | null = null

    constructor() {
        this.token = localStorage.getItem('spotify_token')
        this.codeVerifier = localStorage.getItem('spotify_code_verifier')
        this.registerTokenListeners()
    }

    private registerTokenListeners() {
        if (this.listenerRegistered) return
        this.listenerRegistered = true

        // Listen for authorization code from Electron main process (deep link)
        if ((window as any).electron?.window?.onSpotifyCode) {
            console.log('[SpotifyBridge] Registering IPC listener for auth code...')
                ; (window as any).electron.window.onSpotifyCode(async (code: string) => {
                    console.log('[SpotifyBridge] Auth code received via IPC!')
                    await this.exchangeCodeForToken(code)
                })
        }

        // Listen for postMessage (fallback for dev mode)
        window.addEventListener('message', async (event) => {
            if (event.data?.type === 'spotify-token' && event.data?.token) {
                console.log('[SpotifyBridge] Token received via postMessage!')
                this.handleToken(event.data.token)
            }
            if (event.data?.type === 'spotify-code' && event.data?.code) {
                console.log('[SpotifyBridge] Code received via postMessage!')
                await this.exchangeCodeForToken(event.data.code)
            }
        })

        console.log('[SpotifyBridge] Token listeners ready')
    }

    async login() {
        // Generate PKCE code verifier and challenge
        this.codeVerifier = generateRandomString(128)
        localStorage.setItem('spotify_code_verifier', this.codeVerifier)

        const codeChallenge = await generateCodeChallenge(this.codeVerifier)

        // Use Authorization Code flow with PKCE (uses ?code= query param, not #access_token fragment!)
        const params = new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            response_type: 'code',  // Authorization code, not token!
            redirect_uri: REDIRECT_URI,
            scope: SCOPES.join(' '),
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
        })

        const url = `https://accounts.spotify.com/authorize?${params.toString()}`

        console.log('[SpotifyBridge] login() with PKCE flow')
        console.log('[SpotifyBridge] Redirect URI:', REDIRECT_URI)

        // Open in external browser for deep link to work
        const shell = (window as any).electron?.shell
        if (shell?.openExternal) {
            console.log('[SpotifyBridge] Using shell.openExternal')
            await shell.openExternal(url)
        } else {
            console.log('[SpotifyBridge] Using window.open')
            window.open(url, 'Spotify Login', 'width=500,height=800')
        }
    }

    async exchangeCodeForToken(code: string) {
        console.log('[SpotifyBridge] Exchanging code for token...')

        const codeVerifier = this.codeVerifier || localStorage.getItem('spotify_code_verifier')
        if (!codeVerifier) {
            console.error('[SpotifyBridge] No code verifier found!')
            return
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: SPOTIFY_CLIENT_ID,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier,
                }).toString(),
            })

            const data = await response.json()
            console.log('[SpotifyBridge] Token response:', data)

            if (data.access_token) {
                this.handleToken(data.access_token)
                // Clear the verifier
                localStorage.removeItem('spotify_code_verifier')
            } else {
                console.error('[SpotifyBridge] Token exchange failed:', data)
            }
        } catch (err) {
            console.error('[SpotifyBridge] Token exchange error:', err)
        }
    }

    handleToken(token: string) {
        if (token) {
            console.log('[SpotifyBridge] Saving token...')
            this.token = token
            localStorage.setItem('spotify_token', token)
            window.location.reload()
        }
    }

    handleCallback() {
        // Check for code in query string (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        if (code) {
            this.exchangeCodeForToken(code)
            window.history.replaceState({}, document.title, window.location.pathname)
            return true
        }

        // Legacy: Check for token in hash (implicit flow)
        const hash = window.location.hash
        if (hash) {
            const params = new URLSearchParams(hash.substring(1))
            const token = params.get('access_token')
            if (token) {
                this.handleToken(token)
                window.location.hash = ''
                return true
            }
        }
        return false
    }

    isLoggedIn() {
        return !!this.token
    }

    logout() {
        this.token = null
        localStorage.removeItem('spotify_token')
        localStorage.removeItem('spotify_code_verifier')
        window.location.reload()
    }

    async search(query: string) {
        if (!this.token) return []
        try {
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                headers: { Authorization: `Bearer ${this.token}` }
            })
            if (res.status === 401) {
                this.logout()
                return []
            }
            const data = await res.json()
            return data.tracks?.items || []
        } catch (e) {
            return []
        }
    }

    async play(uri?: string) {
        if (!this.token) return
        const body: any = {}
        if (uri) body.uris = [uri]
        await fetch(`https://api.spotify.com/v1/me/player/play`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${this.token}` },
            body: JSON.stringify(body)
        })
    }

    async pause() {
        if (!this.token) return
        await fetch(`https://api.spotify.com/v1/me/player/pause`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${this.token}` }
        })
    }

    async seek(positionMs: number) {
        if (!this.token) return
        await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${this.token}` }
        })
    }

    async getNowPlaying() {
        if (!this.token) return null
        try {
            const res = await fetch(`https://api.spotify.com/v1/me/player/currently-playing`, {
                headers: { Authorization: `Bearer ${this.token}` }
            })
            if (res.status === 204) return null
            if (res.status === 401) {
                this.logout()
                return null
            }
            return await res.json()
        } catch (e) {
            return null
        }
    }

    async getAudioFeatures(id: string) {
        if (!this.token) return null
        const res = await fetch(`https://api.spotify.com/v1/audio-features/${id}`, {
            headers: { Authorization: `Bearer ${this.token}` }
        })
        return await res.json()
    }

    async skipToNext() {
        if (!this.token) return
        await fetch(`https://api.spotify.com/v1/me/player/next`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.token}` }
        })
    }
}

export const SpotifyBridge = new SpotifyBridgeService()
