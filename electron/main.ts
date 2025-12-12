// Electron Main Process - with Real Media Integration
import { app, BrowserWindow, ipcMain } from 'electron'
import type { BrowserWindow as BrowserWindowType } from 'electron'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { setupMediaControl } from './media-control'

// FIX: Disable GPU Acceleration to prevent renderer crashes
// app.disableHardwareAcceleration()

// ESM compatibility - define __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)

let mainWindow: BrowserWindowType | null = null

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

  setupMediaControl(mainWindow)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile('dist/index.html')
    // Force Open DevTools for debugging production build
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-fail-load', (_event: any, errorCode: number, errorDescription: string) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully')
    // Enable DevTools to debug
    mainWindow?.webContents.openDevTools()
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

app.whenReady().then(() => {
  console.log('App ready')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
