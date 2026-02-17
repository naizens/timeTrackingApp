import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { initStore } from './store'
import { createWindow } from './windowManager'
import { registerAllIpcHandlers } from './ipc'

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.work-tracker')

  // Keyboard shortcuts (F12 DevTools, Ctrl+R reload) in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Order matters: store must be ready before IPC handlers are registered
  await initStore()
  registerAllIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
