import { useRef } from 'react'
import type { Rect, ResizeHandle } from '../lib/cropGeometry'
import { moveRect, resizeRect } from '../lib/cropGeometry'

interface CropOverlayProps {
  rect: Rect
  onChange: (rect: Rect) => void
}

type DragMode = 'move' | ResizeHandle

interface DragState {
  mode: DragMode
  startClientX: number
  startClientY: number
  startRect: Rect
  bounds: DOMRect
}

const HANDLES: ResizeHandle[] = ['nw', 'ne', 'sw', 'se']

function CropOverlay({ rect, onChange }: CropOverlayProps): React.JSX.Element {
  const overlayRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)

  // A single stable handler (not a per-render curried factory) so no ref
  // is read while producing the onPointerDown prop itself — only once the
  // event actually fires. Which handle/the rect body was grabbed comes
  // from a data-mode attribute rather than a closure per element.
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    const bounds = overlayRef.current?.getBoundingClientRect()
    if (!bounds) return

    const mode = event.currentTarget.dataset.mode as DragMode
    drag.current = {
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: rect,
      bounds
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent): void => {
    const state = drag.current
    if (!state) return

    const dxPct = ((event.clientX - state.startClientX) / state.bounds.width) * 100
    const dyPct = ((event.clientY - state.startClientY) / state.bounds.height) * 100

    onChange(
      state.mode === 'move'
        ? moveRect(state.startRect, dxPct, dyPct)
        : resizeRect(state.startRect, state.mode, dxPct, dyPct)
    )
  }

  const endDrag = (): void => {
    drag.current = null
  }

  return (
    <div
      ref={overlayRef}
      className="crop-overlay"
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="crop-rect"
        data-mode="move"
        style={{
          left: `${rect.x}%`,
          top: `${rect.y}%`,
          width: `${rect.width}%`,
          height: `${rect.height}%`
        }}
        onPointerDown={handlePointerDown}
      >
        {HANDLES.map((handle) => (
          <span
            key={handle}
            data-mode={handle}
            className={`crop-handle crop-handle-${handle}`}
            onPointerDown={handlePointerDown}
          />
        ))}
      </div>
    </div>
  )
}

export default CropOverlay
