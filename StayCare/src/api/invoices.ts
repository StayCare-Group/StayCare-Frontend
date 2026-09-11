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

/**
 * Downloads a CSV file containing all invoices that match the given filters.
 * Hits GET /api/invoices/export — a single SQL query with JOINs on the backend,
 * replacing the previous pattern of N individual fetchInvoiceById calls.
 *
 * @param params - Same filter params accepted by GET /api/invoices (status, client_id, from, to, search)
 * @throws Error if the server returns a non-OK response
 */
export async function downloadInvoicesCsv(params?: Record<string, string>): Promise<void> {
  const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL ?? ''
  const query = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
  const url = `${API_BASE_URL}/api/invoices/export${query}`

  const res = await fetch(url, { credentials: 'include' })

  if (!res.ok) {
    // Try to parse the error message from the JSON envelope
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.message ?? `Export failed (${res.status})`)
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  anchor.href = objectUrl
  anchor.download = `Facturas-StayCare-${dateStr}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

// Re-export mappers from utils for backward compatibility
export { mapInvoiceForList, mapInvoiceForDetail } from '../utils/invoiceMappers'
