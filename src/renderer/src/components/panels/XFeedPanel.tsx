import { useState, useEffect } from 'react'
import { XPost } from '@shared/types'

interface XFeedPanelProps {
  context: { news: unknown }
  fullHeight?: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / (1000 * 60))
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function XFeedPanel({ fullHeight = false }: XFeedPanelProps) {
  const [posts, setPosts] = useState<XPost[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    const result = await window.api.xFeed.fetch()
    if (result.ok) setPosts(result.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
    const interval = setInterval(fetchPosts, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`panel flex flex-col ${fullHeight ? 'h-full' : ''}`}>
      <div className="panel-header">
        <span className="panel-title flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current opacity-60" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X / Trending
        </span>
        <button className="btn-icon" onClick={fetchPosts}>⟳</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && posts.length === 0 ? (
          <div className="p-3 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">🐦</div>
              <p className="text-white/30 text-sm">Could not load posts</p>
              <p className="text-white/20 text-xs mt-1">Nitter instance may be unavailable</p>
              <button className="btn-primary mt-3 text-xs" onClick={fetchPosts}>Retry</button>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xs font-bold text-white/70">
                  {post.author[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white/80 truncate">{post.author}</span>
                  <span className="text-xs text-white/30 ml-1">@{post.handle}</span>
                </div>
                <span className="ml-auto text-xs text-white/25 flex-shrink-0">{formatDate(post.publishedAt)}</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed selectable line-clamp-3">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
