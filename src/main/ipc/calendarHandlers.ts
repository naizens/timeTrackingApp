import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../renderer/src/types/ipc'
import { getStore } from '../store'
import type { WorkDay } from '../../renderer/src/types/store'

export function registerCalendarHandlers(): void {
  // Returns all WorkDay entries for a given "YYYY-MM" month string
  ipcMain.handle(IPC_CHANNELS.CALENDAR_GET_MONTH, (_event, yearMonth: string) => {
    const workDays = getStore().get('workDays')
    const result: Record<string, WorkDay> = {}
    for (const [date, day] of Object.entries(workDays)) {
      if (date.startsWith(yearMonth)) result[date] = day as WorkDay
    }
    return result
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_SET_DAY, (_event, day: WorkDay) => {
    const store = getStore()
    const workDays = store.get('workDays')
    workDays[day.date] = day
    store.set('workDays', workDays)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_DELETE_DAY, (_event, date: string) => {
    const store = getStore()
    const workDays = store.get('workDays')
    delete workDays[date]
    store.set('workDays', workDays)
    return { success: true }
  })
}
