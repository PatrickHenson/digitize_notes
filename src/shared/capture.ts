// See docs/requirements.md items 2, 5, 8 and docs/architecture.md's
// pipeline — a captured/imported page is queued into pending_processing/
// with its id already assigned (not when processing later completes).

export interface QueuedPage {
  id: string
  fileName: string
  path: string
}

// Zero-padded 4 digits, per decisions.md "Id format" — counter only ever
// increases, a deleted/processed page's id is never reused.
export function formatPageId(n: number): string {
  return String(n).padStart(4, '0')
}

export function pageFileName(notebookTitle: string, id: string, extension: string): string {
  return `${notebookTitle}_${id}.${extension}`
}

// Import is restricted to image types we can actually queue today.
// PDF is in the long-term spec (docs/requirements.md item 2) but needs
// page-rasterization support not built yet — see docs/architecture.md.
export const SUPPORTED_IMPORT_EXTENSIONS = ['jpg', 'jpeg', 'png']
