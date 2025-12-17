// Electron Main Process - with Real Media Integration
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import type { BrowserWindow as BrowserWindowType } from 'electron'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import http from 'http'
import { setupMediaControl } from './media-control'

// FIX: Disable GPU Acceleration to prevent renderer crashes
// app.disableHardwareAcceleration()

// ESM compatibility - define __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)

let mainWindow: BrowserWindowType | null = null
let callbackServer: http.Server | null = null

// Store code verifier for PKCE exchange
let storedCodeVerifier: string | null = null

// Start a specific HTTP server for the Loopback Auth Flow (PKCE)
function startAuthServer() {
  if (callbackServer) return // Already running

  callbackServer = http.createServer(async (req, res) => {
    // Parse URL to get query parameters
    const q = new URL(req.url || '', 'http://127.0.0.1:8888')

    // 1. Handle the callback from Spotify
    if (q.pathname === '/callback') {
      // PKCE flow: code comes in query params (?code=xxx), not hash
      const code = q.searchParams.get('code')
      const error = q.searchParams.get('error')

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(`
          <html>
            <body style="background-color: #121212; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
              <h1 style="color: #ff5555;">Login Failed</h1>
              <p>Spotify Error Code: <strong>${error}</strong></p>
              <p style="color: #888;">Tip: If 'access_denied', add your email to Spotify Dashboard -> Users Management</p>
            </body>
          </html>
        `)
      } else if (code && storedCodeVerifier) {
        console.log('[Auth Server] Authorization code received! Exchanging for token...')

        // Exchange code for token in main process (no CORS issues)
        try {
          const token = await exchangeCodeForToken(code, storedCodeVerifier)
          storedCodeVerifier = null // Clear after use

          if (token && mainWindow) {
            mainWindow.webContents.send('spotify-token', token) // Send actual token
            mainWindow.focus()
          }

          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <html>
              <body style="background-color: #121212; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: #1db954;">Success!</h1>
                <p>Login complete. You can close this window.</p>
                <script>setTimeout(() => window.close(), 1500);</script>
              </body>
            </html>
          `)
        } catch (err: any) {
          console.error('[Auth Server] Token exchange failed:', err)
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <html>
              <body style="background-color: #121212; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: #ff5555;">Token Exchange Failed</h1>
                <p>${err.message}</p>
              </body>
            </html>
          `)
        }
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(`
          <html>
            <body style="background-color: #121212; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
              <h1 style="color: #ff5555;">Unknown State</h1>
              <p>No code or verifier found. Please try logging in again.</p>
            </body>
          </html>
        `)
      }
    }
  })

  callbackServer.listen(8888, '127.0.0.1', () => {
    console.log('[Auth Server] Listening on http://127.0.0.1:8888')
  })

  callbackServer.on('error', (err: any) => {
    console.error('[Auth Server] Error:', err)
  })
}

// Exchange authorization code for access token (runs in Node.js - no CORS)
async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<string> {
  const CLIENT_ID = "960d4c9b0aa240cf8b6c3dd41addc0d5"
  const REDIRECT_URI = "http://127.0.0.1:8888/callback"
  const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  })

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await response.json() as any

  if (data.access_token) {
    console.log('[Auth Server] Token obtained successfully!')
    return data.access_token
  } else {
    throw new Error(data.error_description || data.error || 'Token exchange failed')
  }
}

// IPC handler to store code verifier before auth
ipcMain.handle('store-code-verifier', (_event, verifier: string) => {
  storedCodeVerifier = verifier
  console.log('[IPC] Code verifier stored')
  return true
})

// ======================
// DEEP LINK HANDLING (zenflow://)
// ======================

let pendingDeepLink: string | null = null

// Handle zenflow://callback#access_token=XXX
function handleDeepLink(url: string) {
  console.log('[Deep Link] Received:', url)

  // If window not ready, queue the link for later
  if (!mainWindow) {
    console.log('[Deep Link] Window not ready, queuing...')
    pendingDeepLink = url
    return
  }

  try {
    let token = ''

    // Check hash fragment (implicit grant flow: #access_token=XXX)
    const hashIndex = url.indexOf('#')
    if (hashIndex !== -1) {
      const hash = url.substring(hashIndex + 1)
      const params = new URLSearchParams(hash)
      token = params.get('access_token') || ''
      console.log('[Deep Link] Parsed from hash, token exists:', !!token)
    }

    // Fallback to query string
    if (!token) {
      const queryIndex = url.indexOf('?')
      if (queryIndex !== -1) {
        const query = url.substring(queryIndex + 1)
        const params = new URLSearchParams(query)
        token = params.get('access_token') || params.get('code') || ''
        console.log('[Deep Link] Parsed from query, token exists:', !!token)
      }
    }

    if (token) {
      console.log('[Deep Link] Sending token to renderer (length:', token.length, ')')
      mainWindow.webContents.send('spotify-code', token)
      mainWindow.focus()
    } else {
      console.log('[Deep Link] No token found in URL:', url)
    }
  } catch (err) {
    console.error('[Deep Link] Parse error:', err)
  }
}

// Process any pending deep link after window is ready
function processPendingDeepLink() {
  if (pendingDeepLink) {
    console.log('[Deep Link] Processing queued link...')
    const url = pendingDeepLink
    pendingDeepLink = null
    handleDeepLink(url)
  }
}

// Force Single Instance - Required for deep links to work
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  console.log('[App] Another instance running, quitting...')
  app.quit()
} else {
  // Handle Windows/Linux deep links (second instance)
  app.on('second-instance', (_event, commandLine) => {
    console.log('[App] Second instance detected, checking for deep link...')
    const url = commandLine.find(arg => arg.startsWith('zenflow://'))
    if (url) {
      handleDeepLink(url)
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Handle macOS deep links (open-url event)
app.on('open-url', (event, url) => {
  console.log('[App] open-url event:', url)
  event.preventDefault()
  if (url.startsWith('zenflow://')) {
    handleDeepLink(url)
  }
})

// Set as default protocol handler (development)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('zenflow', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('zenflow')
}

// Run AppleScript and return result
async function runAppleScript(script: string): Promise<string> {
  try {
    const tempScript = script.replace(/"/g, '\\"')
    const { stdout } = await execAsync(`osascript - e "${tempScript}"`)
    console.log('AppleScript result:', stdout.trim())
    return stdout.trim()
  } catch (err) {
    console.error('AppleScript error:', err)
    return ''
  }
}

// Get metadata from Spotify or Apple Music
async function getMediaMetadata() {
  try {
    const spotifyCheck = await execAsync('osascript -e \'application "Spotify" is running\'')
    const spotifyRunning = spotifyCheck.stdout.trim() === 'true'

    if (spotifyRunning) {
      try {
        const nameResult = await execAsync('osascript -e \'tell application "Spotify" to name of current track\'')
        const artistResult = await execAsync('osascript -e \'tell application "Spotify" to artist of current track\'')
        const albumResult = await execAsync('osascript -e \'tell application "Spotify" to album of current track\'')
        const artResult = await execAsync('osascript -e \'tell application "Spotify" to artwork url of current track\'')
        const durationResult = await execAsync('osascript -e \'tell application "Spotify" to duration of current track\'')
        const positionResult = await execAsync('osascript -e \'tell application "Spotify" to player position\'')
        const stateResult = await execAsync('osascript -e \'tell application "Spotify" to player state\'')

        const name = nameResult.stdout.trim()
        const artist = artistResult.stdout.trim()
        const album = albumResult.stdout.trim()
        const artUrl = artResult.stdout.trim()
        const duration = parseFloat(durationResult.stdout.trim()) / 1000
        const position = parseFloat(positionResult.stdout.trim())
        const isPlaying = stateResult.stdout.trim() === 'playing'

        console.log('Spotify metadata:', { name, artist, album, artUrl, duration, position, isPlaying })
        return { name, artist, album, artUrl, duration, position, isPlaying }
      } catch (err) {
        console.error('Error getting Spotify metadata:', err)
        return null
      }
    }

    const musicCheck = await execAsync('osascript -e \'application "Music" is running\'')
    const musicRunning = musicCheck.stdout.trim() === 'true'

    if (musicRunning) {
      try {
        const nameResult = await execAsync('osascript -e \'tell application "Music" to name of current track\'')
        const artistResult = await execAsync('osascript -e \'tell application "Music" to artist of current track\'')
        const albumResult = await execAsync('osascript -e \'tell application "Music" to album of current track\'')
        const durationResult = await execAsync('osascript -e \'tell application "Music" to duration of current track\'')
        const positionResult = await execAsync('osascript -e \'tell application "Music" to player position\'')
        const stateResult = await execAsync('osascript -e \'tell application "Music" to player state\'')

        return {
          name: nameResult.stdout.trim(),
          artist: artistResult.stdout.trim(),
          album: albumResult.stdout.trim(),
          artUrl: null,
          duration: parseFloat(durationResult.stdout.trim()),
          position: parseFloat(positionResult.stdout.trim()),
          isPlaying: stateResult.stdout.trim() === 'playing'
        }
      } catch (err) {
        console.error('Error getting Music metadata:', err)
        return null
      }
    }

    return null
  } catch (err) {
    console.error('Media check error:', err)
    return null
  }
}

async function mediaPlayPause() {
  try {
    await execAsync('osascript -e \'tell application "Spotify" to playpause\'')
  } catch {
    try {
      await execAsync('osascript -e \'tell application "Music" to playpause\'')
    } catch (err) {
      console.error('PlayPause error:', err)
    }
  }
}

async function mediaNext() {
  try {
    await execAsync('osascript -e \'tell application "Spotify" to next track\'')
  } catch {
    try {
      await execAsync('osascript -e \'tell application "Music" to next track\'')
    } catch (err) {
      console.error('Next error:', err)
    }
  }
}

async function mediaPrevious() {
  try {
    await execAsync('osascript -e \'tell application "Spotify" to previous track\'')
  } catch {
    try {
      await execAsync('osascript -e \'tell application "Music" to previous track\'')
    } catch (err) {
      console.error('Previous error:', err)
    }
  }
}

// NOTE: Spotify AppleScript doesn't support fetching library/history directly.
// We will implement a local history in the renderer or just handle basic 'current context'.
// However, Apple Music DOES support getting playlists.
async function getPlaylists() {
  try {
    const script = `
            tell application "Music"
                set output to ""
                repeat with p in user playlists
                    set output to output & name of p & "|||" & id of p & ":::"
                end repeat
return output
            end tell
        `
    const { stdout } = await execAsync(`osascript - e '${script}'`)
    return stdout.split(':::').filter(Boolean).map(s => {
      const [name, id] = s.split('|||')
      return { name, id: id, art: null }
    })
  } catch (e) {
    return []
  }
}

async function volumeUp() {
  try {
    await execAsync('osascript -e \'set volume output volume ((output volume of (get volume settings)) + 10)\'')
    console.log('Volume up')
  } catch (err) {
    console.error('Volume up error:', err)
  }
}

async function volumeDown() {
  try {
    await execAsync('osascript -e \'set volume output volume ((output volume of (get volume settings)) - 10)\'')
    console.log('Volume down')
  } catch (err) {
    console.error('Volume down error:', err)
  }
}

async function setVolume(level: number) {
  try {
    // Clamp between 0 and 100
    const vol = Math.max(0, Math.min(100, level))
    await execAsync(`osascript - e 'set volume output volume ${vol}'`)
    console.log('Volume set to:', vol)
  } catch (err) {
    console.error('Set volume error:', err)
  }
}

async function getVolume(): Promise<number> {
  try {
    const { stdout } = await execAsync('osascript -e \'output volume of (get volume settings)\'')
    return parseInt(stdout.trim()) || 50
  } catch (err) {
    console.error('Get volume error:', err)
    return 50
  }
}

async function seekTo(position: number) {
  try {
    await execAsync(`osascript - e 'tell application "Spotify" to set player position to ${position}'`)
    console.log('Seek to:', position)
  } catch {
    try {
      await execAsync(`osascript - e 'tell application "Music" to set player position to ${position}'`)
      console.log('Seek to:', position)
    } catch (err) {
      console.error('Seek error:', err)
    }
  }
}

function createWindow() {
  console.log('Creating window...')
  console.log('app.isPackaged:', app.isPackaged)
  console.log('__dirname:', __dirname)

  // FIX: Correct preload path for both dev and production
  const preloadPath = app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, 'preload.js')

  console.log('Preload path:', preloadPath)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for custom look
    titleBarStyle: 'hidden', // Native traffic lights overlay
    trafficLightPosition: { x: 16, y: 16 }, // Padding for traffic lights
    backgroundColor: '#050510',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false // Prevent background suspension
    }
  })

  // ============ CSP HEADERS FOR MEDIA STREAMING ============
  // Allow YouTube/Google audio streams for Mirror Engine
  const ses = mainWindow.webContents.session
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "media-src 'self' https://*.googlevideo.com https://*.youtube.com https://*.ytimg.com blob: data:; " +
          "img-src 'self' https://*.spotify.com https://*.scdn.co https://*.ytimg.com data: blob:; " +
          "connect-src 'self' https://api.spotify.com https://*.googlevideo.com https://*.youtube.com wss: ws:;"
        ]
      }
    })
  })

  setupMediaControl(mainWindow)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // Production: Load from bundled dist
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading production file:', indexPath)
    mainWindow.loadFile(indexPath)
    // DEBUG: Open DevTools in production for user debugging
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-fail-load', (_event: any, errorCode: number, errorDescription: string) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully')
    // Process any deep link that arrived before window was ready
    processPendingDeepLink()
  })

  // Performance: Notify renderer about focus state for background throttling
  mainWindow.on('blur', () => {
    console.log('[Performance] Window blurred - throttling visuals')
    mainWindow?.webContents.send('app-focus-change', false)
  })

  mainWindow.on('focus', () => {
    console.log('[Performance] Window focused - resuming visuals')
    mainWindow?.webContents.send('app-focus-change', true)
  })

  // FIX: Spotify OAuth Popup Handler
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Popup requested:', url)
    // Allow Spotify auth to open
    if (url.startsWith('https://accounts.spotify.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 800,
          autoHideMenuBar: true,
        }
      }
    }
    // Block others (or handle as external links)
    return { action: 'deny' }
  })

  // Watch for the popup to navigate to the callback
  mainWindow.webContents.on('did-create-window', (popupWindow) => {
    let tokenSent = false

    const handleUrl = (url: string) => {
      if (tokenSent) return // Prevent duplicate sends
      console.log('Popup URL Check:', url)

      // Check for token in URL (hash fragment for implicit grant)
      if (url.includes('access_token=') || url.includes('#access_token') || url.includes('127.0.0.1') || url.includes('localhost')) {
        const hashIndex = url.indexOf('#')
        const queryIndex = url.indexOf('?')

        let tokenOrCode = ''

        // Try hash first (implicit grant flow)
        if (hashIndex !== -1) {
          const hash = url.substring(hashIndex + 1)
          const params = new URLSearchParams(hash)
          tokenOrCode = params.get('access_token') || ''
        }

        // Fallback to query params (authorization code flow)
        if (!tokenOrCode && queryIndex !== -1) {
          const search = url.substring(queryIndex + 1)
          const params = new URLSearchParams(search)
          tokenOrCode = params.get('code') || params.get('access_token') || ''
        }

        if (tokenOrCode) {
          console.log('Spotify Token Found!', tokenOrCode.substring(0, 20) + '...')
          tokenSent = true
          mainWindow?.webContents.send('spotify-code', tokenOrCode)
          // popupWindow.close() // DISABLE AUTO-CLOSE per user request (Manual Copy)
        } else if (url.includes('127.0.0.1') || url.includes('localhost')) {
          // Redirect happened but no token - close popup anyway to avoid blank screen
          console.log('Redirect detected but no token, keeping open for manual copy')
          // popupWindow.close() // DISABLE AUTO-CLOSE per user request (Manual Copy)
        }
      }
    }

    // Check URL on navigation start
    popupWindow.webContents.on('will-navigate', (_event, url) => {
      handleUrl(url)
    })

    // Check URL after navigation completes (catches hash-based redirects)
    popupWindow.webContents.on('did-navigate', (_event, url) => {
      handleUrl(url)
    })

    // Check URL on in-page navigation (SPA-style hash changes)
    popupWindow.webContents.on('did-navigate-in-page', (_event, url) => {
      handleUrl(url)
    })

    // CRITICAL: Catch failed loads (localhost not running in production)
    popupWindow.webContents.on('did-fail-load', (_event, _errorCode, _errorDescription, validatedURL) => {
      console.log('Popup failed load:', validatedURL)
      handleUrl(validatedURL)
    })

    // Also check on redirect
    popupWindow.webContents.on('did-redirect-navigation', (_event, url) => {
      handleUrl(url)
    })
  })
}

// IPC Handlers
ipcMain.handle('media:getMetadata', async () => {
  return await getMediaMetadata()
})

ipcMain.handle('media:playPause', async () => {
  await mediaPlayPause()
})

ipcMain.handle('media:next', async () => {
  await mediaNext()
})

ipcMain.handle('media:previous', async () => {
  await mediaPrevious()
})

ipcMain.handle('media:volumeUp', async () => {
  await volumeUp()
})

ipcMain.handle('media:volumeDown', async () => {
  await volumeDown()
})

ipcMain.handle('media:seek', async (_event: any, position: number) => {
  await seekTo(position)
})

ipcMain.handle('media:setVolume', async (_event: any, level: number) => {
  await setVolume(level)
})

ipcMain.handle('media:getVolume', async () => {
  return await getVolume()
})

ipcMain.handle('media:getPlaylists', async () => {
  return await getPlaylists()
})

// ============ STREAM MIRROR ENGINE ============
// Resolves Spotify tracks to playable audio URLs via YouTube
// This enables EQ, Filter, and Visuals on Spotify tracks

ipcMain.handle('resolve-audio', async (_event: any, query: string) => {
  console.log('[Mirror Engine] Resolving audio for:', query)

  try {
    // Dynamic import for ESM compatibility
    const yts = await import('yt-search')
    const ytdl = await import('ytdl-core')

    // 1. Search for the most accurate match on YouTube
    const searchResult = await yts.default(query + ' audio')

    if (!searchResult.videos || searchResult.videos.length === 0) {
      console.error('[Mirror Engine] No videos found for:', query)
      return { success: false, error: 'No results found' }
    }

    const video = searchResult.videos[0]
    console.log('[Mirror Engine] Found:', video.title, '-', video.url)

    // 2. Extract the direct audio stream URL
    const info = await ytdl.default.getInfo(video.url)
    const audioFormat = ytdl.default.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly'
    })

    if (!audioFormat || !audioFormat.url) {
      console.error('[Mirror Engine] No audio format found')
      return { success: false, error: 'No audio format available' }
    }

    console.log('[Mirror Engine] Audio URL extracted, duration:', info.videoDetails.lengthSeconds)

    return {
      success: true,
      url: audioFormat.url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      title: video.title,
      thumbnail: video.thumbnail
    }
  } catch (error: any) {
    console.error('[Mirror Engine] Error:', error.message)
    return { success: false, error: error.message }
  }
})

// Shell operations - for opening external URLs (Spotify OAuth)
ipcMain.handle('shell:openExternal', async (_event: any, url: string) => {
  console.log('[Main] shell:openExternal called with:', url)
  return await shell.openExternal(url)
})

app.whenReady().then(() => {
  console.log('App ready')
  startAuthServer() // Start OAuth callback server
  createWindow()
  createWidgetWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

let widgetWindow: BrowserWindowType | null = null

function createWidgetWindow() {
  // Shared Preload
  const preloadPath = app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, 'preload.js')

  widgetWindow = new BrowserWindow({
    width: 60, height: 60, // Start as Orb
    minWidth: 60, minHeight: 60,
    maxWidth: 300, maxHeight: 120,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: true, // Allow resizing via API
    hasShadow: false,
    skipTaskbar: true,
    show: false, // Hidden by default
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    widgetWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/widget`)
  } else {
    widgetWindow.loadFile('dist/index.html', { hash: 'widget' })
  }

  // widgetWindow.webContents.openDevTools({ mode: 'detach' }) // Debug Widget
}

// Widget IPC
ipcMain.handle('window:toggleMiniPlayer', async (_event, show) => {
  if (!widgetWindow) createWidgetWindow()
  if (show) {
    widgetWindow?.show()
    mainWindow?.hide()
  } else {
    widgetWindow?.hide()
    mainWindow?.show()
  }
})

ipcMain.handle('window:resizeWidget', async (_event, { width, height }) => {
  if (widgetWindow) {
    widgetWindow.setSize(width, height, true) // animate if possible
  }
})

ipcMain.handle('window:sendSyncState', async (_event, state) => {
  if (widgetWindow) {
    widgetWindow.webContents.send('sync-state', state)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
