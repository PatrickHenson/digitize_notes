import { describe, expect, it } from 'vitest'
import { formatPageId, pageFileName } from '../capture'

describe('formatPageId', () => {
  it('zero-pads to 4 digits', () => {
    expect(formatPageId(1)).toBe('0001')
    expect(formatPageId(42)).toBe('0042')
  })

  it('does not truncate ids past 4 digits', () => {
    expect(formatPageId(12345)).toBe('12345')
  })
})

describe('pageFileName', () => {
  it('joins notebook title, id, and extension', () => {
    expect(pageFileName('Personal Notes', '0003', 'png')).toBe('Personal Notes_0003.png')
  })
})
