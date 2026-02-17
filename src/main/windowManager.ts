import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IPC_CHANNELS } from '../renderer/src/types/ipc'

let mainWindow: BrowserWindow | null = null

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Removes native Windows title bar
    show: false, // Shown after ready-to-show to prevent white flash
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // Required for preload to use require/import
    }
  })

  // Only show window after React has painted (prevents white flash)
  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // Open external links in the system browser, never in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Push maximize state changes to renderer so TitleBar icon can update
  mainWindow.on('maximize', () => {
    mainWindow!.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow!.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, false)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
