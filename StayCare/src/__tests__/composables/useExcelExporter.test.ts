import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExcelExporter } from '@/composables/useExcelExporter'
import * as XLSX from 'xlsx'
import { fetchOrderById } from '@/api/orders'
import { fetchInvoiceById } from '@/api/invoices'

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
    json_to_sheet: vi.fn((rows) => ({ _rows: rows })),
    aoa_to_sheet: vi.fn((aoa) => ({ _aoa: aoa })),
  },
  writeFile: vi.fn(),
}))

vi.mock('@/api/orders', () => ({
  fetchOrderById: vi.fn(),
}))

vi.mock('@/api/invoices', () => ({
  fetchInvoiceById: vi.fn(),
}))

vi.mock('@/api/items', () => ({
  fetchAllItems: vi.fn().mockResolvedValue([
    { name: 'Bath Towel' },
    { name: 'Bed Sheet' },
    { name: 'Pillow Case' },
  ]),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const dict: Record<string, string> = {
        'excel.orderId': 'ID Orden',
        'excel.client': 'Cliente',
        'excel.property': 'Propiedad',
        'excel.pickupDate': 'Fecha Recogida',
        'excel.serviceType': 'Tipo Servicio',
        'excel.status': 'Estado',
        'excel.bags': 'Bolsas',
        'excel.specialNotes': 'Notas Especiales',
        'excel.total': 'Total (€)',
        'excel.grandTotal': 'Total General (€)',
        'excel.ordersSheet': 'Órdenes',
        'excel.orderDetailTitle': 'DETALLE DE ORDEN DE SERVICIO',
        'excel.itemsTitle': 'DESGLOSE DE PRENDAS E ÍTEMS',
        'excel.item': 'Ítem / Prenda',
        'excel.code': 'Código',
        'excel.qtyGood': 'Cant. Buena',
        'excel.qtyStained': 'Cant. Manchada',
        'excel.qtyDamaged': 'Cant. Dañada',
        'excel.totalReceived': 'Total Recibido',
        'excel.unitPrice': 'Precio Unitario (€)',
        'excel.noItems': 'Sin ítems detallados',
        'excel.flatSheet': 'Órdenes',
        'excel.createdDate': 'Fecha Creación',
        'excel.qualityCheckBy': 'USUARIO CONTROL CALIDAD',
        'excel.timestampArrived': 'Fecha y Hora de Recepción',
        'excel.timestampIroning': 'Fecha y Hora de Plancha',
        'excel.timestampDelivered': 'Fecha y Hora de Entrega',
      }
      return dict[key] ?? key
    },
  }),
}))

describe('useExcelExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportOrdersDetailed', () => {
    it('incluye las notas especiales tanto en la hoja resumen como en la hoja de detalle individual', async () => {
      const mockOrderList = [
        {
          _id: 'ord-123',
          id: 'ORD-001',
          client: 'Hotel Test',
          propertyName: 'Villa 1',
          pickupDate: '2026-09-01',
          serviceType: 'Express (24h)',
          status: 'pending',
          actualBags: null,
          estimatedBags: 3,
          specialNotes: 'Fragile fabrics only',
          total: 150,
        },
      ]

      vi.mocked(fetchOrderById).mockResolvedValueOnce({
        order: {
          order_number: 'ORD-001',
          client_name: 'Hotel Test',
          property_name: 'Villa 1',
          pickup_date: '2026-09-01',
          service_type: 'express',
          status: 'pending',
          special_notes: 'Fragile fabrics only, handle with care',
          total: 150,
        },
        items: [
          {
            name_snapshot: 'Towel',
            item_code: 'TW-01',
            qty_good: 2,
            qty_stained: 1,
            qty_damaged: 0,
            unit_price: 50,
            subtotal: 150,
          },
        ],
      })

      const { exportOrdersDetailed } = useExcelExporter()
      await exportOrdersDetailed(mockOrderList)

      // 1. Verificar llamada json_to_sheet para la hoja resumen
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            'ID Orden': 'ORD-001',
            'Notas Especiales': 'Fragile fabrics only',
          }),
        ],
        expect.objectContaining({
          header: expect.arrayContaining(['ID Orden', 'Notas Especiales']),
        })
      )

      // 2. Verificar llamada aoa_to_sheet para el detalle
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Notas Especiales:', 'Fragile fabrics only, handle with care'],
        ])
      )

      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  describe('exportOrdersFlat', () => {
    it('incluye las notas especiales en la fila plana de cada orden', async () => {
      const mockOrderList = [
        {
          _id: 'ord-456',
          id: 'ORD-002',
          client: 'Resort Beach',
          propertyName: 'Building A',
          createdAt: '2026-09-01',
          pickupDate: '2026-09-02',
          serviceType: 'Standard (48h)',
          status: 'arrived',
          actualBags: 2,
          estimatedBags: 2,
          specialNotes: 'Do not use bleach',
          total: 80,
        },
      ]

      vi.mocked(fetchOrderById).mockResolvedValueOnce({
        order: {
          created_at: '2026-09-01',
          pickup_date: '2026-09-02',
          special_notes: 'Do not use bleach - extra delicate',
        },
        items: [
          {
            name: 'Bed Sheet',
            quantity_good: 4,
          },
        ],
        status_history: [
          {
            status: 'received',
            changed_at: '2026-09-01T10:00:00.000Z',
          },
        ],
      })

      const { exportOrdersFlat } = useExcelExporter()
      const result = await exportOrdersFlat(mockOrderList)

      expect(result).toEqual({ exported: 1 })
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            'ID Orden': 'ORD-002',
            'Notas Especiales': 'Do not use bleach - extra delicate',
            'Bed Sheet': 4,
            'Bath Towel': 0,
            'Pillow Case': 0,
          }),
        ],
        expect.objectContaining({
          header: expect.arrayContaining([
            'ID Orden',
            'Notas Especiales',
            'Bath Towel',
            'Bed Sheet',
            'Pillow Case',
          ]),
        })
      )
      expect(XLSX.writeFile).toHaveBeenCalled()
    })

    it('respeta el límite de máximo 200 órdenes', async () => {
      const manyOrders = Array.from({ length: 201 }, (_, i) => ({
        _id: `ord-${i}`,
        id: `ORD-${i}`,
      }))

      const { exportOrdersFlat } = useExcelExporter()
      const result = await exportOrdersFlat(manyOrders)

      expect(result).toEqual({ error: 'limit', count: 201 })
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })
  })
})
