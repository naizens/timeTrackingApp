import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../renderer/src/types/ipc'
import { getMainWindow } from '../windowManager'

// Window controls use ipcMain.on (fire-and-forget) for minimize/maximize/close
// since these are one-way operations with no return value.
// isMaximized uses ipcMain.handle because it needs to return a value.

export function registerWindowHandlers(): void {
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow()?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE_TOGGLE, () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getMainWindow()?.close()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return getMainWindow()?.isMaximized() ?? false
  })
}
