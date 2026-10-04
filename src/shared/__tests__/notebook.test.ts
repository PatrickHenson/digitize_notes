import { describe, expect, it } from 'vitest'
import { formatDateRange, parseTags, sanitizeTitle, stripInvalidTitleChars } from '../notebook'

describe('stripInvalidTitleChars', () => {
  it('removes filesystem-invalid characters', () => {
    expect(stripInvalidTitleChars('Leadership 1:1 "Notes"?')).toBe('Leadership 11 Notes')
  })

  it('leaves valid characters untouched', () => {
    expect(stripInvalidTitleChars('Leadership Notes (2026)')).toBe('Leadership Notes (2026)')
  })
})

describe('sanitizeTitle', () => {
  it('trims trailing dots and spaces', () => {
    expect(sanitizeTitle('Notes.. ')).toBe('Notes')
  })
})

describe('parseTags', () => {
  it('splits, trims, dedupes, and drops empties', () => {
    expect(parseTags('work, personal, work,  , home')).toEqual(['work', 'personal', 'home'])
  })

  it('returns an empty array for blank input', () => {
    expect(parseTags('')).toEqual([])
  })
})

describe('formatDateRange', () => {
  it('returns undefined when both dates are blank', () => {
    expect(formatDateRange('', '')).toBeUndefined()
  })

  it('returns a single date when only start is set', () => {
    expect(formatDateRange('2026-10-03', '')).toBe('2026-10-03')
  })

  it('collapses an identical start/end to a single date', () => {
    expect(formatDateRange('2026-10-03', '2026-10-03')).toBe('2026-10-03')
  })

  it('formats a real range', () => {
    expect(formatDateRange('2026-10-01', '2026-10-20')).toBe('2026-10-01 – 2026-10-20')
  })

  it('ignores an orphan end date with no start', () => {
    expect(formatDateRange('', '2026-10-20')).toBeUndefined()
  })
})
