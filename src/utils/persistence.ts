export interface Persistence {
    loadSettings: () => { visualizerMode?: string }
    saveSettings: (settings: { visualizerMode: string }) => void
    loadHistory: () => HistoryItem[]
    addToHistory: (track: HistoryItem) => HistoryItem[]
}

interface HistoryItem {
    id?: string
    name: string
    artist: string
    artUrl: string | null
    timestamp: number
}

const HISTORY_KEY = 'zenflow:history'
const SETTINGS_KEY = 'zenflow:settings'

export const persistence: Persistence = {
    loadSettings: () => {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY)
            return raw ? JSON.parse(raw) : {}
        } catch { return {} }
    },

    saveSettings: (settings) => {
        try {
            const current = persistence.loadSettings()
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
        } catch { }
    },

    loadHistory: () => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY)
            return raw ? JSON.parse(raw) : []
        } catch { return [] }
    },

    addToHistory: (item: HistoryItem) => {
        try {
            const history = persistence.loadHistory()
            // Dedupe loop? If same track played recently?
            // Simple logic: Add to top, keep last 50
            const newHistory = [item, ...history].slice(0, 50)
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
            return newHistory
        } catch { return [] }
    }
}
