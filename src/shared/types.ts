// ─── Mail ────────────────────────────────────────────────────────────────────

export interface MailMessage {
  id: string
  subject: string
  sender: string
  senderEmail: string
  preview: string
  dateReceived: string
  isRead: boolean
  mailbox: string
}

// ─── Reminders / Tasks ───────────────────────────────────────────────────────

export interface Reminder {
  id: string
  name: string
  body: string
  completed: boolean
  dueDate: string | null
  listName: string
  priority: 0 | 1 | 2 | 3 // 0=none,1=low,2=medium,3=high
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  name: string
  body: string
  creationDate: string
  modificationDate: string
  folder: string
}

// ─── To-Do (local storage) ───────────────────────────────────────────────────

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface WeatherCondition {
  code: number
  label: string
  emoji: string
}

export interface WeatherData {
  city: string
  tempC: number
  tempF: number
  feelsLikeC: number
  humidity: number
  windKph: number
  condition: WeatherCondition
  hourly: HourlyWeather[]
}

export interface HourlyWeather {
  time: string
  tempC: number
  condition: WeatherCondition
}

// ─── News ────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

// ─── X / Nitter Feed ─────────────────────────────────────────────────────────

export interface XPost {
  id: string
  author: string
  handle: string
  content: string
  publishedAt: string
  url: string
  likes?: number
  reposts?: number
}

// ─── Claude AI ───────────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface DashboardContext {
  recentEmails: MailMessage[]
  pendingReminders: Reminder[]
  recentNotes: Note[]
  todos: TodoItem[]
  weather: WeatherData | null
  topNews: NewsItem[]
}

// ─── IPC Channel Definitions ─────────────────────────────────────────────────

export interface IpcChannels {
  // Mail
  'mail:fetch': { count?: number } // request
  'mail:result': MailMessage[]     // response

  // Reminders
  'reminders:fetch': { listName?: string }
  'reminders:result': Reminder[]
  'reminders:toggle': { id: string; listName: string }
  'reminders:add': { name: string; listName?: string; dueDate?: string }

  // Notes
  'notes:fetch': { count?: number }
  'notes:result': Note[]
  'notes:create': { name: string; body: string; folder?: string }

  // Todo (local SQLite)
  'todos:fetch': void
  'todos:result': TodoItem[]
  'todos:add': Omit<TodoItem, 'id' | 'createdAt'>
  'todos:toggle': { id: string }
  'todos:delete': { id: string }

  // Weather
  'weather:fetch': { lat?: number; lon?: number }
  'weather:result': WeatherData

  // News
  'news:fetch': void
  'news:result': NewsItem[]

  // X/Nitter
  'x:fetch': void
  'x:result': XPost[]

  // Claude AI
  'claude:message': { userMessage: string; context: DashboardContext; history: ClaudeMessage[] }
  'claude:token': { token: string; done: boolean }
  'claude:error': { message: string }

  // App settings
  'settings:get': void
  'settings:result': AppSettings
  'settings:set': Partial<AppSettings>
}

export interface AppSettings {
  anthropicApiKey: string
  weatherLat: number | null
  weatherLon: number | null
  weatherCity: string
  nitterInstance: string
  theme: 'dark' | 'light' | 'system'
  defaultEmailCount: number
  defaultNoteCount: number
}
