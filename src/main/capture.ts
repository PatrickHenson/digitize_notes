import { promises as fs } from 'fs'
import { basename, extname, join } from 'path'
import type { QueuedPage } from '../shared/capture'
import { formatPageId, pageFileName, SUPPORTED_IMPORT_EXTENSIONS } from '../shared/capture'

// See docs/architecture.md "Pipeline" — ingest only writes into
// pending_processing/; the background worker (not built yet) is what
// drains the queue, runs the VLM, and commits into images/ + a note file.

async function nextPageId(notebookDir: string, notebookTitle: string): Promise<string> {
  const escapedTitle = notebookTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const idPattern = new RegExp(`^${escapedTitle}_(\\d{4})\\.`)

  const dirsToScan = ['images', 'pending_processing', '.']
  let maxId = 0

  for (const dir of dirsToScan) {
    const entries = await fs.readdir(join(notebookDir, dir)).catch(() => [] as string[])
    for (const entry of entries) {
      const match = entry.match(idPattern)
      if (match) maxId = Math.max(maxId, parseInt(match[1], 10))
    }
  }

  return formatPageId(maxId + 1)
}

export async function queueCapturedImage(
  notebookDir: string,
  notebookTitle: string,
  imageData: Buffer
): Promise<QueuedPage> {
  const id = await nextPageId(notebookDir, notebookTitle)
  const fileName = pageFileName(notebookTitle, id, 'png')
  const path = join(notebookDir, 'pending_processing', fileName)
  await fs.writeFile(path, imageData)
  return { id, fileName, path }
}

export async function queueImportedImages(
  notebookDir: string,
  notebookTitle: string,
  sourcePaths: string[]
): Promise<QueuedPage[]> {
  const queued: QueuedPage[] = []
  // Sequential, not parallel: each page's id depends on scanning what the
  // previous one just wrote, so ids stay monotonic within this batch.
  for (const sourcePath of sourcePaths) {
    const extension = extname(sourcePath).slice(1).toLowerCase()
    if (!SUPPORTED_IMPORT_EXTENSIONS.includes(extension)) {
      throw new Error(
        `"${basename(sourcePath)}" is a .${extension || '?'} file — only ${SUPPORTED_IMPORT_EXTENSIONS.join(', ')} are supported for import right now.`
      )
    }

    const id = await nextPageId(notebookDir, notebookTitle)
    const fileName = pageFileName(notebookTitle, id, extension)
    const path = join(notebookDir, 'pending_processing', fileName)
    await fs.copyFile(sourcePath, path)
    queued.push({ id, fileName, path })
  }
  return queued
}
