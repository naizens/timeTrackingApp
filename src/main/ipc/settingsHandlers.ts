import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../renderer/src/types/ipc'
import { getStore } from '../store'
import type { AppSettings } from '../../renderer/src/types/store'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => getStore().get('settings'))

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, partial: Partial<AppSettings>) => {
    const store = getStore()
    const current = store.get('settings')
    const updated: AppSettings = { ...current, ...partial }
    store.set('settings', updated)
    return updated
  })
}
