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

// Clockwise rotation applied to the live video display (not the crop
// guide, which always stays in plain unrotated container space — see
// CaptureImportView.tsx). For "upside down pages": a permanently
// upside-down or sideways camera mount needs a persistent correction,
// not a per-page fix.
export type Rotation = 0 | 90 | 180 | 270

// Maps a container-percent rect (as the user sees and drags it, in plain
// unrotated screen space) to actual source-video pixel coordinates.
//
// Two things are composed here:
// 1. Undo the display rotation to find where that rect falls on the
//    *unrotated* video stage. For a 90-degree-multiple rotation this is
//    an axis permutation/flip, not real trigonometry — e.g. a 90deg
//    clockwise display rotation means a point's container-relative
//    offset (dx, dy) from center came from stage-local offset (dy, -dx)
//    (verified against CSS's rotate(90deg): a point above center, offset
//    (0, -h), lands to the right of center, (h, 0); inverting that
//    forward mapping gives the rule used in ROTATION_INVERSE below).
//    A rotated stage is also sized to fill the container after rotating,
//    so 90/270 swap which of the container's width/height the stage's
//    own width/height correspond to.
// 2. Apply object-fit: cover's scale/offset (same as the no-rotation
//    case) using the stage's own size, not the container's, to land on
//    real source-video pixels.
export function containerRectToVideoSourceRect(
  rect: Rect,
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
  rotation: Rotation = 0
): SourceRect {
  const stageWidth = rotation === 90 || rotation === 270 ? containerHeight : containerWidth
  const stageHeight = rotation === 90 || rotation === 270 ? containerWidth : containerHeight

  const containerX = (rect.x / 100) * containerWidth
  const containerY = (rect.y / 100) * containerHeight
  const containerW = (rect.width / 100) * containerWidth
  const containerH = (rect.height / 100) * containerHeight

  const toStageCorner = (containerPointX: number, containerPointY: number): [number, number] => {
    const dx = containerPointX - containerWidth / 2
    const dy = containerPointY - containerHeight / 2
    const [stageDx, stageDy] = ROTATION_INVERSE[rotation](dx, dy)
    return [stageDx + stageWidth / 2, stageDy + stageHeight / 2]
  }

  const [x1, y1] = toStageCorner(containerX, containerY)
  const [x2, y2] = toStageCorner(containerX + containerW, containerY + containerH)
  const stageRect = {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  }

  const scale = Math.max(stageWidth / videoWidth, stageHeight / videoHeight)
  const offsetX = (stageWidth - videoWidth * scale) / 2
  const offsetY = (stageHeight - videoHeight * scale) / 2

  return {
    sx: (stageRect.x - offsetX) / scale,
    sy: (stageRect.y - offsetY) / scale,
    sWidth: stageRect.width / scale,
    sHeight: stageRect.height / scale
  }
}

// Maps a center-relative (dx, dy) in rotated/display space back to the
// center-relative offset it came from on the unrotated stage.
const ROTATION_INVERSE: Record<Rotation, (dx: number, dy: number) => [number, number]> = {
  0: (dx, dy) => [dx, dy],
  90: (dx, dy) => [dy, -dx],
  180: (dx, dy) => [-dx, -dy],
  270: (dx, dy) => [-dy, dx]
}
