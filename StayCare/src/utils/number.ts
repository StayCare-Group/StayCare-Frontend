const integerFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
  useGrouping: true,
})

const currencyAmountFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
})

/**
 * Formats an integer/count using `.` as the thousands separator (e.g. 1000 -> "1.000").
 */
export function formatNumberWithDots(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return String(value)
  return integerFormatter.format(num)
}

/**
 * Formats a currency amount using `.` as the thousands separator and `,` for decimals
 * (e.g. 6500.5 -> "6.500,50").
 */
export function formatCurrencyAmountWithDots(value: number): string {
  if (!Number.isFinite(value)) return '0,00'
  return currencyAmountFormatter.format(value)
}

