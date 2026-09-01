import { getClientDisplayName, getClientId } from './client'
import { normalizeDateString } from './date'

export function formatDate(dateStr: string): string {
  return normalizeDateString(dateStr)
}

export function capitalize(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function toNumber(value: any): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function getInvoicePk(inv: any): string {
  return String(inv?._id ?? inv?.id ?? inv?.invoice_id ?? '')
}

export function getInvoiceClientName(inv: any, clientObj: any): string {
  if (clientObj) return getClientDisplayName(clientObj)
  return String(inv?.client_name ?? inv?.contact_person ?? inv?.client ?? '')
}

export function getInvoiceClientId(inv: any, clientObj: any): string {
  if (clientObj) return getClientId(clientObj)
  return String(inv?.client_id ?? inv?.client ?? '')
}

export function getInvoiceOrdersText(orders: any): string {
  if (!orders) return '—'
  const list = Array.isArray(orders) ? orders : [orders]
  const formatted = list.map(o => {
    if (typeof o === 'string' || typeof o === 'number') return String(o)
    return String(o?.order_number ?? o?._id ?? o?.id ?? '')
  }).filter(Boolean)
  return formatted.length ? formatted.join(', ') : '—'
}

export function mapInvoiceForList(inv: any) {
  const clientObj = typeof inv.client === 'object' && inv.client ? inv.client : null
  const invoicePk = getInvoicePk(inv)
  return {
    id: String(inv.invoice_number ?? invoicePk),
    _id: invoicePk,
    orderId: getInvoiceOrdersText(inv.orders),
    client: getInvoiceClientName(inv, clientObj),
    clientId: getInvoiceClientId(inv, clientObj),
    issueDate: formatDate(inv.issue_date),
    dueDate: formatDate(inv.due_date),
    status: capitalize(inv.status),
    grandTotal: toNumber(inv.total),
  }
}

export function mapInvoiceForDetail(inv: any) {
  const clientObj = typeof inv.client === 'object' && inv.client ? inv.client : null
  const invoicePk = getInvoicePk(inv)
  return {
    id: String(inv.invoice_number ?? invoicePk),
    _id: invoicePk,
    orderId: getInvoiceOrdersText(inv.orders),
    orders: Array.isArray(inv.orders) ? inv.orders : [],
    client: getInvoiceClientName(inv, clientObj),
    clientId: getInvoiceClientId(inv, clientObj),
    issueDate: formatDate(inv.issue_date),
    dueDate: formatDate(inv.due_date),
    status: capitalize(inv.status),
    paymentMethod: inv.payments?.length ? capitalize(inv.payments[0].method) : null,
    items: (inv.line_items ?? inv.items ?? []).map((li: any) => ({
      code: li.code || li.item_code || '',
      name: li.description || li.name || li.item_name || li.name_snapshot || '',
      qty: toNumber(li.quantity ?? li.qty ?? 1),
      unitPrice: toNumber(li.unit_price ?? li.unitPrice),
      total: toNumber(li.total_price ?? li.total),
    })),
    subtotal: toNumber(inv.subtotal),
    expressCharge: 0,
    vat: toNumber(inv.vat_amount),
    grandTotal: toNumber(inv.total),
    notes: '',
  }
}
