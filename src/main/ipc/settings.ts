import { IpcMain } from 'electron'
import { getSettings, setSettings } from '../storage'

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get', () => {
    try {
      return { ok: true, data: getSettings() }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:set', (_event, updates) => {
    try {
      setSettings(updates)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
