import { describe, it, expect } from 'vitest'
import {
  mapInvoiceForList,
  mapInvoiceForDetail,
  getInvoiceOrdersText,
  getInvoiceClientName,
  getInvoiceClientId,
  capitalize,
  toNumber,
} from '@/utils/invoiceMappers'

describe('invoiceMappers', () => {
  describe('capitalize & toNumber helpers', () => {
    it('capitalizes string properly', () => {
      expect(capitalize('pending')).toBe('Pending')
      expect(capitalize('paid')).toBe('Paid')
      expect(capitalize('')).toBe('')
    })

    it('converts value to valid finite number or fallback to 0', () => {
      expect(toNumber(123.45)).toBe(123.45)
      expect(toNumber('50.2')).toBe(50.2)
      expect(toNumber(null)).toBe(0)
      expect(toNumber(undefined)).toBe(0)
      expect(toNumber('invalid')).toBe(0)
    })
  })

  describe('getInvoiceOrdersText', () => {
    it('returns dash for null or undefined orders', () => {
      expect(getInvoiceOrdersText(null)).toBe('—')
      expect(getInvoiceOrdersText(undefined)).toBe('—')
      expect(getInvoiceOrdersText([])).toBe('—')
    })

    it('formats single string/number order', () => {
      expect(getInvoiceOrdersText('ORD-123')).toBe('ORD-123')
      expect(getInvoiceOrdersText(456)).toBe('456')
    })

    it('formats array of order objects or identifiers', () => {
      const orders = [
        { order_number: 'ORD-001' },
        { _id: 'ORD-002' },
        'ORD-003',
      ]
      expect(getInvoiceOrdersText(orders)).toBe('ORD-001, ORD-002, ORD-003')
    })
  })

  describe('getInvoiceClientName & getInvoiceClientId', () => {
    it('extracts client name and id from client object', () => {
      const clientObj = {
        _id: 'client-1',
        name: 'Hotel California',
      }
      expect(getInvoiceClientName({}, clientObj)).toBe('Hotel California')
      expect(getInvoiceClientId({}, clientObj)).toBe('client-1')
    })

    it('falls back to raw invoice properties when clientObj is absent', () => {
      const inv = {
        client_name: 'Acme Corp',
        client_id: 'client-99',
      }
      expect(getInvoiceClientName(inv, null)).toBe('Acme Corp')
      expect(getInvoiceClientId(inv, null)).toBe('client-99')
    })
  })

  describe('mapInvoiceForList', () => {
    it('correctly maps raw backend invoice to list presentation format', () => {
      const raw = {
        _id: 'inv-100',
        invoice_number: 'INV-2026-001',
        client: {
          _id: 'user-1',
          name: 'StayFresh Hotels',
        },
        orders: [{ order_number: 'ORD-501' }],
        issue_date: '2026-08-30T10:00:00.000Z',
        due_date: '2026-09-30T10:00:00.000Z',
        status: 'pending',
        total: '240.50',
      }

      const result = mapInvoiceForList(raw)

      expect(result).toEqual({
        id: 'INV-2026-001',
        _id: 'inv-100',
        orderId: 'ORD-501',
        client: 'StayFresh Hotels',
        clientId: 'user-1',
        issueDate: '2026-08-30',
        dueDate: '2026-09-30',
        status: 'Pending',
        grandTotal: 240.5,
      })
    })

    it('handles minimal/empty invoice defensively', () => {
      const result = mapInvoiceForList({})
      expect(result).toEqual({
        id: '',
        _id: '',
        orderId: '—',
        client: '',
        clientId: '',
        issueDate: '',
        dueDate: '',
        status: '',
        grandTotal: 0,
      })
    })
  })

  describe('mapInvoiceForDetail', () => {
    it('correctly maps invoice for detail view with line items and payments', () => {
      const raw = {
        _id: 'inv-200',
        invoice_number: 'INV-2026-002',
        client_name: 'Grand Hotel',
        client_id: 'client-5',
        orders: ['ORD-999'],
        issue_date: '2026-08-15',
        due_date: '2026-09-15',
        status: 'paid',
        payments: [{ method: 'card', amount: 150 }],
        line_items: [
          {
            item_code: 'ITM-01',
            description: 'Bed sheets',
            quantity: 10,
            unit_price: 5.5,
            total_price: 55,
          },
        ],
        subtotal: 100,
        vat_amount: 18,
        total: 118,
      }

      const result = mapInvoiceForDetail(raw)

      expect(result).toEqual({
        id: 'INV-2026-002',
        _id: 'inv-200',
        orderId: 'ORD-999',
        orders: ['ORD-999'],
        client: 'Grand Hotel',
        clientId: 'client-5',
        issueDate: '2026-08-15',
        dueDate: '2026-09-15',
        status: 'Paid',
        paymentMethod: 'Card',
        items: [
          {
            code: 'ITM-01',
            name: 'Bed sheets',
            qty: 10,
            unitPrice: 5.5,
            total: 55,
          },
        ],
        subtotal: 100,
        expressCharge: 0,
        vat: 18,
        grandTotal: 118,
        notes: '',
      })
    })
  })
})
