import { IpcMain } from 'electron'
import { fetchReminders, toggleReminder, addReminder } from '../applescript'
import { Reminder } from '../../shared/types'

function parseRemindersOutput(raw: string): Reminder[] {
  if (!raw) return []
  return raw.split('~~~').filter(Boolean).map((block, idx) => {
    const [id, name, completed, dueDate, body, listName] = block.split('|||')
    return {
      id: id || `reminder-${idx}`,
      name: name || '',
      body: body || '',
      completed: completed === 'true',
      dueDate: dueDate === 'none' || !dueDate ? null : dueDate,
      listName: listName || 'Reminders',
      priority: 0
    } satisfies Reminder
  })
}

export function registerRemindersHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('reminders:fetch', async (_event, { listName } = {}) => {
    try {
      const raw = await fetchReminders(listName)
      return { ok: true, data: parseRemindersOutput(raw) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('reminders:toggle', async (_event, { id, listName }) => {
    try {
      await toggleReminder(id, listName)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('reminders:add', async (_event, { name, listName, dueDate }) => {
    try {
      await addReminder(name, listName, dueDate)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
