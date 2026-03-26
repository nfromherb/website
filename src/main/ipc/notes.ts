import { IpcMain } from 'electron'
import { fetchNotes, createNote } from '../applescript'
import { Note } from '../../shared/types'

function parseNotesOutput(raw: string): Note[] {
  if (!raw) return []
  return raw.split('~~~').filter(Boolean).map((block, idx) => {
    const [id, name, creationDate, modificationDate, folder, body] = block.split('|||')
    return {
      id: id || `note-${idx}`,
      name: name || 'Untitled',
      body: body || '',
      creationDate: creationDate || new Date().toISOString(),
      modificationDate: modificationDate || new Date().toISOString(),
      folder: folder || 'Notes'
    }
  })
}

export function registerNotesHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('notes:fetch', async (_event, { count = 20 } = {}) => {
    try {
      const raw = await fetchNotes(count)
      return { ok: true, data: parseNotesOutput(raw) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('notes:create', async (_event, { name, body, folder }) => {
    try {
      await createNote(name, body, folder)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
