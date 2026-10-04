interface WelcomeProps {
  onCreate: () => void
  onOpen: () => void
  error: string | null
}

function Welcome({ onCreate, onOpen, error }: WelcomeProps): React.JSX.Element {
  return (
    <div className="screen">
      <h1>digitize_notes</h1>
      <p className="subtitle">Scan, preview, and digitize handwritten notes to markdown.</p>
      <div className="actions-row">
        <button onClick={onCreate}>Create New Notebook</button>
        <button onClick={onOpen}>Open Existing Notebook</button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

export default Welcome
