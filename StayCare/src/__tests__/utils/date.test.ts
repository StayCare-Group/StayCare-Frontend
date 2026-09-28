import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizeDateString,
  getTodayDateString,
  isPastDate,
  getDefaultDateRange,
  getFutureDateString,
  getCurrentWeekBounds,
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

  describe('getCurrentWeekBounds', () => {
    it('calculates Monday to Sunday correctly for a date in the middle of a month', () => {
      const wednesday = new Date(2026, 6, 15, 14, 0, 0) // Wednesday, July 15, 2026
      const { monday, sunday } = getCurrentWeekBounds(wednesday)

      expect(monday.getFullYear()).toBe(2026)
      expect(monday.getMonth()).toBe(6) // July
      expect(monday.getDate()).toBe(13) // Monday July 13
      expect(monday.getHours()).toBe(0)
      expect(monday.getMinutes()).toBe(0)

      expect(sunday.getFullYear()).toBe(2026)
      expect(sunday.getMonth()).toBe(6) // July
      expect(sunday.getDate()).toBe(19) // Sunday July 19
      expect(sunday.getHours()).toBe(23)
      expect(sunday.getMinutes()).toBe(59)
    })

    it('correctly handles month rollover when Monday is in the previous month', () => {
      const wednesday = new Date(2026, 8, 2, 10, 0, 0) // Wednesday, Sep 2, 2026
      const { monday, sunday } = getCurrentWeekBounds(wednesday)

      expect(monday.getFullYear()).toBe(2026)
      expect(monday.getMonth()).toBe(7) // August (previous month)
      expect(monday.getDate()).toBe(31) // Monday Aug 31

      expect(sunday.getFullYear()).toBe(2026)
      expect(sunday.getMonth()).toBe(8) // September
      expect(sunday.getDate()).toBe(6) // Sunday Sep 6
    })

    it('correctly handles month rollover when Sunday is in the next month', () => {
      const tuesday = new Date(2026, 2, 31, 10, 0, 0) // Tuesday, March 31, 2026
      const { monday, sunday } = getCurrentWeekBounds(tuesday)

      expect(monday.getFullYear()).toBe(2026)
      expect(monday.getMonth()).toBe(2) // March
      expect(monday.getDate()).toBe(30) // Monday Mar 30

      expect(sunday.getFullYear()).toBe(2026)
      expect(sunday.getMonth()).toBe(3) // April (next month)
      expect(sunday.getDate()).toBe(5) // Sunday Apr 5
    })

    it('correctly handles year rollover (e.g. New Year week)', () => {
      const thursday = new Date(2026, 0, 1, 15, 0, 0) // Thursday, Jan 1, 2026
      const { monday, sunday } = getCurrentWeekBounds(thursday)

      expect(monday.getFullYear()).toBe(2025) // Previous year
      expect(monday.getMonth()).toBe(11) // December
      expect(monday.getDate()).toBe(29) // Monday Dec 29, 2025

      expect(sunday.getFullYear()).toBe(2026) // New year
      expect(sunday.getMonth()).toBe(0) // January
      expect(sunday.getDate()).toBe(4) // Sunday Jan 4, 2026
    })

    it('handles when reference date is Monday or Sunday', () => {
      const mondayInput = new Date(2026, 7, 31, 12, 0, 0) // Monday Aug 31, 2026
      const boundsMon = getCurrentWeekBounds(mondayInput)
      expect(boundsMon.monday.getDate()).toBe(31)
      expect(boundsMon.sunday.getDate()).toBe(6)

      const sundayInput = new Date(2026, 8, 6, 22, 0, 0) // Sunday Sep 6, 2026
      const boundsSun = getCurrentWeekBounds(sundayInput)
      expect(boundsSun.monday.getDate()).toBe(31)
      expect(boundsSun.sunday.getDate()).toBe(6)
    })
  })
})
