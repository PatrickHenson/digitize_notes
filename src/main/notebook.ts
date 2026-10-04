import { promises as fs } from 'fs'
import { join } from 'path'
import type { CreateNotebookInput, NotebookSummary } from '../shared/notebook'
import { parseTags, sanitizeTitle } from '../shared/notebook'

// See docs/note-format.md "Title page" and docs/requirements.md item 7 for
// the notebook directory layout this implements:
//   <title>/
//     <title>.md          <- title page (frontmatter + free-text description)
//     images/
//     pending_processing/

function titlePagePath(notebookDir: string, title: string): string {
  return join(notebookDir, `${title}.md`)
}

function serializeTitlePage(title: string, date: string, tags: string[]): string {
  const tagsLine = `[${tags.map((tag) => JSON.stringify(tag)).join(', ')}]`
  return `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\ntags: ${tagsLine}\n---\n\n`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createNotebook(input: CreateNotebookInput): Promise<NotebookSummary> {
  const title = sanitizeTitle(input.title)
  if (!title) {
    throw new Error('Notebook title cannot be empty.')
  }

  const tags = parseTags(input.tags)
  const notebookDir = join(input.parentDir, title)

  if (await pathExists(notebookDir)) {
    throw new Error(`"${title}" already exists in that folder.`)
  }

  const date = todayIso()
  await fs.mkdir(join(notebookDir, 'images'), { recursive: true })
  await fs.mkdir(join(notebookDir, 'pending_processing'), { recursive: true })
  await fs.writeFile(
    titlePagePath(notebookDir, title),
    serializeTitlePage(title, date, tags),
    'utf8'
  )

  return { title, path: notebookDir, tags, date }
}

export async function openNotebook(notebookDir: string): Promise<NotebookSummary> {
  const dirName = notebookDir.split(/[/\\]/).filter(Boolean).pop() ?? ''
  const candidate = titlePagePath(notebookDir, dirName)

  if (!(await pathExists(candidate))) {
    throw new Error(
      `"${dirName}" doesn't look like a notebook (no title page found at ${dirName}.md).`
    )
  }

  const raw = await fs.readFile(candidate, 'utf8')
  const frontmatter = parseTitlePageFrontmatter(raw)

  return {
    title: frontmatter.title ?? dirName,
    path: notebookDir,
    tags: frontmatter.tags ?? [],
    date: frontmatter.date ?? todayIso()
  }
}

function parseTitlePageFrontmatter(raw: string): {
  title?: string
  date?: string
  tags?: string[]
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return {}

  const result: { title?: string; date?: string; tags?: string[] } = {}
  for (const line of match[1].split('\n')) {
    const titleMatch = line.match(/^title:\s*"(.*)"$/)
    if (titleMatch) result.title = titleMatch[1]

    const dateMatch = line.match(/^date:\s*(\S+)$/)
    if (dateMatch) result.date = dateMatch[1]

    const tagsMatch = line.match(/^tags:\s*\[(.*)\]$/)
    if (tagsMatch) {
      result.tags = tagsMatch[1]
        .split(',')
        .map((tag) => tag.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
    }
  }
  return result
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
