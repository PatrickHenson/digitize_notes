// Pure geometry for the capture crop guide — see CropOverlay.tsx for the
// interactive wiring. Everything here works in percent-of-container units
// so it stays valid across window resizes without an observer, since
// .camera-preview's CSS aspect-ratio is fixed.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

const MIN_SIZE_PCT = 10

// .camera-preview is CSS-locked to 4:3; the default guide is a centered,
// Letter-portrait-shaped rectangle sized to 70% of the container's height.
const CONTAINER_ASPECT = 4 / 3 // width / height
const PAGE_ASPECT = 8.5 / 11 // width / height
const DEFAULT_HEIGHT_PCT = 70
const DEFAULT_WIDTH_PCT = (DEFAULT_HEIGHT_PCT * PAGE_ASPECT) / CONTAINER_ASPECT

export const DEFAULT_CROP_RECT: Rect = {
  x: (100 - DEFAULT_WIDTH_PCT) / 2,
  y: (100 - DEFAULT_HEIGHT_PCT) / 2,
  width: DEFAULT_WIDTH_PCT,
  height: DEFAULT_HEIGHT_PCT
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function moveRect(startRect: Rect, dxPct: number, dyPct: number): Rect {
  return {
    ...startRect,
    x: clamp(startRect.x + dxPct, 0, 100 - startRect.width),
    y: clamp(startRect.y + dyPct, 0, 100 - startRect.height)
  }
}

// Resizes by dragging one corner; the opposite corner stays anchored in
// place. Works in terms of the two corner points (not width/height deltas)
// so a drag that crosses past the anchor flips cleanly instead of going
// negative, and the minimum-size clamp can't desync position from size.
export function resizeRect(
  startRect: Rect,
  handle: ResizeHandle,
  dxPct: number,
  dyPct: number
): Rect {
  const anchorX = handle.includes('w') ? startRect.x + startRect.width : startRect.x
  const anchorY = handle.includes('n') ? startRect.y + startRect.height : startRect.y

  let movingX = handle.includes('w') ? startRect.x + dxPct : startRect.x + startRect.width + dxPct
  let movingY = handle.includes('n') ? startRect.y + dyPct : startRect.y + startRect.height + dyPct
  movingX = clamp(movingX, 0, 100)
  movingY = clamp(movingY, 0, 100)

  if (Math.abs(movingX - anchorX) < MIN_SIZE_PCT) {
    const direction = Math.sign(movingX - anchorX) || (handle.includes('w') ? -1 : 1)
    movingX = clamp(anchorX + direction * MIN_SIZE_PCT, 0, 100)
  }
  if (Math.abs(movingY - anchorY) < MIN_SIZE_PCT) {
    const direction = Math.sign(movingY - anchorY) || (handle.includes('n') ? -1 : 1)
    movingY = clamp(anchorY + direction * MIN_SIZE_PCT, 0, 100)
  }

  return {
    x: Math.min(anchorX, movingX),
    y: Math.min(anchorY, movingY),
    width: Math.abs(anchorX - movingX),
    height: Math.abs(anchorY - movingY)
  }
}

export interface SourceRect {
  sx: number
  sy: number
  sWidth: number
  sHeight: number
}

// Maps a container-percent rect to actual source-video pixel coordinates,
// accounting for object-fit: cover (the video is uniformly scaled to fill
// the container, so most of it maps 1:1 but some edges are cropped off —
// every point within the container always corresponds to a real video
// pixel, unlike object-fit: contain where letterbox bars would not).
export function containerRectToVideoSourceRect(
  rect: Rect,
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number
): SourceRect {
  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight)
  const offsetX = (containerWidth - videoWidth * scale) / 2
  const offsetY = (containerHeight - videoHeight * scale) / 2

  const containerX = (rect.x / 100) * containerWidth
  const containerY = (rect.y / 100) * containerHeight
  const containerW = (rect.width / 100) * containerWidth
  const containerH = (rect.height / 100) * containerHeight

  return {
    sx: (containerX - offsetX) / scale,
    sy: (containerY - offsetY) / scale,
    sWidth: containerW / scale,
    sHeight: containerH / scale
  }
}
