import { useCallback, useEffect, useRef, useState } from 'react'
import type { NotebookSummary } from '@shared/notebook'
import type { QueuedPage } from '@shared/capture'

interface CaptureImportViewProps {
  notebook: NotebookSummary
  onClose: () => void
}

function CaptureImportView({ notebook, onClose }: CaptureImportViewProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [queued, setQueued] = useState<QueuedPage[]>([])

  useEffect(() => {
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch((err) => {
        setCameraError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const handleCapture = useCallback(async (): Promise<void> => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return

    setActionError(null)
    try {
      const imageData = await blob.arrayBuffer()
      const page = await window.api.capture.queueImage(notebook.path, notebook.title, imageData)
      setQueued((prev) => [...prev, page])
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    }
  }, [notebook.path, notebook.title])

  // Space/Enter trigger a capture, except when a button (or other
  // interactive element) has focus — then let it handle the key itself,
  // so e.g. tabbing to "Close Notebook" and pressing Enter still works.
  useEffect(() => {
    const INTERACTIVE_TAGS = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'])

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      if (INTERACTIVE_TAGS.has((event.target as HTMLElement).tagName)) return

      event.preventDefault()
      void handleCapture()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCapture])

  const handleImport = async (): Promise<void> => {
    setActionError(null)
    setImporting(true)
    try {
      const pages = await window.api.capture.promptImportImages(notebook.path, notebook.title)
      if (pages) setQueued((prev) => [...prev, ...pages])
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="screen capture-screen">
      <div className="capture-header">
        <h1>{notebook.title}</h1>
        <button onClick={onClose}>Close Notebook</button>
      </div>

      <div className="camera-preview">
        {cameraError ? (
          <p className="error">Camera unavailable: {cameraError}</p>
        ) : (
          <video ref={videoRef} autoPlay muted playsInline />
        )}
      </div>

      <div className="actions-row">
        <button onClick={handleCapture} disabled={Boolean(cameraError)}>
          Capture
        </button>
        <button onClick={handleImport} disabled={importing}>
          {importing ? 'Importing…' : 'Import Images…'}
        </button>
        <span className="shortcut-hint">Space or Enter to capture</span>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      <p className="placeholder-note">
        Queued this session: {queued.length}. These sit in pending_processing/ until the background
        processing worker (not built yet) picks them up.
      </p>

      {queued.length > 0 && (
        <div className="thumbnail-strip">
          {queued.map((page) => (
            <figure key={page.id} className="thumbnail">
              <img src={`file://${page.path}`} alt={`Page ${page.id}`} />
              <figcaption>{page.id}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}

export default CaptureImportView
