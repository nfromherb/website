import { IpcMain } from 'electron'
import { fetchMailMessages } from '../applescript'
import { MailMessage } from '../../shared/types'

function parseMailOutput(raw: string): MailMessage[] {
  if (!raw) return []
  return raw.split('~~~').filter(Boolean).map((block, idx) => {
    const [id, subject, sender, dateStr, preview] = block.split('|||')
    // Extract email address from "Name <email>" format
    const emailMatch = sender?.match(/<([^>]+)>/)
    const senderEmail = emailMatch ? emailMatch[1] : sender || ''
    const senderName = sender?.replace(/<[^>]+>/, '').trim() || sender || ''
    return {
      id: id || `mail-${idx}`,
      subject: subject || '(No subject)',
      sender: senderName,
      senderEmail,
      preview: preview || '',
      dateReceived: dateStr || new Date().toISOString(),
      isRead: false,
      mailbox: 'INBOX'
    }
  })
}

export function registerMailHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('mail:fetch', async (_event, { count = 10 } = {}) => {
    try {
      const raw = await fetchMailMessages(count)
      return { ok: true, data: parseMailOutput(raw) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
