import { create } from 'zustand'
import { format } from 'date-fns'
import type { WorkDay } from '@renderer/types/store'

interface CalendarState {
  workDays: Record<string, WorkDay> // keyed by ISO date "YYYY-MM-DD"
  currentYearMonth: string // "2026-02"
  isLoading: boolean
  error: string | null

  setCurrentYearMonth: (ym: string) => void
  loadMonth: (yearMonth: string) => Promise<void>
  setDay: (day: WorkDay) => Promise<void>
  deleteDay: (date: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  workDays: {},
  currentYearMonth: format(new Date(), 'yyyy-MM'),
  isLoading: false,
  error: null,

  setCurrentYearMonth: (ym) => set({ currentYearMonth: ym }),

  loadMonth: async (yearMonth) => {
    set({ isLoading: true, error: null })
    try {
      const data = await window.api.calendar.getMonth(yearMonth)
      set((state) => ({
        workDays: { ...state.workDays, ...data },
        isLoading: false
      }))
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  setDay: async (day) => {
    // Optimistic update
    set((state) => ({ workDays: { ...state.workDays, [day.date]: day } }))
    try {
      await window.api.calendar.setDay(day)
    } catch (e) {
      // Revert on failure
      set((state) => {
        const next = { ...state.workDays }
        delete next[day.date]
        return { workDays: next, error: (e as Error).message }
      })
    }
  },

  deleteDay: async (date) => {
    const backup = get().workDays[date]
    set((state) => {
      const next = { ...state.workDays }
      delete next[date]
      return { workDays: next }
    })
    try {
      await window.api.calendar.deleteDay(date)
    } catch (e) {
      if (backup) {
        set((state) => ({ workDays: { ...state.workDays, [date]: backup } }))
      }
      set({ error: (e as Error).message })
    }
  }
}))
