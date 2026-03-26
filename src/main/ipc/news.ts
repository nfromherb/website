import { IpcMain } from 'electron'
import Parser from 'rss-parser'
import { NewsItem } from '../../shared/types'
import { randomUUID } from 'crypto'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'MacDashboard/1.0' }
})

// Apple News top stories RSS & other reliable news feeds
const NEWS_FEEDS = [
  // Apple News format (public RSS)
  'https://www.apple.com/newsroom/rss-feed.xml',
  // Top general news sources
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  'https://feeds.npr.org/1001/rss.xml'
]

export function registerNewsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('news:fetch', async () => {
    const items: NewsItem[] = []

    for (const feedUrl of NEWS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl)
        const source = feed.title || feedUrl
        const feedItems = (feed.items || []).slice(0, 5).map((item) => ({
          id: randomUUID(),
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.content || item.summary || '',
          url: item.link || '',
          source,
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          imageUrl: item.enclosure?.url || undefined
        }))
        items.push(...feedItems)
      } catch {
        // Skip failing feeds silently
      }
    }

    // Sort by published date descending, take top 30
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return { ok: true, data: items.slice(0, 30) }
  })
}
