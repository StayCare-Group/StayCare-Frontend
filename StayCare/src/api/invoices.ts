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

// Re-export mappers from utils for backward compatibility
export { mapInvoiceForList, mapInvoiceForDetail } from '../utils/invoiceMappers'

