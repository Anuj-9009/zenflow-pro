// Electron Main Process - with Real Media Integration
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

// Run AppleScript and return result
async function runAppleScript(script: string): Promise<string> {
  try {
    // Write script to temp file to avoid escaping issues
    const tempScript = script.replace(/"/g, '\\"')
    const { stdout } = await execAsync(`osascript -e "${tempScript}"`)
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
    // Check if Spotify is running first
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
        const duration = parseFloat(durationResult.stdout.trim()) / 1000 // ms to seconds
        const position = parseFloat(positionResult.stdout.trim())
        const isPlaying = stateResult.stdout.trim() === 'playing'

        console.log('Spotify metadata:', { name, artist, album, artUrl, duration, position, isPlaying })

        return { name, artist, album, artUrl, duration, position, isPlaying }
      } catch (err) {
        console.error('Error getting Spotify metadata:', err)
        return null
      }
    }

    // Check Apple Music
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
          artUrl: null, // Apple Music doesn't easily expose artwork URL
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

// Media control functions
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

async function seekTo(position: number) {
  try {
    await execAsync(`osascript -e 'tell application "Spotify" to set player position to ${position}'`)
    console.log('Seek to:', position)
  } catch {
    try {
      await execAsync(`osascript -e 'tell application "Music" to set player position to ${position}'`)
      console.log('Seek to:', position)
    } catch (err) {
      console.error('Seek error:', err)
    }
  }
}

function createWindow() {
  console.log('Creating window...')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    backgroundColor: '#050510',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading file:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully')
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

ipcMain.handle('media:seek', async (_event, position: number) => {
  await seekTo(position)
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
