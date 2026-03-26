import { contextBridge, ipcRenderer } from 'electron'
import {
  MailMessage,
  Reminder,
  Note,
  TodoItem,
  WeatherData,
  NewsItem,
  XPost,
  ClaudeMessage,
  DashboardContext,
  AppSettings
} from '../shared/types'

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

// Expose a typed, secure API surface to the renderer process
const api = {
  // ── Mail ────────────────────────────────────────────────────────────────────
  mail: {
    fetch: (count?: number): Promise<IpcResult<MailMessage[]>> =>
      ipcRenderer.invoke('mail:fetch', { count })
  },

  // ── Reminders ───────────────────────────────────────────────────────────────
  reminders: {
    fetch: (listName?: string): Promise<IpcResult<Reminder[]>> =>
      ipcRenderer.invoke('reminders:fetch', { listName }),
    toggle: (id: string, listName: string): Promise<IpcResult<void>> =>
      ipcRenderer.invoke('reminders:toggle', { id, listName }),
    add: (name: string, listName?: string, dueDate?: string): Promise<IpcResult<void>> =>
      ipcRenderer.invoke('reminders:add', { name, listName, dueDate })
  },

  // ── Notes ───────────────────────────────────────────────────────────────────
  notes: {
    fetch: (count?: number): Promise<IpcResult<Note[]>> =>
      ipcRenderer.invoke('notes:fetch', { count }),
    create: (name: string, body: string, folder?: string): Promise<IpcResult<void>> =>
      ipcRenderer.invoke('notes:create', { name, body, folder })
  },

  // ── Todos (local) ───────────────────────────────────────────────────────────
  todos: {
    fetch: (): Promise<IpcResult<TodoItem[]>> => ipcRenderer.invoke('todos:fetch'),
    add: (todo: Omit<TodoItem, 'id' | 'createdAt'>): Promise<IpcResult<TodoItem>> =>
      ipcRenderer.invoke('todos:add', todo),
    toggle: (id: string): Promise<IpcResult<void>> => ipcRenderer.invoke('todos:toggle', { id }),
    delete: (id: string): Promise<IpcResult<void>> => ipcRenderer.invoke('todos:delete', { id })
  },

  // ── Weather ─────────────────────────────────────────────────────────────────
  weather: {
    fetch: (lat?: number, lon?: number): Promise<IpcResult<WeatherData>> =>
      ipcRenderer.invoke('weather:fetch', { lat, lon })
  },

  // ── News ────────────────────────────────────────────────────────────────────
  news: {
    fetch: (): Promise<IpcResult<NewsItem[]>> => ipcRenderer.invoke('news:fetch')
  },

  // ── X Feed ──────────────────────────────────────────────────────────────────
  xFeed: {
    fetch: (): Promise<IpcResult<XPost[]>> => ipcRenderer.invoke('x:fetch')
  },

  // ── Claude AI ───────────────────────────────────────────────────────────────
  claude: {
    sendMessage: (userMessage: string, context: DashboardContext, history: ClaudeMessage[]) => {
      ipcRenderer.send('claude:message', { userMessage, context, history })
    },
    onToken: (callback: (token: string, done: boolean) => void) => {
      const listener = (_: unknown, { token, done }: { token: string; done: boolean }) =>
        callback(token, done)
      ipcRenderer.on('claude:token', listener)
      return () => ipcRenderer.removeListener('claude:token', listener)
    }
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings: {
    get: (): Promise<IpcResult<AppSettings>> => ipcRenderer.invoke('settings:get'),
    set: (updates: Partial<AppSettings>): Promise<IpcResult<void>> =>
      ipcRenderer.invoke('settings:set', updates)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type DashboardApi = typeof api
