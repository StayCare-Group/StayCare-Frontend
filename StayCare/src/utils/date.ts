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
