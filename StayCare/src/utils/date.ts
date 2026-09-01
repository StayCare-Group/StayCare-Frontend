/**
 * Formats a Date object or ISO string to a plain YYYY-MM-DD calendar date string
 * using local date components to preserve local calendar days.
 */
export function normalizeDateString(dateInput?: string | Date | null): string {
  if (!dateInput) return ''
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim()
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
    const d = new Date(trimmed)
    if (isNaN(d.getTime())) return ''
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return ''
    return `${dateInput.getFullYear()}-${String(dateInput.getMonth() + 1).padStart(2, '0')}-${String(dateInput.getDate()).padStart(2, '0')}`
  }
  return ''
}

/**
 * Returns today's calendar date as a YYYY-MM-DD string in local time.
 */
export function getTodayDateString(): string {
  return normalizeDateString(new Date())
}

/**
 * Checks if a target YYYY-MM-DD date string is strictly before a reference date string (defaults to today).
 */
export function isPastDate(targetDateStr?: string | Date | null, referenceDateStr: string = getTodayDateString()): boolean {
  const target = normalizeDateString(targetDateStr)
  const ref = normalizeDateString(referenceDateStr)
  if (!target || !ref) return false
  return target < ref
}

/**
 * Returns a default date range object with `from` and `to` formatted as YYYY-MM-DD strings.
 * Defaults to the last `days` days (default: 30) up to today in local time.
 */
export function getDefaultDateRange(days: number = 30): { from: string; to: string } {
  const now = new Date()
  const past = new Date()
  past.setDate(now.getDate() - days)

  return {
    from: normalizeDateString(past),
    to: normalizeDateString(now),
  }
}

/**
 * Returns a future calendar date as a YYYY-MM-DD string in local time, adding `days` to `fromDate` (defaults to today).
 */
export function getFutureDateString(days: number = 30, fromDate: Date = new Date()): string {
  const target = new Date(fromDate)
  target.setDate(target.getDate() + days)
  return normalizeDateString(target)
}

