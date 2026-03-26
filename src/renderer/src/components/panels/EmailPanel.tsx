import { useState } from 'react'
import { MailMessage } from '@shared/types'
import { useDashboardContext } from '../../hooks/useDashboardContext'

interface EmailPanelProps {
  context: ReturnType<typeof useDashboardContext>
  fullHeight?: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-green-500 to-green-700',
  'from-amber-500 to-amber-700',
  'from-red-500 to-red-700',
  'from-pink-500 to-pink-700'
]

export default function EmailPanel({ context, fullHeight = false }: EmailPanelProps) {
  const { emails, loading, refresh } = context
  const [selected, setSelected] = useState<MailMessage | null>(null)

  return (
    <div className={`panel flex flex-col ${fullHeight ? 'h-full' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">
          Mail{' '}
          {emails.filter((e) => !e.isRead).length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-400 font-normal normal-case">
              {emails.filter((e) => !e.isRead).length} new
            </span>
          )}
        </span>
        <button className="btn-icon" onClick={refresh.emails} title="Refresh">⟳</button>
      </div>

      {loading.emails && emails.length === 0 ? (
        <div className="flex-1 p-3 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-white/30 text-sm">No unread emails</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Email list */}
          <div className={`overflow-y-auto ${selected ? 'w-1/2 border-r border-white/5' : 'w-full'}`}>
            {emails.map((email, i) => (
              <button
                key={email.id}
                onClick={() => setSelected(email.id === selected?.id ? null : email)}
                className={`no-drag w-full text-left px-4 py-3 flex gap-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-default ${
                  email.id === selected?.id ? 'bg-white/8' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-xs font-bold flex-shrink-0`}
                >
                  {getInitials(email.sender || email.senderEmail)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate ${email.isRead ? 'text-white/60' : 'text-white font-semibold'}`}>
                      {email.sender || email.senderEmail}
                    </span>
                    <span className="text-xs text-white/30 flex-shrink-0">{formatDate(email.dateReceived)}</span>
                  </div>
                  <div className={`text-xs truncate mt-0.5 ${email.isRead ? 'text-white/40' : 'text-white/80'}`}>
                    {email.subject}
                  </div>
                  <div className="text-xs text-white/30 truncate mt-0.5">{email.preview}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Email detail */}
          {selected && (
            <div className="w-1/2 overflow-y-auto p-4 selectable">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white/90 leading-snug">{selected.subject}</h3>
                <button className="btn-icon flex-shrink-0" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="text-xs text-white/40 mb-1">From: {selected.sender} &lt;{selected.senderEmail}&gt;</div>
              <div className="text-xs text-white/40 mb-4">{formatDate(selected.dateReceived)}</div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{selected.preview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
