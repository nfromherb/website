import { IpcMain, BrowserWindow } from 'electron'
import { registerMailHandlers } from './mail'
import { registerRemindersHandlers } from './reminders'
import { registerNotesHandlers } from './notes'
import { registerTodosHandlers } from './todos'
import { registerWeatherHandlers } from './weather'
import { registerNewsHandlers } from './news'
import { registerXHandlers } from './x-feed'
import { registerClaudeHandlers } from './claude'
import { registerSettingsHandlers } from './settings'
import { initStorage } from '../storage'

export function registerAllIpcHandlers(ipcMain: IpcMain): void {
  // Initialize local storage first
  initStorage()

  registerMailHandlers(ipcMain)
  registerRemindersHandlers(ipcMain)
  registerNotesHandlers(ipcMain)
  registerTodosHandlers(ipcMain)
  registerWeatherHandlers(ipcMain)
  registerNewsHandlers(ipcMain)
  registerXHandlers(ipcMain)
  registerClaudeHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
}
