import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { TodoItem, AppSettings } from '../shared/types'
import { randomUUID } from 'crypto'

let db: Database.Database

export function initStorage(): void {
  const dbPath = join(app.getPath('userData'), 'dashboard.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      tags TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

// ─── Todos ────────────────────────────────────────────────────────────────────

export function getTodos(): TodoItem[] {
  const rows = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all() as {
    id: string
    text: string
    completed: number
    created_at: string
    priority: string
    tags: string
  }[]
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed === 1,
    createdAt: r.created_at,
    priority: r.priority as TodoItem['priority'],
    tags: JSON.parse(r.tags)
  }))
}

export function addTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>): TodoItem {
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(
    'INSERT INTO todos (id, text, completed, created_at, priority, tags) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, todo.text, todo.completed ? 1 : 0, createdAt, todo.priority, JSON.stringify(todo.tags))
  return { id, createdAt, ...todo }
}

export function toggleTodo(id: string): void {
  db.prepare('UPDATE todos SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END WHERE id = ?').run(id)
}

export function deleteTodo(id: string): void {
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS: AppSettings = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  weatherLat: null,
  weatherLon: null,
  weatherCity: process.env.WEATHER_CITY || 'New York',
  nitterInstance: process.env.NITTER_INSTANCE || 'https://nitter.poast.org',
  theme: 'dark',
  defaultEmailCount: 10,
  defaultNoteCount: 20
}

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const stored: Partial<AppSettings> = {}
  for (const row of rows) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(stored as any)[row.key] = JSON.parse(row.value)
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(stored as any)[row.key] = row.value
    }
  }
  return { ...SETTINGS_DEFAULTS, ...stored }
}

export function setSettings(updates: Partial<AppSettings>): void {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  const insert = db.transaction((updates: Partial<AppSettings>) => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, JSON.stringify(value))
    }
  })
  insert(updates)
}
