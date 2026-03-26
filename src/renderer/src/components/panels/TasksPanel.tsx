import { useState } from 'react'
import { Reminder } from '@shared/types'
import { useDashboardContext } from '../../hooks/useDashboardContext'

interface TasksPanelProps {
  context: ReturnType<typeof useDashboardContext>
  fullHeight?: boolean
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDue(dueDate: string | null): string {
  if (!dueDate) return ''
  const d = new Date(dueDate)
  const now = new Date()
  if (d < now) return `Overdue · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const diff = d.getTime() - now.getTime()
  const hours = Math.ceil(diff / (1000 * 60 * 60))
  if (hours < 24) return `Due in ${hours}h`
  const days = Math.ceil(hours / 24)
  if (days === 1) return 'Due tomorrow'
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export default function TasksPanel({ context, fullHeight = false }: TasksPanelProps) {
  const { reminders, setReminders, loading, refresh } = context
  const [newTask, setNewTask] = useState('')
  const [adding, setAdding] = useState(false)

  const pending = reminders.filter((r) => !r.completed)

  const handleToggle = async (reminder: Reminder) => {
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, completed: !r.completed } : r))
    )
    await window.api.reminders.toggle(reminder.id, reminder.listName)
  }

  const handleAdd = async () => {
    const text = newTask.trim()
    if (!text) return
    setAdding(true)
    await window.api.reminders.add(text)
    setNewTask('')
    await refresh.reminders()
    setAdding(false)
  }

  return (
    <div className={`panel flex flex-col ${fullHeight ? 'h-full' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">
          Reminders
          {pending.length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-normal normal-case">
              {pending.length}
            </span>
          )}
        </span>
        <button className="btn-icon" onClick={refresh.reminders}>⟳</button>
      </div>

      {/* Add task */}
      <div className="px-3 pt-2 pb-1 flex gap-2">
        <input
          className="glass-input flex-1 text-xs py-1.5"
          placeholder="Add reminder…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTask.trim()}
          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-30"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 mt-1">
        {loading.reminders && pending.length === 0 ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-xl shimmer" />)
        ) : pending.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-white/30 text-xs">All caught up!</p>
            </div>
          </div>
        ) : (
          pending.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <button
                className="no-drag mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors cursor-default"
                style={{
                  borderColor: isOverdue(reminder.dueDate) ? '#F59E0B' : 'rgba(255,255,255,0.3)'
                }}
                onClick={() => handleToggle(reminder)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/85 truncate">{reminder.name}</p>
                {reminder.dueDate && (
                  <p
                    className={`text-xs mt-0.5 ${
                      isOverdue(reminder.dueDate) ? 'text-amber-400' : 'text-white/30'
                    }`}
                  >
                    {formatDue(reminder.dueDate)}
                  </p>
                )}
                {reminder.listName && (
                  <span className="text-xs text-white/25">{reminder.listName}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
