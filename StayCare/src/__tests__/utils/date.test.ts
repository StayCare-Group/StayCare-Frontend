import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizeDateString,
  getTodayDateString,
  isPastDate,
  getDefaultDateRange,
  getFutureDateString,
} from '@/utils/date'

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('normalizeDateString', () => {
    it('returns empty string for null, undefined or empty input', () => {
      expect(normalizeDateString(null)).toBe('')
      expect(normalizeDateString(undefined)).toBe('')
      expect(normalizeDateString('')).toBe('')
    })

    it('preserves YYYY-MM-DD prefix from string inputs', () => {
      expect(normalizeDateString('2026-08-25')).toBe('2026-08-25')
      expect(normalizeDateString('2026-08-25T14:30:00.000Z')).toBe('2026-08-25')
    })

    it('formats valid Date objects to YYYY-MM-DD', () => {
      const d = new Date(2026, 7, 15) // August 15, 2026
      expect(normalizeDateString(d)).toBe('2026-08-15')
    })

    it('returns empty string for invalid dates', () => {
      expect(normalizeDateString(new Date('invalid-date'))).toBe('')
      expect(normalizeDateString('not-a-date')).toBe('')
    })
  })

  describe('getTodayDateString', () => {
    it('returns today date in YYYY-MM-DD format', () => {
      const today = getTodayDateString()
      expect(today).toBe('2026-08-31')
    })
  })

  describe('isPastDate', () => {
    it('returns true if target date is strictly before reference date', () => {
      expect(isPastDate('2026-08-20', '2026-08-31')).toBe(true)
    })

    it('returns false if target date is equal to reference date', () => {
      expect(isPastDate('2026-08-31', '2026-08-31')).toBe(false)
    })

    it('returns false if target date is after reference date', () => {
      expect(isPastDate('2026-09-01', '2026-08-31')).toBe(false)
    })

    it('defaults reference date to today', () => {
      expect(isPastDate('2026-08-30')).toBe(true)
      expect(isPastDate('2026-09-01')).toBe(false)
    })

    it('returns false if target or reference is invalid', () => {
      expect(isPastDate(null, '2026-08-31')).toBe(false)
      expect(isPastDate('2026-08-20', '')).toBe(false)
    })
  })

  describe('getDefaultDateRange', () => {
    it('returns a range of 30 days before today up to today by default', () => {
      const range = getDefaultDateRange()
      expect(range.to).toBe('2026-08-31')
      expect(range.from).toBe('2026-08-01')
    })

    it('supports custom number of days', () => {
      const range = getDefaultDateRange(7)
      expect(range.to).toBe('2026-08-31')
      expect(range.from).toBe('2026-08-24')
    })
  })

  describe('getFutureDateString', () => {
    it('returns a date 30 days in the future by default', () => {
      const future = getFutureDateString()
      expect(future).toBe('2026-09-30')
    })

    it('supports custom number of days in the future', () => {
      const future = getFutureDateString(10)
      expect(future).toBe('2026-09-10')
    })

    it('supports custom fromDate', () => {
      const base = new Date(2026, 0, 1) // Jan 1, 2026
      const future = getFutureDateString(15, base)
      expect(future).toBe('2026-01-16')
    })
  })
})
