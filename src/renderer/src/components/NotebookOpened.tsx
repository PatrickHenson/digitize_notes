import type { NotebookSummary } from '@shared/notebook'

interface NotebookOpenedProps {
  notebook: NotebookSummary
  onClose: () => void
}

function NotebookOpened({ notebook, onClose }: NotebookOpenedProps): React.JSX.Element {
  return (
    <div className="screen">
      <h1>{notebook.title}</h1>
      <dl className="notebook-meta">
        <dt>Location</dt>
        <dd>{notebook.path}</dd>
        <dt>Date</dt>
        <dd>{notebook.date}</dd>
        <dt>Tags</dt>
        <dd>{notebook.tags.length > 0 ? notebook.tags.join(', ') : '—'}</dd>
      </dl>
      <p className="placeholder-note">
        Notebook opened. Capture/Import and Review/Edit views are not built yet — this is a
        placeholder confirming the notebook flow works end to end.
      </p>
      <div className="actions-row">
        <button onClick={onClose}>Close Notebook</button>
      </div>
    </div>
  )
}

export default NotebookOpened
