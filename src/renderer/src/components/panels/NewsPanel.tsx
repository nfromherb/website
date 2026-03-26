import { useState } from 'react'
import { NewsItem } from '@shared/types'
import { useDashboardContext } from '../../hooks/useDashboardContext'

interface NewsPanelProps {
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SOURCE_COLORS: Record<string, string> = {
  'BBC News': 'text-red-400',
  'NPR': 'text-blue-400',
  'The New York Times': 'text-white/60',
  'Apple Newsroom': 'text-blue-300'
}

export default function NewsPanel({ context, fullHeight = false }: NewsPanelProps) {
  const { news, loading, refresh } = context
  const [selected, setSelected] = useState<NewsItem | null>(null)

  return (
    <div className={`panel flex flex-col ${fullHeight ? 'h-full' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">Top News</span>
        <button className="btn-icon" onClick={refresh.news}>⟳</button>
      </div>

      {loading.news && news.length === 0 ? (
        <div className="flex-1 p-3 space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
      ) : selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-start gap-2 px-4 py-3 border-b border-white/5">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white/90 leading-snug">{selected.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${SOURCE_COLORS[selected.source] || 'text-white/40'}`}>
                  {selected.source}
                </span>
                <span className="text-xs text-white/25">·</span>
                <span className="text-xs text-white/30">{formatDate(selected.publishedAt)}</span>
              </div>
            </div>
            <button className="btn-icon flex-shrink-0" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 selectable">
            <p className="text-sm text-white/70 leading-relaxed">{selected.description}</p>
            {selected.url && (
              <a
                href={selected.url}
                className="no-drag inline-flex items-center gap-1.5 mt-4 text-xs text-blue-400 hover:text-blue-300"
                onClick={(e) => {
                  e.preventDefault()
                  // Link opening handled by main process
                }}
              >
                Read full article →
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {news.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-3xl mb-2">📰</div>
                <p className="text-white/30 text-sm">No news available</p>
              </div>
            </div>
          ) : (
            news.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="no-drag w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-default"
              >
                <div className="flex items-start gap-3">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 opacity-80"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/85 leading-snug line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs font-medium ${SOURCE_COLORS[item.source] || 'text-white/40'}`}>
                        {item.source}
                      </span>
                      <span className="text-xs text-white/25">·</span>
                      <span className="text-xs text-white/30">{formatDate(item.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
