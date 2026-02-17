import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { IPC_CHANNELS } from '../../renderer/src/types/ipc'
import { getStore } from '../store'
import type { VacationEntry, SickEntry, VacationBudget } from '../../renderer/src/types/store'

export function registerVacationHandlers(): void {
  // --- Vacation ---
  ipcMain.handle(IPC_CHANNELS.VACATION_GET_ALL, () => getStore().get('vacationEntries'))

  ipcMain.handle(IPC_CHANNELS.VACATION_ADD, (_event, entry: Omit<VacationEntry, 'id'>) => {
    const store = getStore()
    const entries = store.get('vacationEntries')
    const newEntry: VacationEntry = { ...entry, id: randomUUID() }
    store.set('vacationEntries', [...entries, newEntry])
    return newEntry
  })

  ipcMain.handle(IPC_CHANNELS.VACATION_UPDATE, (_event, entry: VacationEntry) => {
    const store = getStore()
    const entries = store.get('vacationEntries')
    store.set(
      'vacationEntries',
      entries.map((e) => (e.id === entry.id ? entry : e))
    )
    return entry
  })

  ipcMain.handle(IPC_CHANNELS.VACATION_DELETE, (_event, id: string) => {
    const store = getStore()
    store.set(
      'vacationEntries',
      store.get('vacationEntries').filter((e) => e.id !== id)
    )
    return { success: true }
  })

  // --- Sick days ---
  ipcMain.handle(IPC_CHANNELS.SICK_GET_ALL, () => getStore().get('sickEntries'))

  ipcMain.handle(IPC_CHANNELS.SICK_ADD, (_event, entry: Omit<SickEntry, 'id'>) => {
    const store = getStore()
    const entries = store.get('sickEntries')
    const newEntry: SickEntry = { ...entry, id: randomUUID() }
    store.set('sickEntries', [...entries, newEntry])
    return newEntry
  })

  ipcMain.handle(IPC_CHANNELS.SICK_UPDATE, (_event, entry: SickEntry) => {
    const store = getStore()
    const entries = store.get('sickEntries')
    store.set(
      'sickEntries',
      entries.map((e) => (e.id === entry.id ? entry : e))
    )
    return entry
  })

  ipcMain.handle(IPC_CHANNELS.SICK_DELETE, (_event, id: string) => {
    const store = getStore()
    store.set(
      'sickEntries',
      store.get('sickEntries').filter((e) => e.id !== id)
    )
    return { success: true }
  })

  // --- Vacation budget ---
  ipcMain.handle(IPC_CHANNELS.BUDGET_GET_ALL, () => getStore().get('vacationBudgets'))

  ipcMain.handle(IPC_CHANNELS.BUDGET_SET, (_event, budget: VacationBudget) => {
    const store = getStore()
    const budgets = store.get('vacationBudgets')
    const idx = budgets.findIndex((b) => b.year === budget.year)
    if (idx >= 0) budgets[idx] = budget
    else budgets.push(budget)
    store.set('vacationBudgets', budgets)
    return budget
  })
}
