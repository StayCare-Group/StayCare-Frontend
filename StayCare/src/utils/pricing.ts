/**
 * Default VAT rate used across the application for visual price breakdowns.
 * The backend independently calculates and stores the definitive VAT amounts.
 * This constant must remain in sync with the backend's hardcoded 18% rate.
 */
export const DEFAULT_VAT_RATE = 0.18
export const DEFAULT_VAT_PERCENTAGE = 18

export interface VatBreakdown {
  subtotal: number
  vatAmount: number
  total: number
}

/**
 * Calculates a visual VAT breakdown (subtotal, vatAmount, total) for display purposes.
 * The definitive financial values are always calculated and stored by the backend.
 *
 * @param subtotal - The pre-tax subtotal amount.
 * @param vatRate  - The VAT rate as a decimal (e.g. 0.18 for 18%). Defaults to DEFAULT_VAT_RATE.
 */
export function calculateVatBreakdown(subtotal: number, vatRate: number = DEFAULT_VAT_RATE): VatBreakdown {
  const safeSubtotal = Number(subtotal) || 0
  const safeRate = Number(vatRate) || 0
  const vatAmount = safeSubtotal * safeRate
  const total = safeSubtotal + vatAmount
  return { subtotal: safeSubtotal, vatAmount, total }
}

/**
 * Formats a numeric amount as a Euro currency string with two decimal places.
 * Intended for display only — do not use for financial calculations.
 *
 * @example formatCurrency(12.5) => "€12.50"
 */
export function formatCurrency(amount: number): string {
  const value = Number(amount) || 0
  return `€${value.toFixed(2)}`
}
