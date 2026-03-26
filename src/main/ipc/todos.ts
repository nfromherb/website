import { IpcMain } from 'electron'
import { getTodos, addTodo, toggleTodo, deleteTodo } from '../storage'

export function registerTodosHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('todos:fetch', () => {
    try {
      return { ok: true, data: getTodos() }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('todos:add', (_event, todo) => {
    try {
      const created = addTodo(todo)
      return { ok: true, data: created }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('todos:toggle', (_event, { id }) => {
    try {
      toggleTodo(id)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('todos:delete', (_event, { id }) => {
    try {
      deleteTodo(id)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
