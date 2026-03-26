import { useState, useEffect, useCallback } from 'react'
import { DashboardContext, MailMessage, Reminder, Note, TodoItem, WeatherData, NewsItem } from '@shared/types'

export function useDashboardContext() {
  const [emails, setEmails] = useState<MailMessage[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState({
    emails: false,
    reminders: false,
    notes: false,
    todos: false,
    weather: false,
    news: false
  })

  const fetchEmails = useCallback(async () => {
    setLoading((l) => ({ ...l, emails: true }))
    const result = await window.api.mail.fetch(10)
    if (result.ok) setEmails(result.data)
    setLoading((l) => ({ ...l, emails: false }))
  }, [])

  const fetchReminders = useCallback(async () => {
    setLoading((l) => ({ ...l, reminders: true }))
    const result = await window.api.reminders.fetch()
    if (result.ok) setReminders(result.data)
    setLoading((l) => ({ ...l, reminders: false }))
  }, [])

  const fetchNotes = useCallback(async () => {
    setLoading((l) => ({ ...l, notes: true }))
    const result = await window.api.notes.fetch(20)
    if (result.ok) setNotes(result.data)
    setLoading((l) => ({ ...l, notes: false }))
  }, [])

  const fetchTodos = useCallback(async () => {
    setLoading((l) => ({ ...l, todos: true }))
    const result = await window.api.todos.fetch()
    if (result.ok) setTodos(result.data)
    setLoading((l) => ({ ...l, todos: false }))
  }, [])

  const fetchWeather = useCallback(async () => {
    setLoading((l) => ({ ...l, weather: true }))
    const result = await window.api.weather.fetch()
    if (result.ok) setWeather(result.data)
    setLoading((l) => ({ ...l, weather: false }))
  }, [])

  const fetchNews = useCallback(async () => {
    setLoading((l) => ({ ...l, news: true }))
    const result = await window.api.news.fetch()
    if (result.ok) setNews(result.data)
    setLoading((l) => ({ ...l, news: false }))
  }, [])

  // Initial load + auto-refresh
  useEffect(() => {
    fetchEmails()
    fetchReminders()
    fetchNotes()
    fetchTodos()
    fetchWeather()
    fetchNews()

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchEmails()
      fetchReminders()
      fetchWeather()
      fetchNews()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchEmails, fetchReminders, fetchNotes, fetchTodos, fetchWeather, fetchNews])

  const context: DashboardContext = {
    recentEmails: emails,
    pendingReminders: reminders.filter((r) => !r.completed),
    recentNotes: notes,
    todos,
    weather,
    topNews: news.slice(0, 5)
  }

  return {
    context,
    emails,
    setEmails,
    reminders,
    setReminders,
    notes,
    setNotes,
    todos,
    setTodos,
    weather,
    news,
    loading,
    refresh: {
      emails: fetchEmails,
      reminders: fetchReminders,
      notes: fetchNotes,
      todos: fetchTodos,
      weather: fetchWeather,
      news: fetchNews
    }
  }
}
