import { IpcMain } from 'electron'
import Parser from 'rss-parser'
import { XPost } from '../../shared/types'
import { getSettings } from '../storage'
import { randomUUID } from 'crypto'

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'MacDashboard/1.0' }
})

// Multiple Nitter instances for fallback
const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.1d4.us'
]

// Curated trending topics / accounts to follow for "top stories" feel
const TRENDING_QUERIES = ['#trending', 'breaking news', '#technology']

async function fetchFromNitter(instance: string, query: string): Promise<XPost[]> {
  const encodedQuery = encodeURIComponent(query)
  const feedUrl = `${instance}/search/rss?q=${encodedQuery}&f=tweets`

  const feed = await parser.parseURL(feedUrl)
  return (feed.items || []).slice(0, 10).map((item) => {
    // Nitter formats author as "Name (@handle) / Nitter"
    const authorMatch = item.author?.match(/^(.+?) \(@(.+?)\)/)
    const author = authorMatch ? authorMatch[1] : item.author || 'Unknown'
    const handle = authorMatch ? authorMatch[2] : 'unknown'

    return {
      id: randomUUID(),
      author,
      handle,
      content: item.contentSnippet || item.content || item.title || '',
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      url: item.link || `${instance}/${handle}`
    }
  })
}

export function registerXHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('x:fetch', async () => {
    const settings = getSettings()
    const instances = [settings.nitterInstance, ...NITTER_INSTANCES].filter(Boolean)

    const posts: XPost[] = []

    for (const instance of instances) {
      for (const query of TRENDING_QUERIES.slice(0, 2)) {
        try {
          const result = await fetchFromNitter(instance, query)
          posts.push(...result)
          if (posts.length >= 15) break
        } catch {
          // Try next instance
          continue
        }
      }
      if (posts.length >= 15) break
    }

    // Deduplicate and sort
    const seen = new Set<string>()
    const deduped = posts.filter((p) => {
      const key = p.content.slice(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return { ok: true, data: deduped.slice(0, 20) }
  })
}
