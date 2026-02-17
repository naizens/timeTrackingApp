import { create } from 'zustand'
import type { GermanStateCode, HolidaysForYear, HolidayEntry } from '@renderer/types/store'

interface HolidayState {
  // Keyed by "YYYY-STATE", e.g. "2026-BY"
  holidays: Record<string, HolidaysForYear>
  loadingKeys: Set<string>
  errors: Record<string, string>

  fetchHolidays: (year: number, state: GermanStateCode) => Promise<void>
  getHolidaysForMonth: (yearMonth: string, state: GermanStateCode) => HolidayEntry[]
  getHolidayForDate: (date: string, state: GermanStateCode) => HolidayEntry | undefined
}

export const useHolidayStore = create<HolidayState>((set, get) => ({
  holidays: {},
  loadingKeys: new Set(),
  errors: {},

  fetchHolidays: async (year, state) => {
    const key = `${year}-${state}`
    // Short-circuit if already loaded or loading
    if (get().holidays[key] || get().loadingKeys.has(key)) return

    set((s) => ({ loadingKeys: new Set([...s.loadingKeys, key]) }))
    try {
      const data = await window.api.holidays.get(year, state)
      set((s) => ({
        holidays: { ...s.holidays, [key]: data },
        loadingKeys: new Set([...s.loadingKeys].filter((k) => k !== key))
      }))
    } catch (e) {
      set((s) => ({
        errors: { ...s.errors, [key]: (e as Error).message },
        loadingKeys: new Set([...s.loadingKeys].filter((k) => k !== key))
      }))
    }
  },

  getHolidaysForMonth: (yearMonth, state) => {
    const [year] = yearMonth.split('-')
    const key = `${year}-${state}`
    const data = get().holidays[key]
    if (!data) return []
    return Object.entries(data)
      .filter(([, v]) => v.datum.startsWith(yearMonth))
      .map(([name, v]) => ({ name, date: v.datum, hinweis: v.hinweis }))
  },

  getHolidayForDate: (date, state) => {
    const year = date.split('-')[0]
    const key = `${year}-${state}`
    const data = get().holidays[key]
    if (!data) return undefined
    const found = Object.entries(data).find(([, v]) => v.datum === date)
    if (!found) return undefined
    return { name: found[0], date: found[1].datum, hinweis: found[1].hinweis }
  }
}))
