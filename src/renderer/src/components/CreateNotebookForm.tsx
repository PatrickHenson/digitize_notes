import { useState } from 'react'
import type { NotebookSummary } from '@shared/notebook'
import { stripInvalidTitleChars } from '@shared/notebook'

interface CreateNotebookFormProps {
  onCreated: (notebook: NotebookSummary) => void
  onCancel: () => void
}

function CreateNotebookForm({ onCreated, onCancel }: CreateNotebookFormProps): React.JSX.Element {
  const [parentDir, setParentDir] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Both dates are optional — a notebook can have no date at all. An end
  // date without a start date is the only combination that doesn't mean
  // anything, alongside the usual end-before-start case.
  const hasOrphanEndDate = Boolean(endDate) && !startDate
  const hasBackwardsRange = Boolean(startDate) && Boolean(endDate) && endDate < startDate
  const dateRangeValid = !hasOrphanEndDate && !hasBackwardsRange
  const canSubmit = Boolean(parentDir) && title.trim().length > 0 && dateRangeValid && !submitting

  const handleChooseFolder = async (): Promise<void> => {
    const dir = await window.api.notebook.selectParentDirectory()
    if (dir) setParentDir(dir)
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!parentDir || !dateRangeValid) return

    setSubmitting(true)
    setError(null)
    try {
      const notebook = await window.api.notebook.create({
        parentDir,
        title,
        tags,
        startDate,
        endDate
      })
      onCreated(notebook)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <h1>Create New Notebook</h1>

      <label className="field">
        <span>Location</span>
        <div className="folder-picker">
          <button type="button" onClick={handleChooseFolder}>
            Choose Folder…
          </button>
          <span className="folder-path">{parentDir ?? 'No folder selected'}</span>
        </div>
      </label>

      <label className="field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(stripInvalidTitleChars(event.target.value))}
          placeholder="e.g. Leadership Notes"
          autoFocus
        />
      </label>

      <label className="field">
        <span>Tags</span>
        <input
          type="text"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="work, personal"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Date (optional)</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label className="field">
          <span>End date (optional, for a range)</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>

      {hasOrphanEndDate && <p className="error">Add a start date too, or clear the end date.</p>}
      {hasBackwardsRange && <p className="error">End date can&apos;t be before the start date.</p>}
      {error && <p className="error">{error}</p>}

      <div className="actions-row">
        <button type="submit" disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default CreateNotebookForm
