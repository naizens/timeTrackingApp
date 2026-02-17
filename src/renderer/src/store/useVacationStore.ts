import { create } from 'zustand'
import type { VacationEntry, SickEntry, VacationBudget } from '@renderer/types/store'

interface VacationState {
  vacationEntries: VacationEntry[]
  sickEntries: SickEntry[]
  budgets: VacationBudget[]
  isLoading: boolean
  error: string | null

  loadAll: () => Promise<void>

  // Vacation
  addVacation: (entry: Omit<VacationEntry, 'id'>) => Promise<void>
  updateVacation: (entry: VacationEntry) => Promise<void>
  deleteVacation: (id: string) => Promise<void>

  // Sick
  addSick: (entry: Omit<SickEntry, 'id'>) => Promise<void>
  updateSick: (entry: SickEntry) => Promise<void>
  deleteSick: (id: string) => Promise<void>

  // Budget
  setBudget: (budget: VacationBudget) => Promise<void>
  getBudgetForYear: (year: number) => number
}

export const useVacationStore = create<VacationState>((set, get) => ({
  vacationEntries: [],
  sickEntries: [],
  budgets: [],
  isLoading: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const [vacationEntries, sickEntries, budgets] = await Promise.all([
        window.api.vacation.getAll(),
        window.api.sick.getAll(),
        window.api.budget.getAll()
      ])
      set({ vacationEntries, sickEntries, budgets, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  addVacation: async (entry) => {
    const tempId = `temp-${Date.now()}`
    const tempEntry: VacationEntry = { ...entry, id: tempId }
    set((s) => ({ vacationEntries: [...s.vacationEntries, tempEntry] }))
    try {
      const newEntry = await window.api.vacation.add(entry)
      set((s) => ({
        vacationEntries: s.vacationEntries.map((e) => (e.id === tempId ? newEntry : e))
      }))
    } catch {
      set((s) => ({ vacationEntries: s.vacationEntries.filter((e) => e.id !== tempId) }))
    }
  },

  updateVacation: async (entry) => {
    const updated = await window.api.vacation.update(entry)
    set((s) => ({
      vacationEntries: s.vacationEntries.map((e) => (e.id === entry.id ? updated : e))
    }))
  },

  deleteVacation: async (id) => {
    set((s) => ({ vacationEntries: s.vacationEntries.filter((e) => e.id !== id) }))
    await window.api.vacation.delete(id)
  },

  addSick: async (entry) => {
    const tempId = `temp-${Date.now()}`
    const tempEntry: SickEntry = { ...entry, id: tempId }
    set((s) => ({ sickEntries: [...s.sickEntries, tempEntry] }))
    try {
      const newEntry = await window.api.sick.add(entry)
      set((s) => ({
        sickEntries: s.sickEntries.map((e) => (e.id === tempId ? newEntry : e))
      }))
    } catch {
      set((s) => ({ sickEntries: s.sickEntries.filter((e) => e.id !== tempId) }))
    }
  },

  updateSick: async (entry) => {
    const updated = await window.api.sick.update(entry)
    set((s) => ({ sickEntries: s.sickEntries.map((e) => (e.id === entry.id ? updated : e)) }))
  },

  deleteSick: async (id) => {
    set((s) => ({ sickEntries: s.sickEntries.filter((e) => e.id !== id) }))
    await window.api.sick.delete(id)
  },

  setBudget: async (budget) => {
    const updated = await window.api.budget.set(budget)
    set((s) => {
      const budgets = s.budgets.filter((b) => b.year !== budget.year)
      return { budgets: [...budgets, updated] }
    })
  },

  getBudgetForYear: (year) => {
    return get().budgets.find((b) => b.year === year)?.totalDays ?? 0
  }
}))
