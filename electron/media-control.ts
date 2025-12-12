import { ipcMain } from 'electron'
import { runAppleScript } from 'run-applescript'

// --- MACOS APPLESCRIPT ---
const SCRIPT_GET_TRACK = `
    tell application "System Events"
        set spotifyRunning to (name of processes) contains "Spotify"
        set musicRunning to (name of processes) contains "Music"
    end tell

    if spotifyRunning then
        tell application "Spotify"
            if player state is playing then
                return "Spotify|" & name of current track & "|" & artist of current track & "|" & artwork url of current track
            end if
        end tell
    end if

    if musicRunning then
        tell application "Music"
            if player state is playing then
                return "Music|" & name of current track & "|" & artist of current track & "|missing"
            end if
        end tell
    end if

    return "idle"
`

const SCRIPT_PLAY_PAUSE = `
    tell application "System Events"
        set spotifyRunning to (name of processes) contains "Spotify"
    end tell
    if spotifyRunning then
        tell application "Spotify" to playpause
    else
        tell application "Music" to playpause
    end if
`

const SCRIPT_NEXT = `
    tell application "System Events"
        set spotifyRunning to (name of processes) contains "Spotify"
    end tell
    if spotifyRunning then
        tell application "Spotify" to next track
    else
        tell application "Music" to next track
    end if
`

// --- WINDOWS (STUB / FUTURE) ---
// In a real build, we'd use 'windows-media-controller'
// const { MediaController } = require('windows-media-controller')
// const mediaController = new MediaController()

export function setupMediaControl(mainWindow: Electron.BrowserWindow) {
    // 1. Polling Loop (Every 2s)
    setInterval(async () => {
        try {
            if (process.platform === 'darwin') {
                const result = await runAppleScript(SCRIPT_GET_TRACK)
                if (result && result !== 'idle') {
                    const [source, title, artist, artwork] = result.split('|')
                    mainWindow.webContents.send('media-update', {
                        source, title, artist,
                        artwork: artwork === 'missing' ? null : artwork
                    })
                }
            }
        } catch (e) {
            // console.error("Media Poll Error", e) 
            // Often fails if app is closed, just ignore
        }
    }, 2000)

    // 2. Control Events
    ipcMain.handle('media-control', async (_, action) => {
        if (process.platform === 'darwin') {
            if (action === 'playpause') await runAppleScript(SCRIPT_PLAY_PAUSE)
            if (action === 'next') await runAppleScript(SCRIPT_NEXT)
        }
    })

    // 3. Permission Handler for Loopback
    // Electron requires us to handle 'session.setPermissionRequestHandler' 
    // or just allow display-media access. 
    // In recent Electron, desktopCapturer is used, but for 'getDisplayMedia' 
    // in renderer, it typically prompts the user or we handle the select-source event.
    // For 'System Audio', 
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            // For getDisplayMedia / getUserMedia
            return callback(true)
        }
        callback(false)
    })

    // Also specific for display-media
    mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        // Auto-select the first screen? Or let user choose?
        // Ideally we want "System Audio". 
        // On Mac, getting *just* audio via getDisplayMedia is tricky without user interaction.
        // We'll trust the default picker for now, or auto-approve if possible.
        callback({})
    })
}
