// Shared between main and renderer — see docs/requirements.md items 1, 7, 24
// and docs/note-format.md "Title page" for the spec this implements.

export interface NotebookSummary {
  title: string
  path: string
  tags: string[]
  date: string
}

export interface CreateNotebookInput {
  parentDir: string
  title: string
  tags: string
}

// Characters invalid on Windows/macOS/Linux paths, per decisions.md
// "Restrict notebook-name input rather than sanitize after" — the input
// itself should refuse these characters as the user types, not silently
// rewrite an invalid name later.
// Control characters are intentionally included, not an accidental match.
// eslint-disable-next-line no-control-regex
export const INVALID_TITLE_CHARS = /[\\/:*?"<>|\x00-\x1f]/g

export function stripInvalidTitleChars(input: string): string {
  return input.replace(INVALID_TITLE_CHARS, '')
}

// Windows disallows trailing dots/spaces in a directory name.
export function trimTrailingDotsAndSpaces(input: string): string {
  return input.replace(/[. ]+$/, '')
}

export function sanitizeTitle(input: string): string {
  return trimTrailingDotsAndSpaces(stripInvalidTitleChars(input)).trim()
}

export function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  )
}
