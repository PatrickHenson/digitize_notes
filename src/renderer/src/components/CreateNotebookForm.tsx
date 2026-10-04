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
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = Boolean(parentDir) && title.trim().length > 0 && !submitting

  const handleChooseFolder = async (): Promise<void> => {
    const dir = await window.api.notebook.selectParentDirectory()
    if (dir) setParentDir(dir)
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!parentDir) return

    setSubmitting(true)
    setError(null)
    try {
      const notebook = await window.api.notebook.create({ parentDir, title, tags })
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
