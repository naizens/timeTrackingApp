import { create } from 'zustand'
import type { AppSettings } from '@renderer/types/store'

interface SettingsState {
  settings: AppSettings
  isLoading: boolean
  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
}

const DEFAULTS: AppSettings = {
  germanState: 'BY',
  workHoursPerDay: 8,
  theme: 'light'
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULTS,
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    try {
      const settings = await window.api.settings.get()
      set({ settings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  update: async (partial) => {
    // Optimistic update
    set((state) => ({ settings: { ...state.settings, ...partial } }))
    try {
      const updated = await window.api.settings.set(partial)
      set({ settings: updated })
    } catch (e) {
      console.error('Settings update failed:', e)
    }
  }
}))
