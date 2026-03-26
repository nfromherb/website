import { useState } from 'react'
import { Note } from '@shared/types'
import { useDashboardContext } from '../../hooks/useDashboardContext'

interface NotesPanelProps {
  context: ReturnType<typeof useDashboardContext>
  fullHeight?: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotesPanel({ context, fullHeight = false }: NotesPanelProps) {
  const { notes, loading, refresh } = context
  const [selected, setSelected] = useState<Note | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBody, setNewBody] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const name = newName.trim() || 'Untitled Note'
    const body = newBody.trim()
    setSaving(true)
    await window.api.notes.create(name, body)
    setNewName('')
    setNewBody('')
    setCreating(false)
    setSaving(false)
    await refresh.notes()
  }

  return (
    <div className={`panel flex flex-col ${fullHeight ? 'h-full' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">Notes</span>
        <div className="flex gap-1">
          <button className="btn-icon" onClick={() => { setCreating(true); setSelected(null) }}>+</button>
          <button className="btn-icon" onClick={refresh.notes}>⟳</button>
        </div>
      </div>

      {creating ? (
        <div className="flex-1 flex flex-col gap-3 p-4 selectable">
          <input
            className="glass-input text-sm font-medium"
            placeholder="Note title…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <textarea
            className="glass-input flex-1 resize-none text-sm"
            placeholder="Start writing…"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={8}
          />
          <div className="flex justify-end gap-2">
            <button className="btn-icon px-3 py-1.5 text-sm" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save to Apple Notes'}
            </button>
          </div>
        </div>
      ) : selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between px-4 py-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-semibold text-white/90">{selected.name}</h3>
              <p className="text-xs text-white/30 mt-0.5">{selected.folder} · {formatDate(selected.modificationDate)}</p>
            </div>
            <button className="btn-icon" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 selectable">
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              {selected.body || <span className="text-white/20 italic">Empty note</span>}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading.notes && notes.length === 0 ? (
            <div className="p-3 space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-white/30 text-sm">No notes yet</p>
                <button className="btn-primary mt-3 text-xs" onClick={() => setCreating(true)}>
                  Create first note
                </button>
              </div>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelected(note)}
                className="no-drag w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-default"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-white/85 truncate">{note.name}</span>
                  <span className="text-xs text-white/30 flex-shrink-0">{formatDate(note.modificationDate)}</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5 truncate">{note.folder}</p>
                <p className="text-xs text-white/30 mt-1 line-clamp-2 leading-relaxed">{note.body}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
