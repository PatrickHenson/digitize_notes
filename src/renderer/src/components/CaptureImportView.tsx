import { useCallback, useEffect, useRef, useState } from 'react'
import type { NotebookSummary } from '@shared/notebook'
import type { QueuedPage } from '@shared/capture'
import { containerRectToVideoSourceRect, DEFAULT_CROP_RECT } from '../lib/cropGeometry'
import type { Rotation } from '../lib/cropGeometry'
import CropOverlay from './CropOverlay'

interface CaptureImportViewProps {
  notebook: NotebookSummary
  onClose: () => void
}

function CaptureImportView({ notebook, onClose }: CaptureImportViewProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [queued, setQueued] = useState<QueuedPage[]>([])
  // Persists across captures within this session (component lifetime) —
  // the camera-to-page setup doesn't usually change page to page.
  const [cropRect, setCropRect] = useState(DEFAULT_CROP_RECT)
  // Persists across captures too — a permanently upside-down or sideways
  // camera mount doesn't change page to page either. Only the video
  // display rotates; the crop guide stays in plain screen space (see
  // cropGeometry.ts's containerRectToVideoSourceRect for why that's safe).
  const [rotation, setRotation] = useState<Rotation>(0)
  // Increments on every successful capture; the flash element is keyed by
  // it so React remounts a fresh node each time, restarting the CSS
  // animation (toggling a class instead wouldn't restart it on back-to-back
  // captures unless the old class removal and new one land in separate
  // paints).
  const [flashKey, setFlashKey] = useState(0)

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
    const bounds = previewRef.current?.getBoundingClientRect()
    if (!video || !video.videoWidth || !bounds) return

    const { sx, sy, sWidth, sHeight } = containerRectToVideoSourceRect(
      cropRect,
      bounds.width,
      bounds.height,
      video.videoWidth,
      video.videoHeight,
      rotation
    )

    const canvas = document.createElement('canvas')
    canvas.width = sWidth
    canvas.height = sHeight
    canvas.getContext('2d')?.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return

    setActionError(null)
    try {
      const imageData = await blob.arrayBuffer()
      const page = await window.api.capture.queueImage(notebook.path, notebook.title, imageData)
      setQueued((prev) => [...prev, page])
      setFlashKey((key) => key + 1)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    }
  }, [notebook.path, notebook.title, cropRect, rotation])

  const handleRotate = useCallback((): void => {
    setRotation((prev) => ((prev + 90) % 360) as Rotation)
  }, [])

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

      <div className="camera-preview" ref={previewRef}>
        {cameraError ? (
          <p className="error">Camera unavailable: {cameraError}</p>
        ) : (
          <>
            <div
              className={
                rotation === 90 || rotation === 270
                  ? 'camera-stage camera-stage-rotated'
                  : 'camera-stage'
              }
              style={{ '--rotation': `${rotation}deg` } as React.CSSProperties}
            >
              <video ref={videoRef} autoPlay muted playsInline />
            </div>
            <CropOverlay rect={cropRect} onChange={setCropRect} />
            {flashKey > 0 && <div key={flashKey} className="capture-flash" />}
          </>
        )}
      </div>
      {!cameraError && (
        <p className="shortcut-hint">
          Drag the guide to frame the page — only what&apos;s inside it gets saved.
        </p>
      )}

      <div className="actions-row">
        <button onClick={handleCapture} disabled={Boolean(cameraError)}>
          Capture
        </button>
        <button onClick={handleImport} disabled={importing}>
          {importing ? 'Importing…' : 'Import Images…'}
        </button>
        <button onClick={handleRotate} disabled={Boolean(cameraError)}>
          Rotate
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
