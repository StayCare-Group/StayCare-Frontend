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

/**
 * Returns the first and last calendar days (`YYYY-MM-DD`) of a `YYYY-MM` month.
 * Uses local calendar math (no `toISOString()`), so leap years and all timezones stay exact.
 */
export function getMonthDateRange(yearMonth: string): { from: string; to: string } {
  const match = String(yearMonth ?? '').trim().match(/^(\d{4})-(\d{2})$/)
  if (!match) return { from: '', to: '' }

  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return { from: '', to: '' }
  }

  const lastDay = new Date(year, month, 0).getDate()
  const ym = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(lastDay).padStart(2, '0')}`,
  }
}

/**
 * Returns the first and last calendar days (`YYYY-MM-DD`) of a calendar year.
 */
export function getYearDateRange(yearInput: number | string): { from: string; to: string } {
  const year = Number(yearInput)
  if (!Number.isInteger(year) || year < 1970 || year > 9999) {
    return { from: '', to: '' }
  }
  const y = String(year).padStart(4, '0')
  return {
    from: `${y}-01-01`,
    to: `${y}-12-31`,
  }
}

/**
 * Builds the list of the last `monthsCount` months (starting from `refDate`)
 * with localized labels for `<select>` controls.
 */
export function buildRecentMonthOptions(
  monthsCount: number = 12,
  refDate: Date = new Date(),
  locale: string = 'en'
): { value: string; label: string }[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const options: { value: string; label: string }[] = []

  for (let i = 0; i < monthsCount; i++) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const rawLabel = formatter.format(d)
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
    options.push({ value, label })
  }

  return options
}

/**
 * Builds the list of the last `yearsCount` calendar years starting from `refDate`.
 */
export function buildRecentYearOptions(
  yearsCount: number = 10,
  refDate: Date = new Date()
): number[] {
  const currentYear = refDate.getFullYear()
  const years: number[] = []
  for (let i = 0; i < yearsCount; i++) {
    years.push(currentYear - i)
  }
  return years
}


