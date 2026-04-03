import { apiFetch } from './client'
import { getClientDisplayName, getClientId } from '../utils/client'

export async function fetchInvoices(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch(`/api/invoices${query}`)
}

export async function fetchInvoiceById(id: string) {
  return apiFetch(`/api/invoices/${id}`)
}

export async function createInvoice(payload: any) {
  return apiFetch('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function recordPayment(id: string, payload: any) {
  return apiFetch(`/api/invoices/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const s = String(dateStr)
  // Plain YYYY-MM-DD with no time component – return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // ISO datetime – parse and use LOCAL date parts (browser timezone)
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function capitalize(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function toNumber(value: any): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function getInvoicePk(inv: any): string {
  return String(inv?._id ?? inv?.id ?? inv?.invoice_id ?? '')
}

function getInvoiceClientName(inv: any, clientObj: any): string {
  if (clientObj) return getClientDisplayName(clientObj)
  return String(inv?.client_name ?? inv?.contact_person ?? inv?.client ?? '')
}

function getInvoiceClientId(inv: any, clientObj: any): string {
  if (clientObj) return getClientId(clientObj)
  return String(inv?.client_id ?? inv?.client ?? '')
}

function getInvoiceOrderId(firstOrder: any): string {
  if (!firstOrder) return ''
  if (typeof firstOrder === 'string' || typeof firstOrder === 'number') return String(firstOrder)
  return String(firstOrder.order_number ?? firstOrder._id ?? firstOrder.id ?? '')
}

export function mapInvoiceForList(inv: any) {
  const firstOrder = Array.isArray(inv.orders) ? inv.orders[0] : null
  const clientObj = typeof inv.client === 'object' && inv.client ? inv.client : null
  const invoicePk = getInvoicePk(inv)
  return {
    id: String(inv.invoice_number ?? invoicePk),
    _id: invoicePk,
    orderId: getInvoiceOrderId(firstOrder),
    client: getInvoiceClientName(inv, clientObj),
    clientId: getInvoiceClientId(inv, clientObj),
    issueDate: formatDate(inv.issue_date),
    dueDate: formatDate(inv.due_date),
    status: capitalize(inv.status),
    grandTotal: toNumber(inv.total),
  }
}

export function mapInvoiceForDetail(inv: any) {
  const firstOrder = Array.isArray(inv.orders) ? inv.orders[0] : null
  const clientObj = typeof inv.client === 'object' && inv.client ? inv.client : null
  const invoicePk = getInvoicePk(inv)
  return {
    id: String(inv.invoice_number ?? invoicePk),
    _id: invoicePk,
    orderId: getInvoiceOrderId(firstOrder),
    client: getInvoiceClientName(inv, clientObj),
    clientId: getInvoiceClientId(inv, clientObj),
    issueDate: formatDate(inv.issue_date),
    dueDate: formatDate(inv.due_date),
    status: capitalize(inv.status),
    paymentMethod: inv.payments?.length ? capitalize(inv.payments[0].method) : null,
    items: (inv.line_items ?? []).map((li: any) => ({
      code: '',
      name: li.description,
      qty: li.quantity,
      unitPrice: toNumber(li.unit_price),
      total: toNumber(li.total_price),
    })),
    subtotal: toNumber(inv.subtotal),
    expressCharge: 0,
    vat: toNumber(inv.vat_amount),
    grandTotal: toNumber(inv.total),
    notes: '',
  }
}
