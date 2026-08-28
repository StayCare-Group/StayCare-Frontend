import { describe, it, expect } from 'vitest'
import {
  mapOrderForList,
  mapOrderForDetail,
  formatDate,
  formatTime,
  formatDateTime,
  formatTimelineNote,
  resolveProperty,
  STATUS_LABELS,
} from '@/utils/orderMappers'

/**
 * Tests para src/utils/orderMappers.ts
 *
 * Funciones puras de mapeo y formateo de órdenes:
 * - Transformación de respuestas crudas de la API al formato para componentes Vue.
 * - Formateo de fechas, notas de reasignación y resolución de propiedades.
 * - 100% aisladas, sin mocks de red ni de router.
 */

// ─── Fixture base de orden cruda ───────────────────────────────────────────
const RAW_ORDER_BASE = {
  _id: 'abc123',
  order_number: 'SC-001',
  client_name: 'Alice Smith',
  client_id: 'client-1',
  status: 'washing',
  service_type: 'standard',
  created_at: '2025-01-15T10:00:00Z',
  pickup_date: '2025-01-16T00:00:00Z',
  estimated_bags: 3,
  actual_bags: null,
  special_notes: '',
  total: 50,
  subtotal: 40,
  vat_amount: 10,
  is_invoiced: false,
  property_name: 'Villa Sunrise',
}

// ─── Helpers de formateo puro ───────────────────────────────────────────────

describe('formatDate', () => {
  it('extrae YYYY-MM-DD de un string ISO', () => {
    expect(formatDate('2025-01-16T15:30:00Z')).toBe('2025-01-16')
  })

  it('devuelve string vacío si recibe valor nulo o inválido', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate('invalid-date')).toBe('')
  })
})

describe('formatTimelineNote', () => {
  it('sustituye UUID por el nombre del conductor cuando corresponde', () => {
    const noteWithUuid = 'Reassigned to driver 550e8400-e29b-41d4-a716-446655440000'
    expect(formatTimelineNote(noteWithUuid, 'Carlos Driver')).toBe('Reassigned to driver Carlos Driver')
  })

  it('deja la nota intacta si no tiene prefijo de reasignación', () => {
    expect(formatTimelineNote('Lavado completado')).toBe('Lavado completado')
  })
})

// ─── mapOrderForList ────────────────────────────────────────────────────────

describe('mapOrderForList', () => {
  it('mapea los campos esenciales al shape que usa la lista de órdenes', () => {
    const result = mapOrderForList(RAW_ORDER_BASE)

    expect(result.id).toBe('SC-001')
    expect(result._id).toBe('abc123')
    expect(result.client).toBe('Alice Smith')
    expect(result.status).toBe('washing')
    expect(result.estimatedBags).toBe(3)
    expect(result.actualBags).toBeNull()
    expect(result.total).toBe(50)
    expect(result.propertyName).toBe('Villa Sunrise')
  })

  it('etiqueta el serviceType correctamente', () => {
    const standard = mapOrderForList({ ...RAW_ORDER_BASE, service_type: 'standard' })
    const express = mapOrderForList({ ...RAW_ORDER_BASE, service_type: 'express' })

    expect(standard.serviceType).toBe('Standard (48h)')
    expect(express.serviceType).toBe('Express (24h)')
  })

  it('formatea pickupDate a YYYY-MM-DD y descarta la hora', () => {
    const result = mapOrderForList(RAW_ORDER_BASE)
    expect(result.pickupDate).toBe('2025-01-16')
  })

  it('normaliza statuses con variantes PascalCase o espacios', () => {
    const r1 = mapOrderForList({ ...RAW_ORDER_BASE, status: 'QualityCheck' })
    const r2 = mapOrderForList({ ...RAW_ORDER_BASE, status: 'ready_to_delivery' })
    const r3 = mapOrderForList({ ...RAW_ORDER_BASE, status: 'in_transit' })

    expect(r1.status).toBe('quality_check')
    expect(r2.status).toBe('ready_to_delivery')
    expect(r3.status).toBe('transit')
  })

  it('usa _id como fallback de id cuando no hay order_number', () => {
    const { order_number, ...withoutNumber } = RAW_ORDER_BASE
    const result = mapOrderForList(withoutNumber)
    expect(result.id).toBe('abc123')
  })

  it('devuelve specialNotes vacío si no hay notas', () => {
    const result = mapOrderForList({ ...RAW_ORDER_BASE, special_notes: null })
    expect(result.specialNotes).toBe('')
  })
})

// ─── mapOrderForDetail ──────────────────────────────────────────────────────

describe('mapOrderForDetail', () => {
  it('mapea los campos de precio correctamente', () => {
    const result = mapOrderForDetail(RAW_ORDER_BASE)

    expect(result.total).toBe(50)
    expect(result.subtotal).toBe(40)
    expect(result.vatAmount).toBe(10)
  })

  it('calcula vatAmount como (total - subtotal) cuando no viene explícito', () => {
    const { vat_amount, ...withoutVat } = RAW_ORDER_BASE
    const result = mapOrderForDetail({ ...withoutVat, total: 60, subtotal: 50 })
    expect(result.vatAmount).toBe(10)
  })

  it('mapea isInvoiced desde el campo is_invoiced', () => {
    const invoiced = mapOrderForDetail({ ...RAW_ORDER_BASE, is_invoiced: true })
    const notInvoiced = mapOrderForDetail({ ...RAW_ORDER_BASE, is_invoiced: false })

    expect(invoiced.isInvoiced).toBe(true)
    expect(notInvoiced.isInvoiced).toBe(false)
  })

  it('mapea los items de la orden al shape correcto', () => {
    const raw = {
      ...RAW_ORDER_BASE,
      items: [
        {
          item_id: 'item-1',
          item_code_snapshot: 'SHIRT',
          name_snapshot: 'Shirt',
          quantity: 2,
          unit_price: 5,
          qty_good: 2,
          qty_bad: 0,
          qty_stained: 0,
        },
      ],
    }
    const result = mapOrderForDetail(raw)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].code).toBe('SHIRT')
    expect(result.items[0].name).toBe('Shirt')
    expect(result.items[0].qty).toBe(2)
    expect(result.items[0].unitPrice).toBe(5)
    expect(result.items[0].qtyGood).toBe(2)
  })

  it('devuelve timeline vacío cuando no hay status_history', () => {
    const result = mapOrderForDetail(RAW_ORDER_BASE)
    expect(result.timeline).toEqual([])
  })

  it('mapea cada entrada del timeline con la información de quién lo ejecutó', () => {
    const raw = {
      ...RAW_ORDER_BASE,
      status_history: [
        {
          status: 'washing',
          changed_at: '2025-01-15T11:00:00Z',
          note: 'Started washing',
          changed_by_user_name: 'John Staff',
          changed_by_user_role: 'staff',
          is_system: false,
        },
        {
          status: 'drying',
          changed_at: '2025-01-15T13:00:00Z',
          note: null,
          changed_by_user_name: null,
          changed_by_user_role: null,
          is_system: true,
        },
      ],
    }
    const result = mapOrderForDetail(raw)

    expect(result.timeline).toHaveLength(2)
    expect(result.timeline[0].note).toBe('Started washing')
    expect(result.timeline[0].changedByName).toBe('John Staff')
    expect(result.timeline[0].changedByRole).toBe('staff')
    expect(result.timeline[0].isSystem).toBe(false)
    expect(result.timeline[1].isSystem).toBe(true)
    expect(result.timeline[1].changedByName).toBeNull()
  })

  it('reemplaza un UUID crudo en notas de reasignación por el nombre del conductor', () => {
    const raw = {
      ...RAW_ORDER_BASE,
      driver: { name: 'Carlos Driver' },
      status_history: [
        {
          status: 'assigned',
          changed_at: '2025-01-15T09:00:00Z',
          note: 'Reassigned to driver 550e8400-e29b-41d4-a716-446655440000',
          is_system: false,
          changed_by_user_name: null,
          changed_by_user_role: null,
        },
      ],
    }
    const result = mapOrderForDetail(raw)
    expect(result.timeline[0].note).toBe('Reassigned to driver Carlos Driver')
  })
})
