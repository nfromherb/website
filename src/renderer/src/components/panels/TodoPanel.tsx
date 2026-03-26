import { useState } from 'react'
import { TodoItem } from '@shared/types'
import { useDashboardContext } from '../../hooks/useDashboardContext'

interface TodoPanelProps {
  context: ReturnType<typeof useDashboardContext>
  fullHeight?: boolean
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   dot: 'bg-red-400',   text: 'text-red-400' },
  medium: { label: 'Med',    dot: 'bg-amber-400',  text: 'text-amber-400' },
  low:    { label: 'Low',    dot: 'bg-green-400',  text: 'text-green-400' }
}

export default function TodoPanel({ context, fullHeight = false }: TodoPanelProps) {
  const { todos, setTodos, loading, refresh } = context
  const [newText, setNewText] = useState('')
  const [priority, setPriority] = useState<TodoItem['priority']>('medium')
  const [adding, setAdding] = useState(false)

  const pending = todos.filter((t) => !t.completed)
  const completed = todos.filter((t) => t.completed)

  const handleAdd = async () => {
    const text = newText.trim()
    if (!text) return
    setAdding(true)
    await window.api.todos.add({ text, completed: false, priority, tags: [] })
    setNewText('')
    await refresh.todos()
    setAdding(false)
  }

  const handleToggle = async (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
    await window.api.todos.toggle(id)
  }

  const handleDelete = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await window.api.todos.delete(id)
  }

  return (
    <div className={`panel flex flex-col ${fullHeight ? 'h-full' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">
          To-Do
          {pending.length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-normal normal-case">
              {pending.length}
            </span>
          )}
        </span>
      </div>

      {/* Add todo */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex gap-2 mb-1.5">
          <input
            className="glass-input flex-1 text-xs py-1.5"
            placeholder="Add a to-do…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newText.trim()}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-30"
          >
            +
          </button>
        </div>
        <div className="flex gap-1.5">
          {(['high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`no-drag text-xs px-2.5 py-0.5 rounded-full border transition-colors cursor-default ${
                priority === p
                  ? `${PRIORITY_CONFIG[p].text} border-current bg-current/10`
                  : 'text-white/30 border-white/10 hover:border-white/20'
              }`}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 mt-1 space-y-0.5">
        {loading.todos && todos.length === 0 ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-xl shimmer mb-1" />)
        ) : (
          <>
            {pending.map((todo) => (
              <TodoRow key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {completed.length > 0 && (
              <>
                <div className="text-xs text-white/20 px-2 pt-3 pb-1">Completed ({completed.length})</div>
                {completed.slice(0, 3).map((todo) => (
                  <TodoRow key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </>
            )}
            {pending.length === 0 && completed.length === 0 && (
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-white/30 text-xs">No to-dos yet</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TodoRow({
  todo,
  onToggle,
  onDelete
}: {
  todo: TodoItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const cfg = PRIORITY_CONFIG[todo.priority]
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
      <button
        className="no-drag w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors cursor-default"
        style={{ borderColor: todo.completed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }}
        onClick={() => onToggle(todo.id)}
      >
        {todo.completed && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className={`text-sm flex-1 truncate ${
            todo.completed ? 'line-through text-white/25' : 'text-white/80'
          }`}
        >
          {todo.text}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      </div>

      <button
        className="no-drag opacity-0 group-hover:opacity-100 btn-icon py-0.5 px-1 text-xs text-red-400/60 hover:text-red-400 cursor-default"
        onClick={() => onDelete(todo.id)}
      >
        ✕
      </button>
    </div>
  )
}
