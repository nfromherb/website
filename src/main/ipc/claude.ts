import { IpcMain, BrowserWindow } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { ClaudeMessage, DashboardContext } from '../../shared/types'
import { getSettings } from '../storage'

function buildSystemPrompt(context: DashboardContext): string {
  const emailSummary =
    context.recentEmails.length > 0
      ? context.recentEmails
          .slice(0, 5)
          .map((e) => `- From: ${e.sender} | Subject: ${e.subject} | Preview: ${e.preview.slice(0, 100)}`)
          .join('\n')
      : 'No recent emails.'

  const remindersSummary =
    context.pendingReminders.length > 0
      ? context.pendingReminders
          .slice(0, 5)
          .map((r) => `- [${r.listName}] ${r.name}${r.dueDate ? ` (due: ${r.dueDate})` : ''}`)
          .join('\n')
      : 'No pending reminders.'

  const todosSummary =
    context.todos.filter((t) => !t.completed).length > 0
      ? context.todos
          .filter((t) => !t.completed)
          .slice(0, 5)
          .map((t) => `- [${t.priority}] ${t.text}`)
          .join('\n')
      : 'No pending todos.'

  const notesSummary =
    context.recentNotes.length > 0
      ? context.recentNotes
          .slice(0, 3)
          .map((n) => `- "${n.name}" (${n.folder}): ${n.body.slice(0, 150)}`)
          .join('\n')
      : 'No recent notes.'

  const weatherSummary = context.weather
    ? `${context.weather.condition.emoji} ${context.weather.tempC}°C (${context.weather.tempF}°F), ${context.weather.condition.label}, Humidity: ${context.weather.humidity}%`
    : 'Weather unavailable.'

  const newsSummary =
    context.topNews.length > 0
      ? context.topNews
          .slice(0, 3)
          .map((n) => `- [${n.source}] ${n.title}`)
          .join('\n')
      : 'No news available.'

  return `You are a personal AI assistant built into the user's Mac Dashboard. You have access to a live snapshot of their day:

## Current Dashboard Context

### Unread Emails (recent)
${emailSummary}

### Pending Reminders
${remindersSummary}

### To-Do Items
${todosSummary}

### Recent Notes
${notesSummary}

### Weather
${weatherSummary}

### Top News Headlines
${newsSummary}

---

You act like a combination of Notion AI and a personal executive assistant. You can:
- Summarize emails and suggest responses
- Help prioritize tasks and reminders
- Draft notes and to-do items
- Answer questions about anything in the dashboard
- Give weather-based recommendations
- Discuss news stories

Be concise, warm, and proactive. Format responses with markdown when helpful. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
}

export function registerClaudeHandlers(ipcMain: IpcMain): void {
  ipcMain.on(
    'claude:message',
    async (event, { userMessage, context, history }: { userMessage: string; context: DashboardContext; history: ClaudeMessage[] }) => {
      const settings = getSettings()
      const apiKey = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY

      if (!apiKey) {
        event.sender.send('claude:token', {
          token: '⚠️ No Anthropic API key configured. Please add it in Settings.',
          done: true
        })
        return
      }

      const client = new Anthropic({ apiKey })

      // Build messages array from history + current
      const messages: Anthropic.MessageParam[] = [
        ...history.slice(-20).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ]

      try {
        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: buildSystemPrompt(context),
          messages
        })

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            event.sender.send('claude:token', { token: chunk.delta.text, done: false })
          }
        }

        event.sender.send('claude:token', { token: '', done: true })
      } catch (err) {
        const errMsg = (err as Error).message
        // Friendly error messages
        if (errMsg.includes('401') || errMsg.includes('authentication')) {
          event.sender.send('claude:token', {
            token: '⚠️ Invalid API key. Please check your Anthropic API key in Settings.',
            done: true
          })
        } else if (errMsg.includes('rate')) {
          event.sender.send('claude:token', {
            token: '⚠️ Rate limit hit. Please wait a moment and try again.',
            done: true
          })
        } else {
          event.sender.send('claude:token', {
            token: `⚠️ Error: ${errMsg}`,
            done: true
          })
        }
      }
    }
  )
}
