import { useState } from 'react'
import type { NotebookSummary } from '@shared/notebook'
import Welcome from './components/Welcome'
import CreateNotebookForm from './components/CreateNotebookForm'
import CaptureImportView from './components/CaptureImportView'

type View = 'welcome' | 'create' | 'capture'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('welcome')
  const [notebook, setNotebook] = useState<NotebookSummary | null>(null)
  const [welcomeError, setWelcomeError] = useState<string | null>(null)

  const handleOpen = async (): Promise<void> => {
    setWelcomeError(null)
    try {
      const opened = await window.api.notebook.promptOpen()
      if (opened) {
        setNotebook(opened)
        setView('capture')
      }
    } catch (err) {
      setWelcomeError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCreated = (created: NotebookSummary): void => {
    setNotebook(created)
    setView('capture')
  }

  const handleClose = (): void => {
    setNotebook(null)
    setView('welcome')
  }

  if (view === 'create') {
    return <CreateNotebookForm onCreated={handleCreated} onCancel={() => setView('welcome')} />
  }

  if (view === 'capture' && notebook) {
    return <CaptureImportView notebook={notebook} onClose={handleClose} />
  }

  return <Welcome onCreate={() => setView('create')} onOpen={handleOpen} error={welcomeError} />
}

export default App
