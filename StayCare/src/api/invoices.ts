import { apiFetch } from './client'

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

export function mapInvoiceForList(inv: any) {
  const firstOrder = Array.isArray(inv.orders) ? inv.orders[0] : null
  return {
    id: inv.invoice_number ?? inv._id,
    _id: inv._id,
    orderId: firstOrder?.order_number ?? firstOrder ?? '',
    client: inv.client?.company_name ?? inv.client ?? '',
    clientId: inv.client?._id ?? '',
    issueDate: formatDate(inv.issue_date),
    dueDate: formatDate(inv.due_date),
    status: capitalize(inv.status),
    grandTotal: inv.total ?? 0,
  }
}

export function mapInvoiceForDetail(inv: any) {
  const firstOrder = Array.isArray(inv.orders) ? inv.orders[0] : null
  return {
    id: inv.invoice_number ?? inv._id,
    _id: inv._id,
    orderId: firstOrder?.order_number ?? firstOrder ?? '',
    client: inv.client?.company_name ?? inv.client ?? '',
    clientId: inv.client?._id ?? '',
    issueDate: formatDate(inv.issue_date),
    dueDate: formatDate(inv.due_date),
    status: capitalize(inv.status),
    paymentMethod: inv.payments?.length ? capitalize(inv.payments[0].method) : null,
    items: (inv.line_items ?? []).map((li: any) => ({
      code: '',
      name: li.description,
      qty: li.quantity,
      unitPrice: li.unit_price ?? 0,
      total: li.total_price ?? 0,
    })),
    subtotal: inv.subtotal ?? 0,
    expressCharge: 0,
    vat: inv.vat_amount ?? 0,
    grandTotal: inv.total ?? 0,
    notes: '',
  }
}
