import { describe, it, expect } from 'vitest'
import {
  DEFAULT_VAT_RATE,
  DEFAULT_VAT_PERCENTAGE,
  calculateVatBreakdown,
  formatCurrency,
} from '@/utils/pricing'

describe('pricing utils', () => {
  describe('constants', () => {
    it('DEFAULT_VAT_RATE is 0.18', () => {
      expect(DEFAULT_VAT_RATE).toBe(0.18)
    })

    it('DEFAULT_VAT_PERCENTAGE is 18', () => {
      expect(DEFAULT_VAT_PERCENTAGE).toBe(18)
    })
  })

  describe('calculateVatBreakdown', () => {
    it('calculates subtotal, vatAmount and total correctly', () => {
      const result = calculateVatBreakdown(100)
      expect(result.subtotal).toBe(100)
      expect(result.vatAmount).toBe(18)
      expect(result.total).toBe(118)
    })

    it('returns zeros for a zero subtotal', () => {
      const result = calculateVatBreakdown(0)
      expect(result.subtotal).toBe(0)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(0)
    })

    it('handles decimal subtotals correctly', () => {
      const result = calculateVatBreakdown(50.5)
      expect(result.subtotal).toBe(50.5)
      expect(result.vatAmount).toBeCloseTo(9.09, 5)
      expect(result.total).toBeCloseTo(59.59, 5)
    })

    it('accepts a custom vatRate', () => {
      const result = calculateVatBreakdown(200, 0.10)
      expect(result.subtotal).toBe(200)
      expect(result.vatAmount).toBe(20)
      expect(result.total).toBe(220)
    })

    it('handles NaN or invalid subtotal defensively returning zeros', () => {
      const result = calculateVatBreakdown(NaN)
      expect(result.subtotal).toBe(0)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(0)
    })

    it('handles invalid vatRate defensively returning subtotal as total', () => {
      const result = calculateVatBreakdown(100, NaN)
      expect(result.subtotal).toBe(100)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(100)
    })
  })

  describe('formatCurrency', () => {
    it('formats an integer amount with two decimals and euro symbol', () => {
      expect(formatCurrency(10)).toBe('€10.00')
    })

    it('formats a decimal amount correctly', () => {
      expect(formatCurrency(12.5)).toBe('€12.50')
      expect(formatCurrency(99.99)).toBe('€99.99')
    })

    it('formats zero as €0.00', () => {
      expect(formatCurrency(0)).toBe('€0.00')
    })

    it('handles NaN defensively returning €0.00', () => {
      expect(formatCurrency(NaN)).toBe('€0.00')
    })
  })
})
