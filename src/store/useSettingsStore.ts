import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    themeMode: 'dark' | 'light' | 'dynamic'
    audioQuality: 'high' | 'low'
    gestureEnabled: boolean
    crossfadeCurve: 'linear' | 'exponential'

    // Actions
    setThemeMode: (mode: 'dark' | 'light' | 'dynamic') => void
    setAudioQuality: (quality: 'high' | 'low') => void
    toggleGestures: () => void
    setCrossfadeCurve: (curve: 'linear' | 'exponential') => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            themeMode: 'dark',
            audioQuality: 'high',
            gestureEnabled: true,
            crossfadeCurve: 'linear',

            setThemeMode: (mode) => set({ themeMode: mode }),
            setAudioQuality: (quality) => set({ audioQuality: quality }),
            toggleGestures: () => set((state) => ({ gestureEnabled: !state.gestureEnabled })),
            setCrossfadeCurve: (curve) => set({ crossfadeCurve: curve }),
        }),
        {
            name: 'zenflow-settings', // unique name
        }
    )
)
