import { describe, expect, it } from 'vitest'
import {
  containerRectToVideoSourceRect,
  DEFAULT_CROP_RECT,
  moveRect,
  resizeRect
} from '../cropGeometry'

describe('DEFAULT_CROP_RECT', () => {
  it('is centered and within bounds', () => {
    expect(DEFAULT_CROP_RECT.x).toBeGreaterThan(0)
    expect(DEFAULT_CROP_RECT.y).toBeGreaterThan(0)
    expect(DEFAULT_CROP_RECT.x + DEFAULT_CROP_RECT.width).toBeLessThan(100)
    expect(DEFAULT_CROP_RECT.y + DEFAULT_CROP_RECT.height).toBeLessThan(100)
  })
})

describe('moveRect', () => {
  const rect = { x: 20, y: 20, width: 30, height: 40 }

  it('translates by the given delta', () => {
    expect(moveRect(rect, 10, 5)).toEqual({ x: 30, y: 25, width: 30, height: 40 })
  })

  it('clamps so the rect never leaves the container', () => {
    expect(moveRect(rect, 1000, 1000)).toEqual({ x: 70, y: 60, width: 30, height: 40 })
    expect(moveRect(rect, -1000, -1000)).toEqual({ x: 0, y: 0, width: 30, height: 40 })
  })
})

describe('resizeRect', () => {
  const rect = { x: 20, y: 20, width: 30, height: 30 }

  it('se handle grows from the fixed nw corner', () => {
    expect(resizeRect(rect, 'se', 10, 10)).toEqual({ x: 20, y: 20, width: 40, height: 40 })
  })

  it('nw handle grows from the fixed se corner', () => {
    expect(resizeRect(rect, 'nw', -10, -10)).toEqual({ x: 10, y: 10, width: 40, height: 40 })
  })

  it('enforces a minimum size instead of shrinking arbitrarily small', () => {
    // Anchor (nw) is at (20, 20), far from any container edge, so this
    // isolates the min-size floor from the separate 0-100 boundary clamp.
    const result = resizeRect(rect, 'se', -25, -25)
    expect(result.width).toBeCloseTo(10)
    expect(result.height).toBeCloseTo(10)
  })

  it('still clamps to the container edge when the anchor is near it', () => {
    const result = resizeRect(rect, 'se', -1000, -1000)
    expect(result.width).toBeCloseTo(20)
    expect(result.height).toBeCloseTo(20)
  })

  it('clamps the dragged corner to the container bounds', () => {
    const result = resizeRect(rect, 'se', 1000, 1000)
    expect(result.x + result.width).toBeCloseTo(100)
    expect(result.y + result.height).toBeCloseTo(100)
  })
})

describe('containerRectToVideoSourceRect', () => {
  it('maps a full-container rect to the full video when aspect ratios match', () => {
    const result = containerRectToVideoSourceRect(
      { x: 0, y: 0, width: 100, height: 100 },
      800,
      600,
      1600,
      1200
    )
    expect(result).toEqual({ sx: 0, sy: 0, sWidth: 1600, sHeight: 1200 })
  })

  it('accounts for cover-mode cropping when the video is wider than the container', () => {
    // 16:9 video in a 4:3 container — cover crops the video's left/right edges.
    const result = containerRectToVideoSourceRect(
      { x: 0, y: 0, width: 100, height: 100 },
      800,
      600,
      1920,
      1080
    )
    // scale = max(800/1920, 600/1080) = 600/1080; displayed video width > 800,
    // so the source rect's width should be less than the full 1920px source.
    expect(result.sWidth).toBeLessThan(1920)
    expect(result.sHeight).toBeCloseTo(1080)
  })

  it('maps a centered sub-rect proportionally', () => {
    const result = containerRectToVideoSourceRect(
      { x: 25, y: 25, width: 50, height: 50 },
      800,
      600,
      800,
      600
    )
    expect(result).toEqual({ sx: 200, sy: 150, sWidth: 400, sHeight: 300 })
  })
})
