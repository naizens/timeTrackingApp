import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../renderer/src/types/ipc'
import type {
  WorkDay,
  VacationEntry,
  SickEntry,
  VacationBudget,
  Todo,
  AppSettings,
  GermanStateCode,
  HolidaysForYear
} from '../renderer/src/types/store'

// ============================================================
// The ONLY interface between the renderer and the main process.
// Nothing else from Node.js or Electron is exposed.
// Each method maps to exactly one IPC channel.
// ============================================================

const electronAPI = {
  calendar: {
    getMonth: (yearMonth: string): Promise<Record<string, WorkDay>> =>
      ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_GET_MONTH, yearMonth),

    setDay: (day: WorkDay): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_SET_DAY, day),

    deleteDay: (date: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_DELETE_DAY, date)
  },

  vacation: {
    getAll: (): Promise<VacationEntry[]> => ipcRenderer.invoke(IPC_CHANNELS.VACATION_GET_ALL),

    add: (entry: Omit<VacationEntry, 'id'>): Promise<VacationEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.VACATION_ADD, entry),

    update: (entry: VacationEntry): Promise<VacationEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.VACATION_UPDATE, entry),

    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.VACATION_DELETE, id)
  },

  sick: {
    getAll: (): Promise<SickEntry[]> => ipcRenderer.invoke(IPC_CHANNELS.SICK_GET_ALL),

    add: (entry: Omit<SickEntry, 'id'>): Promise<SickEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.SICK_ADD, entry),

    update: (entry: SickEntry): Promise<SickEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.SICK_UPDATE, entry),

    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SICK_DELETE, id)
  },

  budget: {
    getAll: (): Promise<VacationBudget[]> => ipcRenderer.invoke(IPC_CHANNELS.BUDGET_GET_ALL),

    set: (budget: VacationBudget): Promise<VacationBudget> =>
      ipcRenderer.invoke(IPC_CHANNELS.BUDGET_SET, budget)
  },

  todo: {
    getAll: (): Promise<Todo[]> => ipcRenderer.invoke(IPC_CHANNELS.TODO_GET_ALL),

    add: (payload: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> =>
      ipcRenderer.invoke(IPC_CHANNELS.TODO_ADD, payload),

    update: (todo: Todo): Promise<Todo> => ipcRenderer.invoke(IPC_CHANNELS.TODO_UPDATE, todo),

    delete: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.TODO_DELETE, id)
  },

  holidays: {
    get: (year: number, state: GermanStateCode): Promise<HolidaysForYear> =>
      ipcRenderer.invoke(IPC_CHANNELS.HOLIDAYS_GET, { year, state })
  },

  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),

    set: (partial: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, partial)
  },

  window: {
    minimize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximizeToggle: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE_TOGGLE),
    close: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

    // Returns a cleanup function to remove the listener
    onMaximizedChange: (callback: (isMaximized: boolean) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, value: boolean): void => callback(value)
      ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, handler)
    }
  }
}

export type ElectronAPI = typeof electronAPI

// Expose via contextBridge – contextIsolation must be true (enforced in windowManager)
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', electronAPI)
  } catch (error) {
    console.error('contextBridge.exposeInMainWorld failed:', error)
  }
}
